import os
import base64
import json
import logging
import re
import time
import traceback
import asyncio
import uuid
import concurrent.futures
from typing import List, Dict, Any, Optional
from datetime import datetime, date
from logging.handlers import RotatingFileHandler
from contextlib import asynccontextmanager

from fastapi import FastAPI, Depends, HTTPException, Security, UploadFile, File, Form, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from jose import jwt, JWTError
from pydantic import BaseModel
from pypdf import PdfReader
from dotenv import load_dotenv

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# LangChain Imports
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_community.utilities import SQLDatabase
from langchain_community.agent_toolkits import create_sql_agent
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.language_models.chat_models import BaseChatModel
from langchain_core.outputs import ChatResult, ChatGeneration
from langchain_core.embeddings import Embeddings

# Ensure logs directory exists at the workspace level
workspace_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
logs_dir = os.path.join(workspace_dir, "logs")
os.makedirs(logs_dir, exist_ok=True)
log_file = os.path.join(logs_dir, "ai-service.log")

# Setup RotatingFileHandler (Phase 6)
logger = logging.getLogger("ai-service")
logger.setLevel(logging.INFO)
logger.handlers.clear()

file_handler = RotatingFileHandler(log_file, maxBytes=10*1024*1024, backupCount=5, encoding="utf-8")
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
file_handler.setFormatter(formatter)
logger.addHandler(file_handler)

# Also log to stdout
console_handler = logging.StreamHandler()
console_handler.setFormatter(formatter)
logger.addHandler(console_handler)

# Load environment variables
parent_env = os.path.join(workspace_dir, ".env")
if os.path.exists(parent_env):
    load_dotenv(dotenv_path=parent_env)
else:
    load_dotenv()

# JWT Security Setup
security = HTTPBearer()
JWT_SECRET = os.getenv("JWT_SECRET", "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970")

def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security)) -> Dict[str, Any]:
    token = credentials.credentials
    try:
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

# Helper function to run sync calls in a thread pool with a timeout
def run_with_timeout(func, timeout, *args, **kwargs):
    with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
        future = executor.submit(func, *args, **kwargs)
        try:
            return future.result(timeout=timeout)
        except concurrent.futures.TimeoutError as e:
            logger.error(f"Timeout occurred: {e}")
            raise TimeoutError(f"Operation timed out after {timeout} seconds.")

# Helper to retry Gemini calls with exponential backoff (Phase 4)
def retry_llm_call(func, *args, **kwargs):
    max_retries = 3
    backoff = 1.0
    for attempt in range(max_retries + 1):
        try:
            start_time = datetime.now()
            res = run_with_timeout(func, 30.0, *args, **kwargs)
            latency = (datetime.now() - start_time).total_seconds()
            logger.info(f"Gemini latency: {latency:.4f}s")
            return res
        except Exception as e:
            if attempt == max_retries:
                logger.error(f"Gemini call failed after {max_retries} retries: {str(e)}")
                raise e
            logger.warning(f"Gemini call failed (attempt {attempt + 1}/{max_retries + 1}): {str(e)}. Retrying in {backoff}s...")
            time.sleep(backoff)
            backoff *= 2.0

