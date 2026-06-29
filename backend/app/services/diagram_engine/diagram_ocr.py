import pytesseract
from PIL import Image
import logging

def extract_diagram_text(image_path: str) -> str:
    """
    Uses Tesseract to extract text from a diagram image.
    """
    try:
        text = pytesseract.image_to_string(Image.open(image_path))
        return text.strip()
    except Exception as e:
        logging.warning(f"Diagram OCR failed for {image_path}: {e}")
        return ""
