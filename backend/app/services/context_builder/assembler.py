import tiktoken
from typing import List, Dict, Any, Set
import logging
from app.schemas.context import ContextPackageSchema, CitationSchema, DiagramContextSchema

encoder = tiktoken.get_encoding("cl100k_base")

def get_token_count(text: str) -> int:
    return len(encoder.encode(text))

def assemble_context(
    query: str, 
    ranked_chunks: List[Dict[str, Any]], 
    answer_type: str, 
    diagram_metadata_map: Dict[str, Dict[str, Any]],
    document_map: Dict[str, str], # Maps chunk_id to document name
    max_tokens: int = 6000
) -> ContextPackageSchema:
    
    content_sections: Dict[str, List[str]] = {}
    citations: List[CitationSchema] = []
    diagrams: List[DiagramContextSchema] = []
    
    current_tokens = 0
    topic = "General Academic Concepts"
    seen_diagram_ids: Set[str] = set()
    
    # 1. Iteratively add chunks until token limit is hit
    for chunk in ranked_chunks:
        meta = chunk.get("metadata", {})
        content = meta.get("content", "")
        heading = meta.get("heading", "General Content")
        chunk_topic = meta.get("topic", topic)
        
        chunk_tokens = get_token_count(content)
        
        if current_tokens + chunk_tokens > max_tokens:
            logging.info(f"Context builder reached max tokens {max_tokens}. Truncating.")
            break
            
        current_tokens += chunk_tokens
        topic = chunk_topic # Update primary topic
        
        # Add content
        if heading not in content_sections:
            content_sections[heading] = []
        content_sections[heading].append(content)
        
        # Add citations
        pages = meta.get("page_numbers", [])
        chunk_id = meta.get("chunk_id")
        file_name = document_map.get(chunk_id, "Unknown_Document.pdf")
        
        if pages:
            # Simple deduping: Check if citation already roughly exists
            exists = any(c.file_name == file_name and set(c.pages) == set(pages) for c in citations)
            if not exists:
                citations.append(CitationSchema(file_name=file_name, pages=pages))
                
        # Add diagrams
        diagram_ids = meta.get("diagram_ids", [])
        for did in diagram_ids:
            if did not in seen_diagram_ids and did in diagram_metadata_map:
                d_meta = diagram_metadata_map[did]
                diagrams.append(DiagramContextSchema(
                    diagram_id=did,
                    topic=d_meta.get("topic"),
                    title=d_meta.get("title"),
                    image_path=d_meta.get("image_path", ""),
                    ocr_text=d_meta.get("ocr_text")
                ))
                seen_diagram_ids.add(did)
                
    return ContextPackageSchema(
        query=query,
        topic=topic,
        answer_type=answer_type,
        content_sections=content_sections,
        diagrams=diagrams,
        citations=citations,
        estimated_tokens=current_tokens
    )