# Mock Classes for Testing when GEMINI_API_KEY is not configured
class MockChatGoogleGenerativeAI(BaseChatModel):
    model: str = "mock-model"
    google_api_key: Optional[str] = None
    temperature: float = 0.0

    def _generate(
        self,
        messages: List[BaseMessage],
        stop: Optional[List[str]] = None,
        run_manager: Optional[Any] = None,
        **kwargs: Any,
    ) -> ChatResult:
        is_classification = False
        is_rephrase = False
        is_clinical = False
        clinical_text = ""
        user_query = ""
        system_text = ""
        for msg in messages:
            if isinstance(msg, AIMessage):
                continue
            content_lower = msg.content.lower() if msg.content else ""
            if isinstance(msg, HumanMessage):
                user_query = content_lower
            else:
                system_text = content_lower
            if "expert clinical summarizer" in content_lower:
                is_clinical = True
                clinical_text = msg.content

        if "routing agent" in system_text and "classify" in system_text:
            is_classification = True

        if "reformulate" in system_text or "standalone question" in system_text:
            is_rephrase = True

        if is_rephrase:
            raw_query = ""
            for msg in reversed(messages):
                if isinstance(msg, HumanMessage):
                    raw_query = msg.content
                    break
            logger.debug(f"[MockLLM] Rephrase request — returning query as-is: '{raw_query}'")
            response_text = raw_query
        elif is_classification:
            logger.debug(f"[MockLLM] Classification request — user_query='{user_query}'")
            if any(k in user_query for k in ["policy", "guideline", "sop", "insurance", "admission protocol"]):
                response_text = "RAG"
            elif any(k in user_query for k in ["patient", "doctor", "schedule", "revenue", "bill", "appointment", "experience", "medical history", "show all", "list", "summary", "hospital summary"]):
                response_text = "SQL"
            else:
                response_text = "GENERAL"
        elif is_clinical:
            report_text_marker = "report text:"
            idx = clinical_text.lower().find(report_text_marker)
            if idx != -1:
                raw_report = clinical_text[idx + len(report_text_marker):].strip()
            else:
                raw_report = clinical_text
            parsed_data = parse_report_text(raw_report)
            response_text = json.dumps(parsed_data)
            logger.debug(f"[MockLLM] Clinical analysis request — response='{response_text}'")
        else:
            last_msg = messages[-1].content if messages else ""
            last_msg_lower = last_msg.lower()

            # Dynamic math expressions calculator
            math_match = re.search(r'(\d+(?:\s*[\+\-\*\/]\s*\d+)+)', last_msg_lower)
            if math_match:
                expr = math_match.group(1)
                cleaned_expr = re.sub(r'\s+', '', expr)
                if re.match(r'^[\d+\-*/()]+$', cleaned_expr):
                    try:
                        response_text = str(eval(cleaned_expr, {"__builtins__": None}, {}))
                    except Exception:
                        response_text = "I'm sorry, I couldn't compute that math expression."
                else:
                    response_text = "I'm sorry, I couldn't compute that math expression."
            elif "diabetes" in last_msg_lower:
                response_text = "Diabetes is a chronic condition characterized by high levels of blood sugar (glucose), which can lead to serious damage to the heart, blood vessels, eyes, kidneys, and nerves over time."
            elif re.search(r'\bai\b', last_msg_lower) or "artificial intelligence" in last_msg_lower:
                response_text = "Artificial Intelligence (AI) refers to the simulation of human intelligence processes by machines, especially computer systems, including learning, reasoning, and self-correction."
            elif "who are you" in last_msg_lower or "your name" in last_msg_lower or "who you are" in last_msg_lower:
                response_text = "I am MediPulse AI, an intelligent clinical and hospital operations assistant. I can help you with patient info, billing, scheduling, and hospital policies."
            elif any(greet in last_msg_lower for greet in ["hello", "hi", "hey", "good morning", "good afternoon", "good evening"]):
                response_text = "Hello! I am MediPulse AI, your hospital assistant. How can I help you today?"
            elif "hospital policy" in last_msg_lower or "knowledge assistant" in last_msg_lower:
                response_text = "According to our hospital policies, check-in requires a valid ID. Details are saved in policy guidelines."
            elif "hospital db assistant" in last_msg_lower:
                response_text = "Based on the database, we have registered patients and active doctors on staff."
            else:
                response_text = f"I am MediPulse AI, your hospital assistant. I received your query: '{last_msg}'. How can I help you with this?"

        generation = ChatGeneration(message=AIMessage(content=response_text))
        return ChatResult(generations=[generation])

    @property
    def _llm_type(self) -> str:
        return "mock-chat-google"

class MockGoogleGenerativeAIEmbeddings(Embeddings):
    model: str = "mock-embedding"
    google_api_key: Optional[str] = None

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        return [[0.1] * 768 for _ in texts]
        
    def embed_query(self, text: str) -> List[float]:
        return [0.1] * 768

def parse_report_text(text: str) -> dict:
    lines = [line.strip() for line in text.split("\n") if line.strip()]
    patient_name = "Unknown Patient"
    doctor = "Unknown / Unspecified"
    diagnosis = "No specific diagnosis found."
    medicines = []
    recommendations = []
    
    for i, line in enumerate(lines):
        line_lower = line.lower()
        if line_lower == "patient name" and i + 1 < len(lines):
            patient_name = lines[i + 1]
        elif line_lower == "doctor" and i + 1 < len(lines):
            doctor = lines[i + 1]
        elif line_lower == "diagnosis" and i + 1 < len(lines):
            diagnosis = lines[i + 1]
        elif line_lower in ("medications", "medicines"):
            j = i + 1
            headers = {"recommendations", "vital signs", "laboratory findings", "diagnosis", "medications", "medicines", "chief complaint"}
            while j < len(lines) and lines[j].lower() not in headers:
                medicines.append(lines[j])
                j += 1
        elif line_lower == "recommendations":
            j = i + 1
            headers = {"vital signs", "laboratory findings", "diagnosis", "medications", "medicines", "chief complaint"}
            while j < len(lines) and lines[j].lower() not in headers:
                rec_line = lines[j]
                parts = [p.strip() for p in rec_line.split(",") if p.strip()]
                recommendations.extend(parts)
                j += 1

    cleaned_recs = []
    for r in recommendations:
        clean_r = r.lstrip("-*• ").strip()
        if clean_r:
            cleaned_recs.append(clean_r)
            
    cleaned_meds = []
    for m in medicines:
        clean_m = m.lstrip("-*• ").strip()
        if clean_m:
            parts = [p.strip() for p in clean_m.split(",") if p.strip()]
            cleaned_meds.extend(parts)
            
    return {
        "success": True,
        "patient_name": patient_name,
        "diagnosis": diagnosis,
        "medicines": cleaned_meds,
        "doctor": doctor,
        "recommendations": cleaned_recs
    }

