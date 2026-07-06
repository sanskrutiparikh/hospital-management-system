import os
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

def create_pdf(filename="sample_report.pdf"):
    c = canvas.Canvas(filename, pagesize=letter)
    width, height = letter
    
    # Title
    c.setFont("Helvetica-Bold", 16)
    c.drawString(100, height - 80, "MediPulse Medical Report")
    
    # Body text fields as expected by parser
    c.setFont("Helvetica-Bold", 12)
    c.drawString(100, height - 120, "Patient Name")
    c.setFont("Helvetica", 12)
    c.drawString(100, height - 140, "John Doe")
    
    c.setFont("Helvetica-Bold", 12)
    c.drawString(100, height - 180, "Doctor")
    c.setFont("Helvetica", 12)
    c.drawString(100, height - 200, "Dr. Smith")
    
    c.setFont("Helvetica-Bold", 12)
    c.drawString(100, height - 240, "Diagnosis")
    c.setFont("Helvetica", 12)
    c.drawString(100, height - 260, "Acute Bronchitis")
    
    c.setFont("Helvetica-Bold", 12)
    c.drawString(100, height - 300, "Medications")
    c.setFont("Helvetica", 12)
    c.drawString(100, height - 320, "Amoxicillin 500mg")
    c.drawString(100, height - 340, "Cough Syrup")
    
    c.setFont("Helvetica-Bold", 12)
    c.drawString(100, height - 380, "Recommendations")
    c.setFont("Helvetica", 12)
    c.drawString(100, height - 400, "Rest for 3 days")
    c.drawString(100, height - 420, "Drink plenty of fluids")
    c.drawString(100, height - 440, "Follow up in 1 week")
    
    c.save()

if __name__ == "__main__":
    create_pdf("sample_report.pdf")
    print("PDF created successfully!")
