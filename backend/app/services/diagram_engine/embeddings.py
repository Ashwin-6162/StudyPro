import os
import numpy as np
import faiss
from sentence_transformers import SentenceTransformer
import logging

MODEL_NAME = "all-MiniLM-L6-v2"
INDEX_PATH = "storage/diagram_index.faiss"

# Lazy loading of model
_model = None

def get_model():
    global _model
    if _model is None:
        logging.info(f"Loading SentenceTransformer model {MODEL_NAME}")
        _model = SentenceTransformer(MODEL_NAME)
    return _model

def generate_embedding(text: str) -> np.ndarray:
    model = get_model()
    # SentenceTransformer returns an embedding array
    embedding = model.encode([text])[0]
    return embedding

class FaissIndexManager:
    def __init__(self, dimension=384):
        self.dimension = dimension
        self.index = None
        self.id_mapping = [] # Maps FAISS index to Diagram UUID strings
        
        # Load existing index if any (we keep it simple for now)
        if os.path.exists(INDEX_PATH):
            try:
                self.index = faiss.read_index(INDEX_PATH)
                logging.info("Loaded existing FAISS index")
            except Exception as e:
                logging.error(f"Failed to load FAISS index: {e}")
                self.index = faiss.IndexFlatL2(self.dimension)
        else:
            self.index = faiss.IndexFlatL2(self.dimension)
            
    def add_diagram(self, diagram_id: str, embedding: np.ndarray):
        vec = np.array([embedding], dtype=np.float32)
        self.index.add(vec)
        self.id_mapping.append(diagram_id)
        # In a real system, we'd save the mapping to DB or disk as well
        
    def search(self, query_embedding: np.ndarray, k=5):
        if self.index.ntotal == 0:
            return []
            
        vec = np.array([query_embedding], dtype=np.float32)
        distances, indices = self.index.search(vec, k)
        
        results = []
        for i, idx in enumerate(indices[0]):
            if idx < len(self.id_mapping) and idx != -1:
                results.append({
                    "diagram_id": self.id_mapping[idx],
                    "score": float(distances[0][i]) # L2 distance (lower is better)
                })
        return results

# Singleton manager
index_manager = FaissIndexManager()
