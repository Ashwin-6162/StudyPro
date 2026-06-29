import logging
from sqlalchemy.orm import Session
from app.schemas.chat import ChatRequestSchema, ChatResponseSchema
from app.schemas.context import ContextRequestSchema
from app.services.context_builder.builder import build_context_package
from app.services.chat_engine.prompt_builder import build_system_prompt, build_user_prompt
from app.services.chat_engine.llm_client import generate_text
from app.services.chat_engine.validator import validate_answer

logging.basicConfig(filename="logs/chat_answer_generator.log", level=logging.INFO, 
                    format="%(asctime)s - %(levelname)s - %(message)s")

def generate_chat_answer(request: ChatRequestSchema, answer_type: str, db: Session) -> ChatResponseSchema:
    
    # 1. Build Context via Phase 7
    context_req = ContextRequestSchema(
        query=request.query,
        document_id=request.document_id,
        top_k=5 # Chat needs less context than a 15M answer
    )
    # Using generic context builder
    context_package = build_context_package(context_req, "GENERIC", db)
    
    # 2. Proceed even if context is empty to allow external knowledge fallback
        
    # 3. Build Prompts
    system_prompt = build_system_prompt(answer_type, request.response_length)
    user_prompt = build_user_prompt(request.query, context_package)
    
    import time
    start_time = time.time()
    
    # 4. Generate Answer via LLM
    used_provider = request.provider
    try:
        result = generate_text(system_prompt, user_prompt, provider=request.provider)
        raw_answer = result.text
        used_provider = result.provider
    except Exception as e:
        logging.error(f"Failed to generate LLM text: {e}")
        return ChatResponseSchema(
            query=request.query,
            answer="Error communicating with LLM provider.",
            diagram_used=False,
            citations=[],
            ready_for_display=False,
            provider=used_provider,
            processing_time=round(time.time() - start_time, 2)
        )
        
    # 5. Validate Answer
    if not validate_answer(raw_answer):
        raw_answer = "The generated answer was rejected by the hallucination prevention firewall."
        
    diagram_used = bool(context_package.diagrams)
    
    # No longer checking for INSUFFICIENT_INFO_STR, LLM handles fallback with disclaimer
        
    return ChatResponseSchema(
        query=request.query,
        answer=raw_answer.strip(),
        diagram_used=diagram_used,
        citations=context_package.citations,
        ready_for_display=True,
        provider=used_provider,
        processing_time=round(time.time() - start_time, 2)
    )
