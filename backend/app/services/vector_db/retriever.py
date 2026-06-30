import numpy as np
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.models.vector_db import VectorIndexMapping
from app.models.embedding import DocumentEmbedding, DiagramEmbedding
from app.models.chunking import DocumentChunk
from app.models.extraction import DocumentDiagram
from app.services.vector_db.faiss_manager import faiss_manager
from app.services.embedding_engine.generator import generate_embeddings_batch

def hybrid_search(query: str, top_k: int, index_name: str, db: Session) -> List[Dict[str, Any]]:
    """
    Embeds the query and searches the specified FAISS index.
    Maps the returned integer IDs back to full Postgres metadata.
    """
    # 1. Embed query (RETRIEVAL_QUERY task type, optimized differently than
    # the RETRIEVAL_DOCUMENT embeddings used for stored chunks)
    query_vector = generate_embeddings_batch([query], task_type="RETRIEVAL_QUERY")[0]
    query_np = np.array([query_vector], dtype=np.float32)
    
    # 2. Search FAISS
    index = faiss_manager.get_index(index_name)
    if index.ntotal == 0:
        return []
        
    distances, indices = index.search(query_np, top_k)
    
    results = []
    
    # 3. Map back to Postgres
    for i, faiss_id in enumerate(indices[0]):
        if faiss_id == -1:
            continue # FAISS returns -1 if there aren't enough vectors
            
        score = float(distances[0][i])
        
        # Look up mapping
        mapping = db.query(VectorIndexMapping).filter(VectorIndexMapping.faiss_id == int(faiss_id)).first()
        if not mapping:
            continue
            
        metadata = {}
        
        # Look up original chunk/diagram
        if index_name == "chunk_index":
            emb = db.query(DocumentEmbedding).filter(DocumentEmbedding.id == mapping.embedding_id).first()
            if emb:
                chunk = db.query(DocumentChunk).filter(DocumentChunk.id == emb.chunk_id).first()
                if chunk:
                    metadata = {
                        "chunk_id": str(chunk.id),
                        "topic": chunk.topic,
                        "heading": chunk.heading,
                        "content": chunk.content,
                        "chunk_type": chunk.chunk_type,
                        "page_numbers": chunk.page_numbers,
                        "diagram_ids": chunk.diagram_ids
                    }
        elif index_name == "diagram_index":
            emb = db.query(DiagramEmbedding).filter(DiagramEmbedding.id == mapping.embedding_id).first()
            if emb:
                diagram = db.query(DocumentDiagram).filter(DocumentDiagram.id == emb.diagram_id).first()
                if diagram:
                    metadata = {
                        "diagram_id": str(diagram.id),
                        "topic": diagram.topic,
                        "title": diagram.title,
                        "ocr_text": diagram.ocr_text,
                        "image_path": diagram.image_path
                    }
                    
        results.append({
            "faiss_id": int(faiss_id),
            "embedding_id": mapping.embedding_id,
            "document_id": mapping.document_id,
            "score": score,
            "metadata": metadata
        })
        
    return results
