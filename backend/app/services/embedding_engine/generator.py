from typing import List
import numpy as np
import logging
from sentence_transformers import SentenceTransformer

MODEL_NAME = "all-MiniLM-L6-v2"
DIMENSION = 384

_model = None

def get_embedding_model() -> SentenceTransformer:
    global _model
    if _model is None:
        logging.info(f"Loading Embedding Model: {MODEL_NAME}")
        _model = SentenceTransformer(MODEL_NAME)
    return _model

def generate_embeddings_batch(texts: List[str]) -> List[List[float]]:
    """
    Generates embeddings for a batch of strings.
    Returns a list of vectors (which are lists of floats).
    """
    if not texts:
        return []
        
    model = get_embedding_model()
    # Batch encode
    embeddings = model.encode(texts, convert_to_numpy=True)
    
    # Convert numpy array to list of floats for JSON storage
    return [vec.tolist() for vec in embeddings]
