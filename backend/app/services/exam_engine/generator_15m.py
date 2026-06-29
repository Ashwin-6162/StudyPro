import logging
import json
from sqlalchemy.orm import Session
from app.schemas.exam import ExamAnswerRequestSchema, ExamAnswerResponseSchema
from app.schemas.context import ContextRequestSchema
from app.schemas.diagram_reconstruction import DiagramReconstructRequest
from app.services.context_builder.builder import build_context_package
from app.services.exam_engine.prompt_builder_15m import build_15m_system_prompt, build_15m_user_prompt
from app.services.chat_engine.llm_client import generate_text
from app.services.exam_engine.validator_15m import validate_15m_answer
from app.services.exam_engine.validator_8m import count_words
from app.services.diagram_reconstruction.pipeline import reconstruct_diagram_pipeline

logging.basicConfig(filename="logs/15m_generator.log", level=logging.INFO, 
                    format="%(asctime)s - %(levelname)s - %(message)s")

MAX_RETRIES = 2

def generate_15m_answer(request: ExamAnswerRequestSchema, db: Session) -> ExamAnswerResponseSchema:
    
    # 1. Build Context via Phase 7 in 15M mode (pulls more data)
    context_req = ContextRequestSchema(query=request.query, document_id=request.document_id, top_k=20)
    context_package = build_context_package(context_req, "15M", db)
    
    # 2. Proceed even if context is empty to allow external knowledge fallback

    # 2. Diagram Fallback (Phase 11 Integration)
    if not context_package.diagrams:
        try:
            logging.info("No diagrams in context. Attempting Diagram Reconstruction...")
            diag_req = DiagramReconstructRequest(topic=context_package.topic, document_id=request.document_id)
            recon_resp = reconstruct_diagram_pipeline(diag_req, db)
            
            # Inject reconstructed diagram into context package so the prompt builder uses it
            class TempDiag:
                diagram_id = recon_resp.diagram_id
                topic = recon_resp.topic
                title = f"{recon_resp.topic} Architecture Flow"
                ocr_text = "Reconstructed Nodes: " + ", ".join(recon_resp.nodes)
            context_package.diagrams.append(TempDiag())
        except Exception as e:
            logging.warning(f"Diagram reconstruction failed or not applicable: {e}")
            
    # 3. Prompts
    system_prompt = build_15m_system_prompt(request.format_mode)
    user_prompt = build_15m_user_prompt(request.query, context_package)
    context_str = json.dumps(context_package.content_sections)
    
    import time
    start_time = time.time()
    used_provider = request.provider
    
    # 4. Generate & Validate
    raw_answer = ""
    is_valid = False
    exam_score_passed = False
    
    for attempt in range(MAX_RETRIES):
        try:
            logging.info(f"LLM 15M Generation Attempt {attempt + 1}")
            result = generate_text(system_prompt, user_prompt, provider=request.provider)
            raw_answer = result.text
            used_provider = result.provider
            
            valid, score = validate_15m_answer(raw_answer, context_str)
            if valid:
                is_valid = True
                exam_score_passed = score
                if score:
                    break # Perfect answer, stop retrying
                else:
                    logging.warning("Valid length, but failed EXAM_SCORE_MODE strict structure. Retrying if attempts remain...")
            else:
                logging.warning("Answer failed basic length/hallucination validation. Retrying...")
                
        except Exception as e:
            logging.error(f"Failed to generate LLM text: {e}")
            break
            
    if not is_valid and not raw_answer:
        raw_answer = "Failed to generate a valid 15 Mark answer after multiple attempts due to strict validation limits."
        
    diagram_used = False
    if context_package.diagrams and "![Diagram" in raw_answer:
        diagram_used = True
        
    # No longer checking for INSUFFICIENT_INFO_STR, LLM handles fallback with disclaimer
        
    return ExamAnswerResponseSchema(
        query=request.query, answer_type="15M", topic=context_package.topic,
        answer=raw_answer.strip(), word_count=count_words(raw_answer),
        diagram_used=diagram_used, citations=context_package.citations,
        exam_score_mode=exam_score_passed, ready_for_display=True,
        provider=used_provider, processing_time=round(time.time() - start_time, 2)
    )