# Embedding cache class (Phase 4)
class CachedEmbeddings(Embeddings):
    def __init__(self, base_embeddings: Embeddings, cache_file: str):
        self.base_embeddings = base_embeddings
        self.cache_file = cache_file
        self.cache = {}
        self._load_cache()

    def _load_cache(self):
        if os.path.exists(self.cache_file):
            try:
                with open(self.cache_file, "r", encoding="utf-8") as f:
                    self.cache = json.load(f)
                logger.info(f"Loaded {len(self.cache)} embeddings from cache.")
            except Exception as e:
                logger.error(f"Embedding cache corrupt: {e}. Rebuilding...")
                self._rebuild_cache()

    def _rebuild_cache(self):
        if os.path.exists(self.cache_file):
            try:
                os.remove(self.cache_file)
            except Exception as e:
                logger.error(f"Failed to delete corrupt cache file: {e}")
        self.cache = {}
        self._save_cache()

    def _save_cache(self):
        try:
            with open(self.cache_file, "w", encoding="utf-8") as f:
                json.dump(self.cache, f, ensure_ascii=False)
        except Exception as e:
            logger.error(f"Failed to save embedding cache: {e}")

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        results = []
        texts_to_embed = []
        indices_to_embed = []
        for i, text in enumerate(texts):
            if text in self.cache:
                results.append(self.cache[text])
            else:
                results.append(None)
                texts_to_embed.append(text)
                indices_to_embed.append(i)

        if texts_to_embed:
            try:
                start_time = datetime.now()
                embedded = run_with_timeout(
                    self.base_embeddings.embed_documents,
                    15.0,
                    texts=texts_to_embed
                )
                latency = (datetime.now() - start_time).total_seconds()
                logger.info(f"Embedding latency: {latency:.4f}s")
                for text, vector in zip(texts_to_embed, embedded):
                    self.cache[text] = vector
                self._save_cache()
                for i, idx in enumerate(indices_to_embed):
                    results[idx] = embedded[i]
            except Exception as e:
                logger.error(f"Embedding generation failed: {e}")
                # Return mock embeddings as fallback if embeddings are unavailable to keep system alive
                fallback = [[0.1] * 768 for _ in texts_to_embed]
                for i, idx in enumerate(indices_to_embed):
                    results[idx] = fallback[i]
        return results

    def embed_query(self, text: str) -> List[float]:
        if text in self.cache:
            return self.cache[text]
        try:
            start_time = datetime.now()
            vector = run_with_timeout(
                self.base_embeddings.embed_query,
                15.0,
                text=text
            )
            latency = (datetime.now() - start_time).total_seconds()
            logger.info(f"Embedding latency: {latency:.4f}s")
            self.cache[text] = vector
            self._save_cache()
            return vector
        except Exception as e:
            logger.error(f"Embedding query generation failed: {e}")
            return [0.1] * 768

# Pure Python Vector Store Fallback with Robust Load (Phase 4)
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
                logger.error(f"Failed to load vector store: {e}. Recreating...")
                self.recreate_store()

    def recreate_store(self):
        try:
            if os.path.exists(self.file_path):
                os.remove(self.file_path)
        except Exception as e:
            logger.error(f"Could not remove corrupt vector store file: {e}")
        self.documents = []
        self.embeddings_data = []
        self._save()

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

