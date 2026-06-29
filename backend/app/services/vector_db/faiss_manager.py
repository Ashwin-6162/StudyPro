import os
import faiss
import logging

VECTOR_DB_DIR = "storage/vector_db"
CHUNK_INDEX_PATH = os.path.join(VECTOR_DB_DIR, "chunk_index.faiss")
DIAGRAM_INDEX_PATH = os.path.join(VECTOR_DB_DIR, "diagram_index.faiss")

# We use 384 dimensions for all-MiniLM-L6-v2
DIMENSION = 384

class FaissManager:
    """
    Manages the multi-index architecture using FAISS.
    Uses IndexIDMap2 (instead of IndexIDMap) to support remove_ids().
    """
    def __init__(self):
        # Ensure directory exists
        os.makedirs(VECTOR_DB_DIR, exist_ok=True)
        
        self.chunk_index = self._load_or_create_index(CHUNK_INDEX_PATH)
        self.diagram_index = self._load_or_create_index(DIAGRAM_INDEX_PATH)

    def _load_or_create_index(self, path: str):
        if os.path.exists(path):
            try:
                logging.info(f"Loading FAISS index from {path}")
                index = faiss.read_index(path)
                # Validate dimension of loaded index matches expected
                if hasattr(index, 'd') and index.d != DIMENSION:
                    logging.error(
                        f"Loaded index at {path} has dimension {index.d}, expected {DIMENSION}. "
                        "Recreating index to avoid silent search failures."
                    )
                    raise ValueError("Dimension mismatch")
                return index
            except Exception as e:
                logging.error(f"Failed to load {path}: {e}. Creating a fresh index.")

        logging.info(f"Creating new FAISS index for {path}")
        # IndexIDMap2 supports remove_ids(), unlike IndexIDMap
        base_index = faiss.IndexFlatL2(DIMENSION)
        return faiss.IndexIDMap2(base_index)

    def save_indices(self):
        try:
            faiss.write_index(self.chunk_index, CHUNK_INDEX_PATH)
            faiss.write_index(self.diagram_index, DIAGRAM_INDEX_PATH)
            logging.info("FAISS indices saved successfully.")
        except Exception as e:
            logging.error(f"Failed to save FAISS indices: {e}")

    def get_index(self, index_name: str):
        if index_name == "chunk_index":
            return self.chunk_index
        elif index_name == "diagram_index":
            return self.diagram_index
        else:
            raise ValueError(f"Unknown index: {index_name}")

# Global singleton
faiss_manager = FaissManager()
