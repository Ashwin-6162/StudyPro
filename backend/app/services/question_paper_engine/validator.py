import logging
from typing import Dict, Any, List

def validate_question_batch(schema: Dict[str, Any], existing_questions_text: List[str]) -> tuple[bool, List[Dict]]:
    """
    Validates a batch of generated questions and strips out any that overlap semantically 
    with previously generated questions across the paper.
    """
    if "error" in schema:
        return False, []
        
    questions = schema.get("questions", [])
    if not questions:
        logging.warning("Question generation returned empty array.")
        return False, []
        
    valid_questions = []
    
    for q in questions:
        if "question_text" not in q or "difficulty" not in q or "topic" not in q:
            continue
            
        q_text = q["question_text"].strip()
        
        # Deduplication Heuristic
        # In a real system, we'd use embedding similarity here.
        # For now, we do basic keyword overlap checks.
        is_duplicate = False
        q_words = set(q_text.lower().split())
        
        for eq in existing_questions_text:
            eq_words = set(eq.lower().split())
            # If > 70% of words overlap, call it a duplicate concept
            if len(q_words) > 0 and len(q_words.intersection(eq_words)) / len(q_words) > 0.7:
                is_duplicate = True
                break
                
        if is_duplicate:
            logging.warning(f"Stripped duplicate question: {q_text}")
            continue
            
        valid_questions.append(q)
        existing_questions_text.append(q_text) # add to the tracker
        
    if not valid_questions:
        return False, []
        
    return True, valid_questions
