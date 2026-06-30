import os
import numpy as np
import faiss
import logging
from app.services.gemini_service import get_client
from google.genai import types

# Migrated to Gemini's hosted embedding API for the same reasons as
# embedding_engine/generator.py — avoids loading a local PyTorch +
# sentence-transformers model into memory, which was causing OOM crashes
# and slow CPU-bound inference on Render's free tier.
MODEL_NAME = "gemini-embedding-001"
DIMENSION = 384
INDEX_PATH = "storage/diagram_index.faiss"


def generate_embedding(text: str) -> np.ndarray:
    """
    Generates a single embedding via Gemini's hosted embedding API.
    Kept the same function signature (text in, np.ndarray out) so callers
    (diagram_engine/pipeline.py) don't need to change.
    """
    client = get_client()
    response = client.models.embed_content(
        model=MODEL_NAME,
        contents=[text],
        config=types.EmbedContentConfig(
            output_dimensionality=DIMENSION,
            task_type="RETRIEVAL_DOCUMENT",
        ),
    )
    return np.array(response.embeddings[0].values, dtype=np.float32)


class FaissIndexManager:
    def __init__(self, dimension=DIMENSION):
        self.dimension = dimension
        self.index = None
        self.id_mapping = []  # Maps FAISS index to Diagram UUID strings

        # Ensure the storage directory exists before trying to read/write
        os.makedirs(os.path.dirname(INDEX_PATH), exist_ok=True)

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
                    "score": float(distances[0][i])  # L2 distance (lower is better)
                })
        return results


# Singleton manager
index_manager = FaissIndexManager()
