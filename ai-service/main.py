import os
import base64
import json
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, date

from fastapi import FastAPI, Depends, HTTPException, Security, UploadFile, File, Form, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from jose import jwt, JWTError
from pydantic import BaseModel
from pypdf import PdfReader
from dotenv import load_dotenv

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# LangChain Imports
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage, AIMessage
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_community.utilities import SQLDatabase
from langchain_community.agent_toolkits import create_sql_agent
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter

# Initialize Logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ai-service")

load_dotenv()

app = FastAPI(title="MediPulse AI Service", version="1.0.0")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# JWT Security Setup
security = HTTPBearer()
JWT_SECRET = os.getenv("JWT_SECRET", "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970")

def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security)) -> Dict[str, Any]:
    token = credentials.credentials
    try:
        # Decode the Base64 key as done in Java
        secret_bytes = base64.b64decode(JWT_SECRET)
        payload = jwt.decode(token, secret_bytes, algorithms=["HS256"])
        email = payload.get("sub")
        role = payload.get("role")
        if not email or not role:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: missing subject or role claims"
            )
        return {"email": email, "role": role}
    except JWTError as e:
        logger.error(f"JWT Verification failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or expired security token: {str(e)}"
        )

# Database Setup
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "oracle")
DB_HOST = os.getenv("DB_HOST", "mysql-db")
DB_PORT = os.getenv("DB_PORT", "3306")
DB_NAME = os.getenv("DB_NAME", "hospital_db")