# Centralized AI Initialization and Connection Pooling Manager (Requirement 1 & 7)
class AIServiceManager:
    def __init__(self):
        self.is_mock_mode = False
        self.gemini_ready = False
        self.vector_store_ready = False
        self.database_ready = False
        self.embeddings_ready = False
        
        self.llm = None
        self.raw_embeddings = None
        self.embeddings = None
        self.db_engine = None
        self.db = None
        self.sql_agent = None
        self.vector_store = None
        
        self.rephrase_chain = None
        self.general_chat_chain = None
        self.rag_chain = None

    def initialize(self):
        google_api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
        self.is_mock_mode = not google_api_key or google_api_key == "YOUR_GEMINI_API_KEY_HERE" or google_api_key.strip() == ""
        
        # 1. Initialize Gemini LLM
        if self.is_mock_mode:
            logger.warning("GEMINI_API_KEY is not set or is a placeholder. Initializing AI Service in MOCK mode.")
            self.llm = MockChatGoogleGenerativeAI()
            self.gemini_ready = True
        else:
            try:
                self.llm = ChatGoogleGenerativeAI(
                    model="gemini-1.5-flash",
                    google_api_key=google_api_key,
                    temperature=0.0,
                    timeout=30.0
                )
                self.gemini_ready = True
            except Exception as e:
                logger.error(f"Failed to initialize Gemini LLM: {e}")
                self.gemini_ready = False

        # 2. Initialize Embeddings
        if self.is_mock_mode:
            self.raw_embeddings = MockGoogleGenerativeAIEmbeddings()
        else:
            try:
                self.raw_embeddings = GoogleGenerativeAIEmbeddings(
                    model="models/embedding-001",
                    google_api_key=google_api_key,
                    timeout=15.0
                )
            except Exception as e:
                logger.error(f"Failed to initialize Google embeddings: {e}")

        # Wrap in CachedEmbeddings
        try:
            persist_dir = os.getenv("CHROMA_PERSIST_DIR", "./chroma_db")
            os.makedirs(persist_dir, exist_ok=True)
            cache_file = os.path.join(persist_dir, "embeddings_cache.json")
            self.embeddings = CachedEmbeddings(self.raw_embeddings, cache_file)
            self.embeddings_ready = True
        except Exception as e:
            logger.error(f"Failed to setup CachedEmbeddings: {e}")
            self.embeddings_ready = False

        # 3. Initialize Vector Store
        try:
            persist_dir = os.getenv("CHROMA_PERSIST_DIR", "./chroma_db")
            self.vector_store = SimpleVectorStore(
                persist_directory=persist_dir,
                embedding_function=self.embeddings
            )
            self.vector_store_ready = True
        except Exception as e:
            logger.error(f"Failed to initialize vector store: {e}")
            self.vector_store_ready = False

        # 4. Initialize Database connection pooling
        self.initialize_db()

        # 5. Initialize LangChain chains (Connection Pooling / Re-use)
        if self.gemini_ready:
            try:
                rephrase_prompt = ChatPromptTemplate.from_messages([
                    ("system", "Given a chat history and the latest user question which might reference context in the chat history, formulate a standalone question which can be understood without the chat history. Do NOT answer the question, just reformulate it if needed and otherwise return it as is. Keep it clear and concise."),
                    MessagesPlaceholder(variable_name="chat_history"),
                    ("human", "{question}")
                ])
                self.rephrase_chain = rephrase_prompt | self.llm

                general_chat_prompt = ChatPromptTemplate.from_messages([
                    ("system", "You are MediPulse AI, an intelligent clinical and hospital operations assistant. Help the user with general inquiries politely."),
                    MessagesPlaceholder(variable_name="chat_history"),
                    ("human", "{question}")
                ])
                self.general_chat_chain = general_chat_prompt | self.llm

                rag_prompt_template = ChatPromptTemplate.from_messages([
                    ("system", "You are the MediPulse AI Knowledge Assistant. Answer the user's question using ONLY the provided hospital policy and SOP context.\n"
                               "If the answer cannot be found in the context, reply: \"I cannot find the answer in the current hospital policy records. Please verify with administration.\"\n\n"
                               "Context:\n{context}"),
                    ("human", "{question}")
                ])
                self.rag_chain = rag_prompt_template | self.llm
                logger.info("LangChain chains successfully pre-built.")
            except Exception as e:
                logger.error(f"Failed to build LangChain chains: {e}")

    def initialize_db(self):
        db_user = os.getenv("DB_USER", "root")
        db_password = os.getenv("DB_PASSWORD", "oracle")
        db_host = os.getenv("DB_HOST", "localhost")
        db_port = os.getenv("DB_PORT", "3306")
        db_name = os.getenv("DB_NAME", "hospital_db")
        db_uri = f"mysql+pymysql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"
        
        if self.db_engine:
            try:
                self.db_engine.dispose()
            except Exception:
                pass
                
        try:
            self.db_engine = create_engine(
                db_uri,
                pool_pre_ping=True,
                pool_recycle=3600,
                connect_args={"connect_timeout": 5}
            )
            with self.db_engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            self.database_ready = True
            
            # Recreate SQL database and agent
            if self.gemini_ready:
                self.db = SQLDatabase.from_uri(db_uri)
                self.sql_agent = create_sql_agent(
                    llm=self.llm,
                    db=self.db,
                    agent_type="zero-shot-react-description",
                    verbose=True
                )
                logger.info("LangChain SQL Agent successfully initialized/reconnected.")
        except Exception as e:
            logger.error(f"Failed to connect to database during initialization/reconnection: {e}")
            self.database_ready = False
            self.sql_agent = None

