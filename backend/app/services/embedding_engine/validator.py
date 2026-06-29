from typing import List

def validate_embedding(vector: List[float], expected_dimension: int = 384) -> bool:
    """
    Validates that a generated embedding vector is correct.
    Checks:
    - Not empty
    - Exactly correct dimension
    - No null/None values
    """
    if not vector:
        return False
        
    if len(vector) != expected_dimension:
        return False
        
    if any(v is None for v in vector):
        return False
        
    return True
