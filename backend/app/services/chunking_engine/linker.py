from typing import List, Dict

def link_diagrams_to_chunk(chunk_content: str, chunk_pages: List[int], document_diagrams: List) -> List[str]:
    """
    Links diagrams to a specific chunk based on:
    1. Page overlap (if diagram is on the same page as the chunk)
    2. Context overlap (if the diagram title/keywords appear in the chunk text)
    Returns a list of Diagram UUIDs as strings.
    """
    linked_ids = []
    chunk_text_lower = chunk_content.lower()
    
    for diagram in document_diagrams:
        # Check page match
        if diagram.page_number in chunk_pages:
            linked_ids.append(str(diagram.id))
            continue
            
        # Check semantic/keyword match
        # E.g., if chunk mentions "CNN Architecture" and diagram title is "CNN Architecture"
        if diagram.title and diagram.title.lower() in chunk_text_lower:
            linked_ids.append(str(diagram.id))
            continue
            
        # Or if keywords match strongly
        if diagram.keywords:
            matches = sum(1 for kw in diagram.keywords if kw.lower() in chunk_text_lower)
            if matches >= 2: # At least 2 keywords match
                linked_ids.append(str(diagram.id))
                
    # Remove duplicates while preserving order
    return list(dict.fromkeys(linked_ids))