# Lifespan manager to verify initialization without crashing (Requirement 1 & 3)
ai_manager = AIServiceManager()
ai_manager.initialize()  # Eager init so components are available at import time

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("--- Starting Startup Validation ---")
    
    # Re-initialize if not already done
    if not ai_manager.gemini_ready and not ai_manager.embeddings_ready:
        ai_manager.initialize()
    
    # Verify Gemini Connection
    if ai_manager.gemini_ready:
        try:
            logger.info("Verifying Gemini connection...")
            if ai_manager.is_mock_mode:
                logger.info("Gemini connection validation skipped (Mock Mode).")
            else:
                test_res = retry_llm_call(ai_manager.llm.invoke, "Hello")
                logger.info("Gemini connection verified.")
        except Exception as e:
            logger.error(f"Gemini connection verification failed: {e}")
            ai_manager.gemini_ready = False
            
    # Verify Vector Database
    if ai_manager.vector_store_ready:
        try:
            logger.info("Verifying vector database...")
            ai_manager.vector_store.similarity_search("test", k=1)
            logger.info("Vector database verified.")
        except Exception as e:
            logger.error(f"Vector database verification failed: {e}. Recreating...")
            try:
                ai_manager.vector_store.recreate_store()
                logger.info("Vector database recreated successfully.")
            except Exception as re_err:
                logger.error(f"Failed to recreate vector database: {re_err}")
                ai_manager.vector_store_ready = False

    # Verify Upload Directories
    try:
        logger.info("Verifying upload directories...")
        upload_dir = "./uploads"
        os.makedirs(upload_dir, exist_ok=True)
        test_file = os.path.join(upload_dir, ".write_test")
        with open(test_file, "w") as f:
            f.write("test")
        os.remove(test_file)
        logger.info("Upload directories verified.")
    except Exception as e:
        logger.error(f"Upload directories verification failed: {e}")

    # Verify Database Connection
    if ai_manager.database_ready:
        try:
            logger.info("Verifying database connection...")
            with ai_manager.db_engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            logger.info("Database connection verified.")
        except Exception as e:
            logger.error(f"Database connection verification failed: {e}")
            ai_manager.database_ready = False

    logger.info("--- Startup Validation Complete ---")
    logger.info(f"Gemini: {'CONNECTED' if ai_manager.gemini_ready else 'UNAVAILABLE'}, "
                f"Vector Store: {'READY' if ai_manager.vector_store_ready else 'UNAVAILABLE'}, "
                f"Database: {'CONNECTED' if ai_manager.database_ready else 'UNAVAILABLE'}, "
                f"Embeddings: {'READY' if ai_manager.embeddings_ready else 'UNAVAILABLE'}")
    
    yield
    logger.info("Shutting down AI Service...")

app = FastAPI(title="MediPulse AI Service", version="1.0.0", lifespan=lifespan)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request logger middleware (Requirement 5 & Phase 6)
@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"Request received: {request.method} {request.url.path}")
    response = await call_next(request)
    return response

# Standard JSON error response builder (Phase 3)
def build_error_response(status_code: int, error: str, details: str) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={
            "success": False,
            "error": error,
            "details": details,
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "request_id": str(uuid.uuid4())
        }
    )

# Global Exception Handlers (Requirement 4 & Phase 3)
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    logger.error(f"HTTP Exception: {exc.status_code} - {exc.detail}")
    return build_error_response(exc.status_code, exc.detail, "HTTPException")

@app.exception_handler(StarletteHTTPException)
async def starlette_http_exception_handler(request: Request, exc: StarletteHTTPException):
    logger.error(f"Starlette HTTP Exception: {exc.status_code} - {exc.detail}")
    return build_error_response(exc.status_code, exc.detail, "StarletteHTTPException")

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logger.error(f"RequestValidationError: {str(exc)}")
    return build_error_response(status.HTTP_400_BAD_REQUEST, "Invalid request parameters.", str(exc.errors()))

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled Exception: {str(exc)}")
    logger.error(traceback.format_exc())
    return build_error_response(
        status.HTTP_500_INTERNAL_SERVER_ERROR, 
        "An unexpected error occurred. Please contact the administrator.", 
        "logged internally"
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False)

def get_db_session():
    # Phase 4 Recovery: auto reconnect if database is not ready
    if not ai_manager.database_ready:
        logger.warning("Database unavailable. Attempting to reconnect...")
        try:
            ai_manager.initialize_db()
        except Exception as e:
            logger.error(f"Reconnection failed: {e}")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database service is temporarily unavailable."
            )
            
    if not ai_manager.database_ready:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database service is temporarily unavailable."
        )
        
    session = SessionLocal(bind=ai_manager.db_engine)
    try:
        # Ping connection
        session.execute(text("SELECT 1"))
        yield session
    except Exception as e:
        logger.warning(f"Database session query failed: {e}. Reinitializing connection...")
        try:
            ai_manager.initialize_db()
            session.close()
            session = SessionLocal(bind=ai_manager.db_engine)
            session.execute(text("SELECT 1"))
            yield session
        except Exception as re_err:
            logger.error(f"Database re-initialization failed: {re_err}")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database service is temporarily unavailable."
            )
    finally:
        session.close()

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

    lc_history = []
    for msg in chat_history[-6:]:
        if msg["role"] == "user":
            lc_history.append(HumanMessage(content=msg["content"]))
        else:
            lc_history.append(AIMessage(content=msg["content"]))

    if not ai_manager.rephrase_chain or not ai_manager.gemini_ready:
        return query

    try:
        response = retry_llm_call(
            ai_manager.rephrase_chain.invoke,
            {"chat_history": lc_history, "question": query}
        )
        rephrased = response.content.strip()
        logger.info(f"Rephrased query: '{query}' -> '{rephrased}'")
        return rephrased
    except Exception as e:
        logger.error(f"Rephraser failed, using original query: {str(e)}")
        return query

