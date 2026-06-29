from typing import List, Tuple
import logging

def extract_keywords(text: str) -> List[str]:
    """
    Very basic keyword extraction.
    In production, use spaCy or an LLM.
    """
    words = text.lower().split()
    # Filter out small words
    keywords = [w.strip(",.()[]{}!?:;\"'") for w in words if len(w) > 4]
    # Remove duplicates
    return list(set(keywords))

def associate_topic_and_title(ocr_text: str, page_headings: List[str]) -> Tuple[str, str, List[str]]:
    """
    Returns (topic, title, keywords) based on OCR and page headings.
    """
    keywords = extract_keywords(ocr_text)
    
    # Simple logic: If we have headings on the page, use the last heading as topic/title
    topic = "General Academic Topic"
    title = "Academic Diagram"
    
    if page_headings:
        topic = page_headings[-1]
        title = f"{topic} Diagram"
    elif keywords:
        topic = keywords[0].capitalize()
        title = f"{topic} Diagram"
        
    return topic, title, keywords
