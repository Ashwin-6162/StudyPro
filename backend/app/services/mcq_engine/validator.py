import logging
from typing import Dict, Any, List

def validate_mcq_batch(schema: Dict[str, Any]) -> tuple[bool, List[Dict]]:
    """
    Validates the generated MCQ JSON array.
    Returns (is_valid, list_of_valid_questions).
    """
    if "error" in schema:
        return False, []
        
    questions = schema.get("questions", [])
    if not questions:
        logging.warning("MCQ generation returned an empty questions array.")
        return False, []
        
    valid_questions = []
    
    for q in questions:
        # Basic schema checks
        if "question" not in q or "options" not in q or "correct_answer" not in q or "explanation" not in q:
            logging.warning(f"Skipping MCQ missing required fields: {q}")
            continue
            
        options = q["options"]
        if len(options) != 4:
            logging.warning(f"Skipping MCQ with invalid options length: {len(options)}")
            continue
            
        # Distractor Quality Check: Ensure options are unique
        # We strip common prefixes like "A. ", "B. " just to be safe
        clean_opts = [opt.split(".", 1)[-1].strip().lower() if "." in opt[:3] else opt.lower() for opt in options]
        if len(set(clean_opts)) != 4:
            logging.warning("Skipping MCQ with duplicate distractors.")
            continue
            
        valid_questions.append(q)
        
    if not valid_questions:
        return False, []
        
    return True, valid_questions