# Query Classification
def classify_query(user_query: str) -> str:
    if not ai_manager.gemini_ready:
        return "GENERAL"

    classification_prompt = ChatPromptTemplate.from_messages([
        ("system",
         "You are a routing agent for a hospital AI assistant named MediPulse AI. "
         "Classify the user query into one of three categories:\n"
         '1. "SQL": If the query is about specific patient details, doctor schedules, '
         "lists of patients, years of experience, billing details, revenue, appointments, "
         "hospital summaries, or medical histories in our database.\n"
         '2. "RAG": If the query is about general hospital policy, treatment guidelines, '
         "insurance requirements, SOPs, or admission protocols.\n"
         '3. "GENERAL": If the query is a greeting, basic chat, general knowledge, '
         "math questions, or general advice.\n\n"
         'Return ONLY one of the words: "SQL", "RAG", or "GENERAL". '
         "Do not include any punctuation or extra words."),
        ("human", "{query}"),
    ])

    chain = classification_prompt | ai_manager.llm
    try:
        result = retry_llm_call(chain.invoke, {"query": user_query}).content.strip().upper()
    except Exception as e:
        logger.error(f"LLM Classification failed: {str(e)}")
        result = "GENERAL"

    if "SQL" in result:
        result = "SQL"
    elif "RAG" in result:
        result = "RAG"
    else:
        result = "GENERAL"

    logger.info(f"[Classifier] User Query      : {user_query}")
    logger.info(f"[Classifier] Classification  : {result}")
    return result

# ── Endpoints ─────────────────────────────────────────────────────────

# Health Check (Requirement 2 & Phase 5)
@app.get("/ai/health")
def health_check():
    gemini_status = "CONNECTED" if ai_manager.gemini_ready else "ERROR"
    if ai_manager.gemini_ready and ai_manager.is_mock_mode:
        gemini_status = "MOCK"
        
    vector_status = "READY" if ai_manager.vector_store_ready else "ERROR"
    db_status = "CONNECTED" if ai_manager.database_ready else "ERROR"
    embeddings_status = "READY" if ai_manager.embeddings_ready else "ERROR"
    sql_agent_status = "READY" if (ai_manager.database_ready and ai_manager.gemini_ready and ai_manager.sql_agent is not None) else "ERROR"
    rag_status = "READY" if (ai_manager.vector_store_ready and ai_manager.embeddings_ready) else "ERROR"
    pdf_status = "READY" if ai_manager.gemini_ready else "ERROR"

    status_flags = [ai_manager.gemini_ready, ai_manager.vector_store_ready, ai_manager.database_ready, ai_manager.embeddings_ready]
    if all(status_flags):
        overall_status = "UP"
    elif any(status_flags):
        overall_status = "DEGRADED"
    else:
        overall_status = "DOWN"

    return {
        "status": overall_status,
        "gemini": gemini_status,
        "database": db_status,
        "vector_store": vector_status,
        "embeddings": embeddings_status,
        "sql_agent": sql_agent_status,
        "rag": rag_status,
        "pdf": pdf_status,
        "version": "1.0.0"
    }

# Diagnostics endpoint (Phase 5)
@app.get("/ai/health/details")
def health_details():
    db_detail = {}
    if ai_manager.database_ready:
        try:
            with ai_manager.db_engine.connect() as conn:
                res = conn.execute(text("SELECT COUNT(*) FROM patients")).scalar()
                db_detail = {"status": "CONNECTED", "registered_patients": res}
        except Exception as e:
            db_detail = {"status": "ERROR", "message": str(e)}
    else:
        db_detail = {"status": "ERROR", "message": "Database not initialized"}

    vector_detail = {}
    if ai_manager.vector_store_ready:
        try:
            vector_detail = {
                "status": "READY",
                "document_count": len(ai_manager.vector_store.documents),
                "file_path": ai_manager.vector_store.file_path
            }
        except Exception as e:
            vector_detail = {"status": "ERROR", "message": str(e)}
    else:
        vector_detail = {"status": "ERROR", "message": "Vector store not initialized"}

    embeddings_detail = {}
    if ai_manager.embeddings_ready:
        try:
            embeddings_detail = {
                "status": "READY",
                "cached_embeddings_count": len(ai_manager.embeddings.cache),
                "cache_file": ai_manager.embeddings.cache_file
            }
        except Exception as e:
            embeddings_detail = {"status": "ERROR", "message": str(e)}
    else:
        embeddings_detail = {"status": "ERROR", "message": "Embeddings not initialized"}

    return {
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "version": "1.0.0",
        "subsystems": {
            "gemini": {
                "status": "CONNECTED" if ai_manager.gemini_ready else "ERROR",
                "mock_mode": ai_manager.is_mock_mode,
                "model": "mock-model" if ai_manager.is_mock_mode else "gemini-1.5-flash"
            },
            "database": db_detail,
            "vector_store": vector_detail,
            "embeddings": embeddings_detail,
            "sql_agent": {
                "status": "READY" if ai_manager.sql_agent is not None else "ERROR"
            },
            "rag": {
                "status": "READY" if (ai_manager.vector_store_ready and ai_manager.embeddings_ready) else "ERROR"
            },
            "pdf": {
                "status": "READY" if ai_manager.gemini_ready else "ERROR"
            }
        }
    }