DB_URI = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
engine = create_engine(DB_URI, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# LangChain Model setup
GOOGLE_API_KEY = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
if not GOOGLE_API_KEY:
    logger.warning("GEMINI_API_KEY or GOOGLE_API_KEY environment variable is not set!")

llm = ChatGoogleGenerativeAI(
    model="gemini-1.5-flash",
    google_api_key=GOOGLE_API_KEY,
    temperature=0.0
)

# Connect LangChain SQLDatabase
try:
    db = SQLDatabase.from_uri(DB_URI)
    sql_agent = create_sql_agent(
        llm=llm,
        db=db,
        agent_type="zero-shot-react-description",
        verbose=True,
        handle_parsing_errors=True
    )
    logger.info("LangChain SQL Agent successfully initialized.")
except Exception as e:
    logger.error(f"Failed to initialize SQL Database agent: {str(e)}")
    db = None
    sql_agent = None

# Pure Python Vector Store fallback to avoid Visual C++ dependency issues on Windows
def cosine_similarity(v1, v2):
    dot_product = sum(a*b for a, b in zip(v1, v2))
    magnitude1 = sum(a*a for a in v1) ** 0.5
    magnitude2 = sum(b*b for b in v2) ** 0.5
    if not magnitude1 or not magnitude2:
        return 0.0
    return dot_product / (magnitude1 * magnitude2)

class SimpleVectorStore:
    def __init__(self, persist_directory: str, embedding_function):
        self.persist_directory = persist_directory
        self.embedding_function = embedding_function
        self.file_path = os.path.join(persist_directory, "vector_store.json")
        self.documents: List[Document] = []
        self.embeddings_data: List[List[float]] = []
        self._load()

    def _load(self):
        if not os.path.exists(self.persist_directory):
            os.makedirs(self.persist_directory, exist_ok=True)
        if os.path.exists(self.file_path):
            try:
                with open(self.file_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    for item in data:
                        doc = Document(
                            page_content=item["page_content"],
                            metadata=item["metadata"]
                        )
                        self.documents.append(doc)
                        self.embeddings_data.append(item["embedding"])
                logger.info(f"Loaded {len(self.documents)} documents from simple vector store.")
            except Exception as e:
                logger.error(f"Failed to load vector store: {e}")

    def _save(self):
        try:
            data = []
            for doc, emb in zip(self.documents, self.embeddings_data):
                data.append({
                    "page_content": doc.page_content,
                    "metadata": doc.metadata,
                    "embedding": emb
                })
            with open(self.file_path, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            logger.info("Saved simple vector store content successfully.")
        except Exception as e:
            logger.error(f"Failed to save vector store: {e}")

    def add_documents(self, documents: List[Document]):
        texts = [doc.page_content for doc in documents]
        new_embeddings = self.embedding_function.embed_documents(texts)
        self.documents.extend(documents)
        self.embeddings_data.extend(new_embeddings)
        self._save()

    def similarity_search(self, query: str, k: int = 3) -> List[Document]:
        if not self.documents:
            return []
        query_vector = self.embedding_function.embed_query(query)
        scored_docs = []
        for doc, emb in zip(self.documents, self.embeddings_data):
            score = cosine_similarity(query_vector, emb)
            scored_docs.append((doc, score))
        scored_docs.sort(key=lambda x: x[1], reverse=True)
        return [doc for doc, score in scored_docs[:k]]

    def as_retriever(self, search_kwargs: Dict[str, Any] = None):
        k = search_kwargs.get("k", 3) if search_kwargs else 3
        class SimpleRetriever:
            def __init__(self, store, k_val):
                self.store = store
                self.k_val = k_val
            def get_relevant_documents(self, query: str) -> List[Document]:
                return self.store.similarity_search(query, k=self.k_val)
        return SimpleRetriever(self, k)

# RAG / Vector Store Setup
CHROMA_PERSIST_DIR = os.getenv("CHROMA_PERSIST_DIR", "./chroma_db")
embeddings = GoogleGenerativeAIEmbeddings(
    model="models/embedding-001",
    google_api_key=GOOGLE_API_KEY
)
vector_store = SimpleVectorStore(
    persist_directory=CHROMA_PERSIST_DIR,
    embedding_function=embeddings
)

# In-Memory Conversational Memory mapping: session_id -> list of messages
session_memories: Dict[str, List[Dict[str, str]]] = {}

# Pydantic Schemas
class ChatRequest(BaseModel):
    message: str
    session_id: str

class ChatResponse(BaseModel):
    response: str
    category: str  # SQL, RAG, GENERAL

# Helper to contextualize user queries using memory
def get_contextualized_query(query: str, chat_history: List[Dict[str, str]]) -> str:
    if not chat_history:
        return query

    # Convert to LangChain message structure
    lc_history = []
    for msg in chat_history[-6:]:  # Keep last 3 turns
        if msg["role"] == "user":
            lc_history.append(HumanMessage(content=msg["content"]))
        else:
            lc_history.append(AIMessage(content=msg["content"]))

    rephrase_prompt = ChatPromptTemplate.from_messages([
        ("system", "Given a chat history and the latest user question which might reference context in the chat history, formulate a standalone question which can be understood without the chat history. Do NOT answer the question, just reformulate it if needed and otherwise return it as is. Keep it clear and concise."),
        MessagesPlaceholder(variable_name="chat_history"),
        ("human", "{question}")
    ])

    chain = rephrase_prompt | llm
    try:
        response = chain.invoke({"chat_history": lc_history, "question": query})
        rephrased = response.content.strip()
        logger.info(f"Rephrased query: '{query}' -> '{rephrased}'")
        return rephrased
    except Exception as e:
        logger.error(f"Rephraser failed, using original: {str(e)}")
        return query

# Endpoints
@app.post("/ai/chat", response_model=ChatResponse)
def chat_assistant(request: ChatRequest, user: Dict[str, Any] = Depends(get_current_user)):
    query = request.message
    session_id = request.session_id

    # Retrieve history
    if session_id not in session_memories:
        session_memories[session_id] = []
    history = session_memories[session_id]

    # Contextualize query
    standalone_query = get_contextualized_query(query, history)

    # Classify Query
    classification_prompt = f"""
    You are a routing agent for a hospital AI assistant named MediPulse AI. Classify the user query into one of three categories:
    1. "SQL": If the query is about specific patient details, doctor schedules, lists of patients, years of experience, billing details, revenue, appointments, or medical histories in our database.
    2. "RAG": If the query is about general hospital policy, treatment guidelines, insurance requirements, SOPs, or admission protocols.
    3. "GENERAL": If the query is a greeting, basic chat, or general advice.

    Return ONLY one of the words: "SQL", "RAG", or "GENERAL". Do not include any punctuation or extra words.

    Query: {standalone_query}
    """
    try:
        classification_res = llm.invoke(classification_prompt).content.strip().upper()
    except Exception as e:
        logger.error(f"LLM Classification failed: {str(e)}")
        classification_res = "GENERAL"

    logger.info(f"Query classified as: {classification_res}")

    response_text = ""
    # Process by category
    if "SQL" in classification_res and sql_agent:
        try:
            # Inject extra instructions for DB Queries to protect schema and formats
            db_query_prompt = f"""
            You are a hospital DB assistant. Answer the user question by querying the database.
            Only answer questions using the database information.
            Question: {standalone_query}
            """
            response_text = sql_agent.run(db_query_prompt)
        except Exception as e:
            logger.error(f"SQL Agent failed: {str(e)}")
            response_text = "I encountered an error querying the hospital records database. Please try rephrasing your question."
    elif "RAG" in classification_res:
        try:
            # Query Vector Store
            retriever = vector_store.as_retriever(search_kwargs={"k": 3})
            docs = retriever.get_relevant_documents(standalone_query)
            context = "\n\n".join([doc.page_content for doc in docs])
            
            rag_prompt = f"""
            You are the MediPulse AI Knowledge Assistant. Answer the user's question using ONLY the provided hospital policy and SOP context.
            If the answer cannot be found in the context, reply: "I cannot find the answer in the current hospital policy records. Please verify with administration."
            
            Context:
            {context}
            
            Question:
            {standalone_query}
            
            Answer:
            """
            response_text = llm.invoke(rag_prompt).content.strip()
        except Exception as e:
            logger.error(f"RAG Retrieval failed: {str(e)}")
            response_text = "I failed to query the hospital policy database. Please contact an admin."
    else:
        # GENERAL chat with context
        system_prompt = "You are MediPulse AI, an intelligent clinical and hospital operations assistant. Help the user with general inquiries politely."
        messages = [("system", system_prompt)]
        for msg in history[-6:]:
            messages.append((msg["role"], msg["content"]))
        messages.append(("human", standalone_query))
        
        try:
            prompt = ChatPromptTemplate.from_messages(messages)
            chain = prompt | llm
            response_text = chain.invoke({}).content.strip()
        except Exception as e:
            logger.error(f"General chat chain failed: {str(e)}")
            response_text = "I'm having trouble thinking right now. Could you repeat that?"

    # Update history
    history.append({"role": "user", "content": query})
    history.append({"role": "assistant", "content": response_text})
    session_memories[session_id] = history

    category_mapped = "GENERAL"
    if "SQL" in classification_res:
        category_mapped = "SQL"
    elif "RAG" in classification_res:
        category_mapped = "RAG"

    return ChatResponse(response=response_text, category=category_mapped)

@app.post("/ai/upload-report")
async def upload_medical_report(file: UploadFile = File(...), user: Dict[str, Any] = Depends(get_current_user)):
    # Doctor and Admin only
    if user["role"] not in ["ADMIN", "DOCTOR"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF reports are supported currently.")

    try:
        # Read PDF and extract text
        reader = PdfReader(file.file)
        text_content = ""
        for page in reader.pages:
            text_content += page.extract_text() or ""

        if not text_content.strip():
            raise ValueError("No extractable text found in PDF.")

        # Prompt Gemini to extract details in JSON format
        prompt = f"""
        You are an expert clinical summarizer. Read the following medical report text and extract the key patient, diagnosis, medicine, and doctor information.
        Return ONLY a raw JSON string matching the structure below. Do NOT use markdown code blocks or triple backticks.

        JSON structure:
        {{
          "patient_name": "Extract patient name",
          "diagnosis": "Extract main diagnosis/condition",
          "medicines": ["medicine 1", "medicine 2"],
          "doctor": "Extract primary doctor name",
          "recommendations": ["recommendation 1", "recommendation 2"]
        }}

        Report Text:
        {text_content}
        """
        gemini_res = llm.invoke(prompt).content.strip()
        
        # Strip code blocks if LLM output includes them
        if gemini_res.startswith("```json"):
            gemini_res = gemini_res.replace("```json", "").replace("```", "").strip()
        elif gemini_res.startswith("```"):
            gemini_res = gemini_res.replace("```", "").strip()

        data = json.loads(gemini_res)
        return data
    except Exception as e:
        logger.error(f"Report Analysis failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to analyze PDF medical report: {str(e)}"
        )

@app.post("/ai/upload-policy")
async def upload_policy_document(file: UploadFile = File(...), user: Dict[str, Any] = Depends(get_current_user)):
    # Admin only
    if user["role"] != "ADMIN":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only administrator can upload policy guidelines")

    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF guidelines are supported.")

    try:
        reader = PdfReader(file.file)
        text_content = ""
        for page in reader.pages:
            text_content += page.extract_text() or ""

        if not text_content.strip():
            raise ValueError("Empty policy document")

        # Chunk policy text
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=800, chunk_overlap=150)
        chunks = text_splitter.split_text(text_content)

        docs = [Document(page_content=c, metadata={"source": file.filename}) for c in chunks]
        
        # Save chunks to Vector database
        vector_store.add_documents(docs)
        return {"status": "Success", "message": f"Successfully indexed policy '{file.filename}' into vector store ({len(docs)} chunks)."}
    except Exception as e:
        logger.error(f"Policy ingestion failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to index policy guideline: {str(e)}"
        )

@app.get("/ai/insights")
def get_insights(user: Dict[str, Any] = Depends(get_current_user)):
    # Admin and Doctor only
    if user["role"] not in ["ADMIN", "DOCTOR"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    db_session = SessionLocal()
    try:
        # 1. Patient Growth Trends by Gender
        growth_query = db_session.execute(text(
            "SELECT gender, COUNT(*) as count FROM patients GROUP BY gender"
        )).fetchall()
        patient_growth = [{"gender": r[0], "count": r[1]} for r in growth_query]

        # 2. Disease / Medical History Distribution
        history_query = db_session.execute(text(
            "SELECT medical_history FROM patients"
        )).fetchall()
        
        disease_counts = {}
        for r in history_query:
            history = r[0] or "Unknown"
            # Split by common characters
            conditions = [c.strip() for c in history.replace(";", ",").split(",") if c.strip()]
            for cond in conditions:
                # Basic cleaning (e.g. "Report Date:" fields can be ignored)
                if "[" in cond or "Report" in cond or "Rx" in cond:
                    continue
                disease_counts[cond] = disease_counts.get(cond, 0) + 1

        disease_distribution = [{"name": name, "value": count} for name, count in disease_counts.items()]
        # Sort and take top 5
        disease_distribution = sorted(disease_distribution, key=lambda x: x["value"], reverse=True)[:5]

        # 3. Revenue Trends from PAID bills
        revenue_query = db_session.execute(text(
            "SELECT generated_date, SUM(amount) FROM bills WHERE payment_status = 'PAID' GROUP BY generated_date ORDER BY generated_date"
        )).fetchall()
        
        revenue_trends = []
        for r in revenue_query:
            g_date = r[0]
            date_str = g_date.strftime("%Y-%m-%d") if isinstance(g_date, (date, datetime)) else str(g_date)
            revenue_trends.append({"date": date_str, "revenue": r[1]})

        # 4. Appointment Trends
        appointment_query = db_session.execute(text(
            "SELECT appointment_date, COUNT(*) FROM appointments GROUP BY appointment_date ORDER BY appointment_date"
        )).fetchall()
        
        appointment_trends = []
        for r in appointment_query:
            app_date = r[0]
            date_str = app_date.strftime("%Y-%m-%d") if isinstance(app_date, (date, datetime)) else str(app_date)
            appointment_trends.append({"date": date_str, "appointments": r[1]})

        # 5. High-Risk Patients
        risk_query = db_session.execute(text(
            "SELECT patient_id, full_name, age, medical_history FROM patients"
        )).fetchall()
        
        high_risk_patients = []
        for r in risk_query:
            patient_id, name, age, history = r
            history_str = history or ""
            # Identify risk triggers
            triggers = ["hypertension", "diabetes", "heart", "critical", "acute", "bronchitis"]
            is_risk = any(t in history_str.lower() for t in triggers) or age > 65
            if is_risk:
                high_risk_patients.append({
                    "patient_id": patient_id,
                    "name": name,
                    "age": age,
                    "condition": history_str.split(";")[0] if history_str else "Unknown",
                    "risk_level": "High" if age > 55 or "critical" in history_str.lower() else "Medium"
                })

        return {
            "patient_growth": patient_growth,
            "disease_distribution": disease_distribution if disease_distribution else [{"name": "No Data", "value": 1}],
            "revenue_trends": revenue_trends,
            "appointment_trends": appointment_trends,
            "high_risk_patients": high_risk_patients[:10]
        }
    except Exception as e:
        logger.error(f"Failed to gather insights: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Insights collection error: {str(e)}"
        )
    finally:
        db_session.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
