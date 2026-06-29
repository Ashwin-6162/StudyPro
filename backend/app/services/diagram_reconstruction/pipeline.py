import logging
import json
from sqlalchemy.orm import Session
from app.schemas.context import ContextRequestSchema
from app.schemas.diagram_reconstruction import DiagramReconstructRequest, DiagramReconstructResponse
from app.services.context_builder.builder import build_context_package
from app.models.diagram_reconstruction import ReconstructedDiagram
from app.services.diagram_reconstruction.extractor import extract_diagram_structure
from app.services.diagram_reconstruction.validator import validate_diagram_schema

logging.basicConfig(filename="logs/diagram_reconstruction.log", level=logging.INFO, 
                    format="%(asctime)s - %(levelname)s - %(message)s")

def reconstruct_diagram_pipeline(request: DiagramReconstructRequest, db: Session) -> DiagramReconstructResponse:
    # 1. Fetch relevant context
    context_req = ContextRequestSchema(query=request.topic, document_id=request.document_id, top_k=10)
    context_package = build_context_package(context_req, "GENERIC", db)
    
    if not context_package.content_sections:
        raise ValueError("Insufficient context to reconstruct diagram.")
        
    # Serialize context to pass to LLM
    context_str = json.dumps(context_package.content_sections, indent=2)
    
    # 2. Extract Structure
    import time
    start_time = time.time()
    
    schema, used_provider = extract_diagram_structure(request.topic, context_str, provider=request.provider)
    
    if "error" in schema:
        raise ValueError(schema["error"])
        
    # 3. Validate Grounding
    if not validate_diagram_schema(schema, context_str):
        raise ValueError("Generated diagram failed hallucination validation.")
        
    # 4. Save to Database
    # Flatten source pages
    all_pages = set()
    for c in context_package.citations:
        all_pages.update(c.pages)
        
    new_diagram = ReconstructedDiagram(
        document_id=request.document_id,
        topic=request.topic,
        diagram_type="ARCHITECTURE_OR_FLOW", # Default generic type
        nodes=schema["nodes"],
        edges=schema["edges"],
        source_pages=list(all_pages)
    )
    
    db.add(new_diagram)
    db.commit()
    db.refresh(new_diagram)
    
    logging.info(f"Successfully generated Reconstructed Diagram: {new_diagram.diagram_id}")
    
    return DiagramReconstructResponse(
        diagram_id=new_diagram.diagram_id,
        topic=new_diagram.topic,
        diagram_type=new_diagram.diagram_type,
        nodes=new_diagram.nodes,
        edges=new_diagram.edges,
        source_pages=new_diagram.source_pages,
        provider=used_provider,
        processing_time=round(time.time() - start_time, 2)
    )
