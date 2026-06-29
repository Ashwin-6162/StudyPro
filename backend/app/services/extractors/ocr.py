import pytesseract
from PIL import Image
import logging

def perform_ocr_on_image(image_path: str) -> dict:
    """
    Performs OCR on an image file. 
    Returns text and a mock confidence score (Tesseract can provide it, but for simplicity here we return 0.0 unless configured).
    """
    try:
        text = pytesseract.image_to_string(Image.open(image_path))
        return {
            "text": text.strip(),
            "confidence": 85.0 # Mock confidence for now
        }
    except Exception as e:
        logging.warning(f"OCR failed for {image_path}: {str(e)}")
        return {
            "text": "",
            "confidence": 0.0
        }
