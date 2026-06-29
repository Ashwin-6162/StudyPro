import re

def classify_chunk(text: str) -> str:
    """
    Classifies a chunk into specific academic types:
    DEFINITION, FORMULA, TABLE, QUESTION, EXAMPLE, SUMMARY, NORMAL_CONTENT
    """
    text_lower = text.lower()
    
    # Definitions
    if re.search(r'\b(is defined as|refers to|means|is a type of|is an?)\b', text_lower) and len(text.split()) < 100:
        if "what is" not in text_lower:
            return "DEFINITION"
            
    # Formulas (heuristic: lots of math symbols relative to words, or explicit equations)
    math_symbols = sum(1 for c in text if c in "=+-*/∑()[]{}")
    if math_symbols > 5 and len(text.split()) < 50:
        return "FORMULA"
        
    # Questions
    if text.strip().endswith("?") and text_lower.startswith(("what", "how", "why", "explain", "describe", "compare")):
        return "QUESTION"
        
    # Examples
    if text_lower.startswith(("for example", "e.g.", "consider the case", "instance:")):
        return "EXAMPLE"
        
    # Summary
    if text_lower.startswith(("in summary", "to conclude", "conclusion", "summary")):
        return "SUMMARY"
        
    return "NORMAL_CONTENT"
