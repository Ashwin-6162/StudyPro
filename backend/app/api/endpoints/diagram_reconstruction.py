from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID
from app.database.connection import get_db
from app.schemas.diagram_reconstruction import DiagramReconstructRequest, DiagramReconstructResponse
from app.services.diagram_reconstruction.pipeline import reconstruct_diagram_pipeline
from app.models.diagram_reconstruction import ReconstructedDiagram

router = APIRouter()

@router.post("/diagram/reconstruct", response_model=DiagramReconstructResponse)
def reconstruct_diagram(request: DiagramReconstructRequest, db: Session = Depends(get_db)):
    try:
        return reconstruct_diagram_pipeline(request, db)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Diagram generation failed: {str(e)}")

@router.get("/diagram/reconstructed/{diagram_id}", response_model=DiagramReconstructResponse)
def get_reconstructed_diagram(diagram_id: UUID, db: Session = Depends(get_db)):
    diagram = db.query(ReconstructedDiagram).filter(ReconstructedDiagram.diagram_id == diagram_id).first()
    if not diagram:
        raise HTTPException(status_code=404, detail="Diagram not found")
        
    return DiagramReconstructResponse(
        diagram_id=diagram.diagram_id,
        topic=diagram.topic,
        diagram_type=diagram.diagram_type,
        nodes=diagram.nodes,
        edges=diagram.edges,
        source_pages=diagram.source_pages or []
    )

@router.delete("/diagram/reconstructed/{diagram_id}")
def delete_reconstructed_diagram(diagram_id: UUID, db: Session = Depends(get_db)):
    diagram = db.query(ReconstructedDiagram).filter(ReconstructedDiagram.diagram_id == diagram_id).first()
    if not diagram:
        raise HTTPException(status_code=404, detail="Diagram not found")
        
    db.delete(diagram)
    db.commit()
    return {"message": "Diagram deleted successfully"}