# Chat Assistant with Graceful Degradation (Requirement 9)
session_memories: Dict[str, List[Dict[str, str]]] = {}

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

    # Classify
    classification_res = classify_query(standalone_query)

    # Graceful degradation checks
    if not ai_manager.gemini_ready:
        return ChatResponse(
            response="I'm temporarily unable to contact the language model.",
            category="GENERAL"
        )

    response_text = ""
    # Process by category
    if "SQL" in classification_res:
        if ai_manager.is_mock_mode:
            db_session = SessionLocal(bind=ai_manager.db_engine)
            try:
                patients_count = db_session.execute(text("SELECT COUNT(*) FROM patients")).scalar()
                doctors_count = db_session.execute(text("SELECT COUNT(*) FROM doctors")).scalar()
                appointments_count = db_session.execute(text("SELECT COUNT(*) FROM appointments")).scalar()
                bills_sum = db_session.execute(text("SELECT COALESCE(SUM(amount), 0) FROM bills WHERE payment_status = 'PAID'")).scalar()
                response_text = f"Database status (Mock Mode): Connected. Registered Patients: {patients_count}, Registered Doctors: {doctors_count}, Total Appointments: {appointments_count}, Total Paid Revenue: ${bills_sum:.2f}."
            except Exception as sql_err:
                logger.error(f"Mock SQL query failed: {str(sql_err)}")
                response_text = f"Database status (Mock Mode): Connected but query failed: {str(sql_err)}"
            finally:
                db_session.close()
        elif not ai_manager.database_ready or not ai_manager.sql_agent:
            logger.warning("SQL DB / Agent is unavailable. Degrading chat response.")
            response_text = "Database service is temporarily unavailable."
        else:
            try:
                logger.info(f"SQL execution started: '{standalone_query}'")
                start_time = datetime.now()
                db_query_prompt = f"""
                You are a hospital DB assistant. Answer the user question by querying the database.
                Only answer questions using the database information.
                Question: {standalone_query}
                """
                response_text = retry_llm_call(ai_manager.sql_agent.run, db_query_prompt)
                latency = (datetime.now() - start_time).total_seconds()
                logger.info(f"SQL execution completed. Latency: {latency:.4f}s.")
            except Exception as e:
                logger.error(f"SQL Agent failed: {str(e)}")
                response_text = "Database service is temporarily unavailable."

    elif "RAG" in classification_res:
        if not ai_manager.vector_store_ready or not ai_manager.embeddings_ready:
            logger.warning("RAG Vector Store / Embeddings unavailable. Degrading chat response.")
            response_text = "Knowledge base unavailable."
        else:
            try:
                logger.info(f"RAG retrieval started for query: '{standalone_query}'")
                start_time = datetime.now()
                retriever = ai_manager.vector_store.as_retriever(search_kwargs={"k": 3})
                docs = run_with_timeout(retriever.get_relevant_documents, 15.0, query=standalone_query)
                latency = (datetime.now() - start_time).total_seconds()
                logger.info(f"RAG retrieval completed. Latency: {latency:.4f}s. Found {len(docs)} documents.")
                
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
                response_text = retry_llm_call(ai_manager.rag_chain.invoke, {"context": context, "question": standalone_query}).content.strip()
            except Exception as e:
                logger.error(f"RAG Retrieval or Gen failed: {str(e)}")
                response_text = "Knowledge base unavailable."
    else:
        # GENERAL chat with context
        lc_history = []
        for msg in history[-6:]:
            if msg["role"] == "user":
                lc_history.append(HumanMessage(content=msg["content"]))
            else:
                lc_history.append(AIMessage(content=msg["content"]))

        try:
            response_text = retry_llm_call(
                ai_manager.general_chat_chain.invoke,
                {"chat_history": lc_history, "question": standalone_query}
            ).content.strip()
        except Exception as e:
            logger.error(f"General chat chain failed: {str(e)}")
            response_text = "I'm temporarily unable to contact the language model."

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

