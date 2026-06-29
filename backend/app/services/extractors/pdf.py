import os
import fitz  # PyMuPDF
from PIL import Image
import io
import logging

def extract_pdf(file_path: str, document_id: str, images_dir: str):
    """
    Extracts text and images from a PDF using PyMuPDF.
    """
    extracted_data = {
        "pages": [],
        "headings": [],
        "images": [],
        "diagrams": [],
        "tables": []
    }

    try:
        doc = fitz.open(file_path)
        for page_num in range(len(doc)):
            page = doc.load_page(page_num)
            
            # Extract text
            text = page.get_text("text")
            extracted_data["pages"].append({
                "page_number": page_num + 1,
                "text_content": text
            })
            
            # Extract images
            image_list = page.get_images(full=True)
            for img_index, img in enumerate(image_list, start=1):
                xref = img[0]
                base_image = doc.extract_image(xref)
                image_bytes = base_image["image"]
                image_ext = base_image["ext"]
                
                # Save image
                image_filename = f"{document_id}_page{page_num+1}_img{img_index}.{image_ext}"
                image_path = os.path.join(images_dir, image_filename)
                
                try:
                    image = Image.open(io.BytesIO(image_bytes))
                    image.save(image_path)
                    
                    extracted_data["images"].append({
                        "page_number": page_num + 1,
                        "image_path": image_path
                    })
                except Exception as e:
                    logging.error(f"Failed to save image {image_filename}: {str(e)}")
                    
        doc.close()
        
        # We could also run pdfplumber here for tables, but skipping due to scope constraints 
        # unless explicitly invoked. PyMuPDF text handles basic layout.
        
    except Exception as e:
        logging.error(f"Error processing PDF {file_path}: {str(e)}")
        raise e

    return extracted_data
