import logging


def count_words(text: str) -> int:
    return len(text.split())

def validate_8m_answer(answer: str) -> bool:
    """
    Validates the 8 Mark answer for word count and hallucinations.
    Returns True if valid, False if it should be rejected/retried.
    """

    words = count_words(answer)
    logging.info(f"Generated 8M answer word count: {words}")
    
    if words > 400: # New maximum limit
        logging.warning(f"8M Answer rejected: Too long ({words} words). Maximum is 400.")
        return False
        
    # Hallucination heuristics
    if "as an ai" in answer.lower() or "i don't have access" in answer.lower():
        return False
        
    # Check if structure roughly exists
    if "## Introduction" not in answer and "Introduction" not in answer:
        logging.warning("8M Answer missing Introduction structure.")
        # We might not strictly reject just for this, but it's a good heuristic
        
    return True
