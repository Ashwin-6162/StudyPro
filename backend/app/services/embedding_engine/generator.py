from typing import List
import logging
import time
from app.services.gemini_service import get_client
from google.genai import types

# Using Gemini's hosted embedding API instead of a locally-loaded
# sentence-transformers model. This removes the need to load PyTorch +
# a transformer model into memory at runtime (which was a major contributor
# to OOM crashes and slow cold-starts on memory/CPU-constrained hosts like
# Render's free tier), and moves all the actual compute to Google's
# infrastructure — typically much faster per-batch than local CPU inference.
#
# We keep DIMENSION=384 (matching the old all-MiniLM-L6-v2 model) by asking
# Gemini's embedding model to truncate its output to 384 dims via
# output_dimensionality, so the existing FAISS index, validator, and DB
# schema all stay unchanged.
MODEL_NAME = "gemini-embedding-001"
DIMENSION = 384

# Gemini's embed_content endpoint accepts a batch of contents per call.
# Keep batches modest to stay well within request size / rate limits.
BATCH_SIZE = 32


def _embed_batch_with_retry(texts: List[str], task_type: str = "RETRIEVAL_DOCUMENT", max_retries: int = 3) -> List[List[float]]:
    """
    Calls Gemini's embedding endpoint for a batch of texts, with basic
    retry/backoff on transient errors (mirrors the pattern already used
    in gemini_service.generate()).

    task_type should be "RETRIEVAL_DOCUMENT" when embedding chunks/diagrams
    being stored for later search, and "RETRIEVAL_QUERY" when embedding a
    user's search query — Gemini's embedding model optimizes each slightly
    differently for better retrieval quality.
    """
    client = get_client()
    base_delay = 2

    for attempt in range(max_retries):
        try:
            response = client.models.embed_content(
                model=MODEL_NAME,
                contents=texts,
                config=types.EmbedContentConfig(
                    output_dimensionality=DIMENSION,
                    task_type=task_type,
                ),
            )
            return [embedding.values for embedding in response.embeddings]
        except Exception as e:
            error_msg = str(e)
            is_retryable = (
                "429" in error_msg or "503" in error_msg
                or "RESOURCE_EXHAUSTED" in error_msg or "UNAVAILABLE" in error_msg
            )
            if is_retryable and attempt < max_retries - 1:
                logging.warning(
                    f"Gemini embedding API error. Retrying in {base_delay}s... "
                    f"(Attempt {attempt+1}/{max_retries})"
                )
                time.sleep(base_delay)
                base_delay *= 2
                continue
            logging.error(f"Gemini embedding generation failed after {attempt+1} attempts: {e}")
            raise e


def get_embedding_model():
    """
    Kept for backward compatibility with any code that imports this name.
    No local model is loaded anymore — Gemini's API handles inference.
    """
    return None


def generate_embeddings_batch(texts: List[str], task_type: str = "RETRIEVAL_DOCUMENT") -> List[List[float]]:
    """
    Generates embeddings for a batch of strings using Gemini's hosted
    embedding API. Splits into sub-batches of BATCH_SIZE to stay within
    request limits, and returns a flat list of vectors (lists of floats)
    in the same order as the input texts.

    Pass task_type="RETRIEVAL_QUERY" when embedding a search query rather
    than a document chunk being indexed.
    """
    if not texts:
        return []

    all_vectors: List[List[float]] = []
    for i in range(0, len(texts), BATCH_SIZE):
        sub_batch = texts[i:i + BATCH_SIZE]
        vectors = _embed_batch_with_retry(sub_batch, task_type=task_type)
        all_vectors.extend(vectors)

    return all_vectors