# Upload Medical Report with Timeout and Graceful degradation (Requirement 8 & 9)
@app.post("/ai/upload-report")
async def upload_medical_report(file: UploadFile = File(...), user: Dict[str, Any] = Depends(get_current_user)):
    if user["role"] not in ["ADMIN", "DOCTOR"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Only ADMIN and DOCTOR roles can analyze reports."
        )

    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF reports are supported currently."
        )

    if not ai_manager.gemini_ready:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="I'm temporarily unable to contact the language model."
        )

    contents = await file.read()
    logger.info(f"Received PDF '{file.filename}' — {len(contents)} bytes")

    # Step 1: Read and extract text from the PDF with a 30s timeout
    logger.info(f"PDF parsing started for file '{file.filename}'")
    start_time = datetime.now()
    try:
        def parse_pdf():
            import io
            reader = PdfReader(io.BytesIO(contents))
            text_content = ""
            for page in reader.pages:
                text_content += page.extract_text() or ""
            return text_content

        text_content = run_with_timeout(parse_pdf, timeout=30.0)
        latency = (datetime.now() - start_time).total_seconds()
        logger.info(f"PDF parsing completed. Latency: {latency:.4f}s.")
    except Exception as e:
        logger.error(f"PDF text extraction failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to analyze this PDF."
        )

    if not text_content.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unable to analyze this PDF."
        )

    # Step 2: Extract structured data using LLM
    try:
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
        gemini_res = retry_llm_call(ai_manager.llm.invoke, prompt).content.strip()
        logger.info(f"LLM raw response ({len(gemini_res)} chars): {gemini_res[:300]}")
    except Exception as e:
        logger.error(f"LLM invocation failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="I'm temporarily unable to contact the language model."
        )

    # Step 3: Parse LLM output into JSON
    try:
        cleaned = gemini_res
        if cleaned.startswith("```json"):
            cleaned = cleaned[len("```json"):]
        if cleaned.startswith("```"):
            cleaned = cleaned[3:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        cleaned = cleaned.strip()

        try:
            data = json.loads(cleaned)
        except json.JSONDecodeError:
            match = re.search(r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}', gemini_res, re.DOTALL)
            if match:
                data = json.loads(match.group())
            else:
                raise ValueError("Could not extract JSON")

        data["success"] = True
        logger.info(f"Report analysis successful: patient={data.get('patient_name')}")
        return JSONResponse(content=data)

    except Exception as e:
        logger.error(f"JSON parsing failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to analyze this PDF."
        )

# Upload Policy Document (Phase 4 Recovery for upload directory missing)
@app.post("/ai/upload-policy")
async def upload_policy_document(file: UploadFile = File(...), user: Dict[str, Any] = Depends(get_current_user)):
    if user["role"] != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrator can upload policy guidelines"
        )

    if not file.filename.endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF guidelines are supported."
        )

    if not ai_manager.vector_store_ready or not ai_manager.embeddings_ready:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Knowledge base unavailable."
        )

    contents = await file.read()
    
    # Parse with 30s timeout
    logger.info(f"PDF parsing started for policy file '{file.filename}'")
    start_time = datetime.now()
    try:
        def parse_pdf():
            import io
            reader = PdfReader(io.BytesIO(contents))
            text_content = ""
            for page in reader.pages:
                text_content += page.extract_text() or ""
            return text_content

        text_content = run_with_timeout(parse_pdf, timeout=30.0)
        latency = (datetime.now() - start_time).total_seconds()
        logger.info(f"PDF parsing completed. Latency: {latency:.4f}s.")
    except Exception as e:
        logger.error(f"PDF policy parsing failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to analyze this PDF."
        )

    if not text_content.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unable to analyze this PDF."
        )

    try:
        # Chunk text
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=800, chunk_overlap=150)
        chunks = text_splitter.split_text(text_content)
        docs = [Document(page_content=c, metadata={"source": file.filename}) for c in chunks]
        
        # Save chunks with 15s timeout
        run_with_timeout(ai_manager.vector_store.add_documents, 15.0, documents=docs)
        return {"status": "Success", "message": f"Successfully indexed policy '{file.filename}' into vector store ({len(docs)} chunks)."}
    except Exception as e:
        logger.error(f"Policy ingestion failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Knowledge base unavailable."
        )

# Insights Endpoint
@app.get("/ai/insights")
def get_insights(db_session = Depends(get_db_session), user: Dict[str, Any] = Depends(get_current_user)):
    if user["role"] not in ["ADMIN", "DOCTOR"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )

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
            conditions = [c.strip() for c in history.replace(";", ",").split(",") if c.strip()]
            for cond in conditions:
                if "[" in cond or "Report" in cond or "Rx" in cond:
                    continue
                disease_counts[cond] = disease_counts.get(cond, 0) + 1

        disease_distribution = [{"name": name, "value": count} for name, count in disease_counts.items()]
        disease_distribution = sorted(disease_distribution, key=lambda x: x["value"], reverse=True)[:5]

        # 3. Revenue Trends from PAID bills
        revenue_query = db_session.execute(text(
            "SELECT generated_date, SUM(amount) FROM bills WHERE payment_status = 'PAID' GROUP BY generated_date ORDER BY generated_date"
        )).fetchall()
        
        revenue_trends = []
        for r in revenue_query:
            g_date = r[0]
            date_str = g_date.strftime("%Y-%m-%d") if isinstance(g_date, (date, datetime)) else str(g_date)
            revenue_trends.append({"date": date_str, "revenue": float(r[1])})

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
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database service is temporarily unavailable."
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
