import os

def extract_txt(file_path: str, document_id: str):
    """
    Extracts text from a TXT file.
    Since TXT files have no pages, it returns a single page object.
    """
    extracted_data = {
        "pages": [],
        "headings": [],
        "images": [],
        "diagrams": [],
        "tables": []
    }

    try:
        with open(file_path, "r", encoding="utf-8") as f:
            text = f.read()
            extracted_data["pages"].append({
                "page_number": 1,
                "text_content": text
            })
    except UnicodeDecodeError:
        # Fallback for different encodings
        with open(file_path, "r", encoding="latin-1") as f:
            text = f.read()
            extracted_data["pages"].append({
                "page_number": 1,
                "text_content": text
            })
    
    return extracted_data
