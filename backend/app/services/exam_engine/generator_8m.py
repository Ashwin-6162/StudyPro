import logging
import time
from sqlalchemy.orm import Session
from app.schemas.exam import ExamAnswerRequestSchema, ExamAnswerResponseSchema
from app.schemas.context import ContextRequestSchema
from app.services.context_builder.builder import build_context_package
from app.services.exam_engine.prompt_builder_8m import build_8m_system_prompt, build_8m_user_prompt
from app.services.chat_engine.llm_client import generate_text
from app.services.exam_engine.validator_8m import validate_8m_answer, count_words

logging.basicConfig(filename="logs/8m_generator.log", level=logging.INFO, 
                    format="%(asctime)s - %(levelname)s - %(message)s")

MAX_RETRIES = 2

def generate_8m_answer(request: ExamAnswerRequestSchema, db: Session) -> ExamAnswerResponseSchema:

    # 1. Build Context
    context_req = ContextRequestSchema(
        query=request.query,
        document_id=request.document_id,
        top_k=10
    )
    context_package = build_context_package(context_req, "8M", db)

    # 2. Proceed even if context is empty to allow external knowledge fallback

    # 3. Build Prompts
    system_prompt = build_8m_system_prompt(request.format_mode)
    user_prompt = build_8m_user_prompt(request.query, context_package)

    start_time = time.time()
    used_provider = request.provider

    # 4. Generate & Validate with Retries
    raw_answer = ""
    last_invalid_answer = ""
    is_valid = False

    for attempt in range(MAX_RETRIES):
        try:
            logging.info(f"LLM 8M Generation Attempt {attempt + 1}")
            result = generate_text(system_prompt, user_prompt, provider=request.provider)
            candidate = result.text
            used_provider = result.provider

            if validate_8m_answer(candidate):
                raw_answer = candidate
                is_valid = True
                break
            else:
                last_invalid_answer = candidate
                logging.warning(f"Attempt {attempt + 1} failed validation. Retrying...")

        except Exception as e:
            logging.error(f"Failed to generate LLM text on attempt {attempt + 1}: {e}")
            break

    if not is_valid:
        # All retries exhausted or LLM errored — use a clear failure message.
        # Do NOT silently return the last invalid (too-short / malformed) answer.
        raw_answer = (
            "Failed to generate a valid 8 Mark answer after multiple attempts. "
            "Please try rephrasing your question or selecting a different topic."
        )
        logging.warning(
            f"8M generation gave up after {MAX_RETRIES} attempts. "
            f"Last invalid answer word count: {count_words(last_invalid_answer)}"
        )

    diagram_used = bool(context_package.diagrams and "![Diagram" in raw_answer)

    # No longer checking for INSUFFICIENT_INFO_STR, LLM handles fallback with disclaimer

    return ExamAnswerResponseSchema(
        query=request.query,
        answer_type="8M",
        topic=context_package.topic,
        answer=raw_answer.strip(),
        word_count=count_words(raw_answer),
        diagram_used=diagram_used,
        citations=context_package.citations,
        ready_for_display=True,
        provider=used_provider,
        processing_time=round(time.time() - start_time, 2)
    )
