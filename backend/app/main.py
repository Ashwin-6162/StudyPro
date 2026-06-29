from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.endpoints import upload, extraction, diagrams, chunks, embeddings, vector_db, context, chat, exam, diagram_reconstruction, mcq, question_paper, citation
from app.database.connection import engine, Base
from app.models import extraction as extraction_models
from app.models import chunking as chunking_models
from app.models import embedding as embedding_models
from app.models import vector_db as vector_db_models
from app.models import diagram_reconstruction as diagram_reconstruction_models
from app.models import citation as citation_models
import os

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="ExamGPT API",
    description="API for ExamGPT - AI-Powered Academic Assistant",
    version="1.0.0"
)

# Configure CORS
# IMPORTANT: allow_origins=["*"] is incompatible with allow_credentials=True (browsers block it).
# Read the frontend origin from an environment variable so this works correctly in all environments.
# Set FRONTEND_ORIGIN in your .env (e.g. http://localhost:5173 for local dev).
_frontend_origin_str = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")
_frontend_origins = [origin.strip() for origin in _frontend_origin_str.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_frontend_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload.router, tags=["Documents"])
app.include_router(extraction.router, tags=["Extraction"])
app.include_router(diagrams.router, tags=["Diagrams"])
app.include_router(chunks.router, tags=["Chunks"])
app.include_router(embeddings.router, tags=["Embeddings"])
app.include_router(vector_db.router, tags=["Vector DB"])
app.include_router(context.router, tags=["Context Builder"])
app.include_router(chat.router, tags=["Chat Generator"])
app.include_router(exam.router, tags=["Exam Generator"])
app.include_router(diagram_reconstruction.router, tags=["Diagram Reconstruction"])
app.include_router(mcq.router, tags=["MCQ Generator"])
app.include_router(question_paper.router, tags=["Question Paper Generator"])
app.include_router(citation.router, tags=["Source Citation Engine"])

@app.get("/")
def root():
    return {"message": "Welcome to ExamGPT API"}
