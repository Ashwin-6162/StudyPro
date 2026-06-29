from sqlalchemy.orm import Session
from app.database.connection import SessionLocal
from app.models.document import UploadedDocument
from app.models.chunking import DocumentChunk
from app.models.extraction import DocumentDiagram
from app.schemas.context import ContextRequestSchema, ContextPackageSchema
from app.services.vector_db.retriever import hybrid_search
from app.services.context_builder.validator import validate_and_deduplicate
from app.services.context_builder.ranker import rank_chunks
from app.services.context_builder.assembler import assemble_context

def build_context_package(request: ContextRequestSchema, answer_type: str, db: Session) -> ContextPackageSchema:
    # 1. Retrieve raw chunks from FAISS (fetch 2x top_k then filter down)
    raw_results = hybrid_search(query=request.query, top_k=request.top_k * 2, index_name="chunk_index", db=db)

    # Optional filtering by document_id if requested
    if request.document_id:
        raw_results = [r for r in raw_results if r["document_id"] == request.document_id]

    # 2. Validate and deduplicate
    valid_chunks = validate_and_deduplicate(raw_results)

    # 3. Rank
    ranked_chunks = rank_chunks(valid_chunks, answer_type)

    # 4. Gather diagram metadata and document filenames
    diagram_ids_needed = set()
    for rc in ranked_chunks:
        for did in rc.get("metadata", {}).get("diagram_ids", []):
            diagram_ids_needed.add(did)

    diagram_metadata_map = {}
    if diagram_ids_needed:
        diagrams = db.query(DocumentDiagram).filter(DocumentDiagram.id.in_(list(diagram_ids_needed))).all()
        for d in diagrams:
            diagram_metadata_map[str(d.id)] = {
                "topic": d.topic,
                "title": d.title,
                "image_path": d.image_path,
                "ocr_text": d.ocr_text
            }

    # Collect document filenames
    doc_ids_needed = {rc["document_id"] for rc in ranked_chunks}
    document_map = {}
    if doc_ids_needed:
        docs = db.query(UploadedDocument).filter(UploadedDocument.id.in_(list(doc_ids_needed))).all()
        doc_filename_map = {d.id: d.original_filename for d in docs}

        for rc in ranked_chunks:
            chunk_id = rc["metadata"]["chunk_id"]
            doc_id = rc["document_id"]
            document_map[chunk_id] = doc_filename_map.get(doc_id, "Unknown.pdf")

    # 5. Assemble and token-cap
    # Each answer type has a different context budget:
    #   8M  → short answer, needs less context
    #   MCQ → medium, multiple questions from varied chunks
    #   15M → long answer, needs the most context
    #   GENERIC / anything else → default cap
    if answer_type == "8M":
        max_tokens = 3000
    elif answer_type == "MCQ":
        max_tokens = 4000
    elif answer_type == "15M":
        max_tokens = 8000
    else:
        max_tokens = 6000

    package = assemble_context(
        query=request.query,
        ranked_chunks=ranked_chunks,
        answer_type=answer_type,
        diagram_metadata_map=diagram_metadata_map,
        document_map=document_map,
        max_tokens=max_tokens
    )

    return package
