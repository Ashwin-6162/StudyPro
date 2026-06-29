import re

def clean_text(text: str) -> str:
    """
    Cleans OCR noise and formatting artifacts.
    Preserves newlines for paragraph boundaries.
    """
    if not text:
        return ""
    
    # Remove duplicate spaces
    text = re.sub(r' +', ' ', text)
    
    # Remove isolated special characters or excessive symbols
    text = re.sub(r'([^\w\s])\1{3,}', r'\1', text) 
    
    # Trim empty lines but allow double newlines for paragraph breaks
    lines = text.split('\n')
    cleaned_lines = [line.strip() for line in lines if line.strip()]
    
    return "\n\n".join(cleaned_lines)
