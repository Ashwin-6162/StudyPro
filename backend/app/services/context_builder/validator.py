from typing import List, Dict, Any

def validate_and_deduplicate(chunks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Validates retrieved chunks and removes duplicates.
    Expects chunks to be in the format returned by retriever.py
    """
    valid_chunks = []
    seen_chunk_ids = set()
    
    for chunk in chunks:
        metadata = chunk.get("metadata", {})
        
        # 1. Validation
        if not metadata:
            continue
            
        chunk_id = metadata.get("chunk_id")
        if not chunk_id:
            continue
            
        if not metadata.get("content"):
            continue
            
        # 2. Deduplication
        if chunk_id in seen_chunk_ids:
            continue
            
        seen_chunk_ids.add(chunk_id)
        valid_chunks.append(chunk)
        
    return valid_chunks
