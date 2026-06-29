import logging
import json
from app.services.exam_engine.validator_8m import count_words

def validate_15m_answer(answer: str, context_str: str) -> tuple[bool, bool]:
    """
    Validates the 15 Mark answer for word count and hallucinations.
    Returns (is_valid, exam_score_mode_passed).
    """

    words = count_words(answer)
    logging.info(f"Generated 15M answer word count: {words}")
    
    if words > 600: # New maximum limit
        logging.warning(f"15M Answer rejected: Too long ({words} words). Maximum is 600.")
        return False, False
        
    if "as an ai" in answer.lower() or "i don't have access" in answer.lower():
        return False, False
        
    # EXAM_SCORE_MODE Check
    # Ensure Introduction and Conclusion are always present
    exam_score = True
    if "## Introduction" not in answer and "Introduction" not in answer:
        exam_score = False
        
    if "## Detailed Explanation" not in answer and "Detailed Explanation" not in answer:
        exam_score = False
        
    if "## Conclusion" not in answer and "Conclusion" not in answer:
        exam_score = False
        
    # Dynamic checks: Only penalize if the context actually contained "advantage" or "disadvantage"
    context_lower = context_str.lower()
    
    if "advantage" in context_lower or "benefit" in context_lower:
        if "## Advantages" not in answer and "Advantages" not in answer:
            exam_score = False
            
    if "disadvantage" in context_lower or "drawback" in context_lower or "limitation" in context_lower:
        if "## Disadvantages" not in answer and "Disadvantages" not in answer:
            exam_score = False
            
    return True, exam_score
