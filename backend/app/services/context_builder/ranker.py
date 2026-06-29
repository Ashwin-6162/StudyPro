from typing import List, Dict, Any

# Higher priority means it's sorted first
TYPE_PRIORITY = {
    "DEFINITION": 100,
    "FORMULA": 90,
    "TABLE": 80,
    "SUMMARY": 70,
    "EXAMPLE": 60,
    "NORMAL_CONTENT": 50,
    "QUESTION": 40
}

def rank_chunks(chunks: List[Dict[str, Any]], answer_type: str) -> List[Dict[str, Any]]:
    """
    Re-ranks chunks based on Vector DB similarity score and categorical priority.
    """
    def get_score(chunk: Dict[str, Any]) -> float:
        # Lower FAISS distance is better, so we want to sort ascending by distance natively,
        # but we also want to boost priority.
        # A simple hack for sorting: tuple of (-Priority, FAISS Score)
        # So we sort by Highest Priority first, then by lowest FAISS score.
        chunk_type = chunk.get("metadata", {}).get("chunk_type", "NORMAL_CONTENT")
        priority = TYPE_PRIORITY.get(chunk_type, 50)
        
        if answer_type == "MCQ":
            # For MCQ, definitions and tables are extremely high priority
            if chunk_type in ["DEFINITION", "TABLE"]:
                priority += 50
                
        faiss_score = chunk.get("score", 0.0)
        
        return (-priority, faiss_score)
        
    return sorted(chunks, key=get_score)
