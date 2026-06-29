import logging
import json
import math
from sqlalchemy.orm import Session
from app.schemas.mcq import MCQRequestSchema, MCQResponseSchema, MCQItemSchema
from app.schemas.context import ContextRequestSchema
from app.services.context_builder.builder import build_context_package
from app.services.mcq_engine.prompt_builder import build_mcq_system_prompt, build_mcq_user_prompt, INSUFFICIENT_INFO_STR
from app.services.mcq_engine.validator import validate_mcq_batch


logging.basicConfig(filename="logs/mcq_generator.log", level=logging.INFO, 
                    format="%(asctime)s - %(levelname)s - %(message)s")

MAX_BATCH_SIZE = 10  # Never ask the LLM for more than 10 MCQs at once to prevent hallucination

def generate_mcq_set(request: MCQRequestSchema, db: Session) -> MCQResponseSchema:

    # 1. Context Fetch
    # For large MCQ counts, fetch a very large context
    top_k = min(30, 5 + (request.count * 2))
    context_req = ContextRequestSchema(query=request.topic or "Generate MCQs", document_id=request.document_id, top_k=top_k)
    context_package = build_context_package(context_req, "GENERIC", db)

    if not context_package.content_sections:
        raise ValueError(INSUFFICIENT_INFO_STR)

    from app.services.chat_engine.llm_client import generate_text
    import time

    # 2. Batch Calculation
    batches_needed = math.ceil(request.count / MAX_BATCH_SIZE)
    accumulated_questions = []
    difficulty_counts = {"EASY": 0, "MEDIUM": 0, "HARD": 0}

    start_time = time.time()
    used_provider = request.provider

    # 3. Generation Loop
    for i in range(batches_needed):
        # Calculate how many questions to ask for in this specific batch
        remaining = request.count - len(accumulated_questions)
        batch_size = min(remaining, MAX_BATCH_SIZE)

        system_prompt = build_mcq_system_prompt(batch_size, request.exam_prep_mode)
        # Build user prompt fresh each batch (this is the only call — pre-loop one removed)
        user_prompt = build_mcq_user_prompt(request.topic, context_package)

        try:
            logging.info(f"Generating MCQ Batch {i+1}/{batches_needed} (Size: {batch_size})")

            result = generate_text(system_prompt, user_prompt, provider=request.provider, json_mode=True)
            used_provider = result.provider

            # Parse JSON
            raw_json = result.text.strip()
            # Handle markdown code blocks if the LLM leaked them despite json mode
            if raw_json.startswith("```json"):
                raw_json = raw_json[7:-3]
            elif raw_json.startswith("```"):
                raw_json = raw_json[3:-3]

            schema = json.loads(raw_json)

            is_valid, valid_questions = validate_mcq_batch(schema)

            if is_valid:
                # Attach per-question citations by cycling through available citations
                num_citations = len(context_package.citations)
                for q_idx, q in enumerate(valid_questions):
                    diff = str(q.get("difficulty", "MEDIUM")).upper()
                    if diff not in difficulty_counts:
                        diff = "MEDIUM"
                    difficulty_counts[diff] += 1

                    # Rotate through available citations so each question gets
                    # a distinct source rather than all pointing to citations[0]
                    if num_citations > 0:
                        source = context_package.citations[q_idx % num_citations]
                    else:
                        source = None

                    item = MCQItemSchema(
                        question=q["question"],
                        options=q["options"],
                        correct_answer=q["correct_answer"],
                        explanation=q["explanation"],
                        difficulty=diff,
                        diagram_based=q.get("diagram_based", False),
                        source=source
                    )
                    accumulated_questions.append(item)
            else:
                logging.warning(f"Batch {i+1} failed validation.")

        except Exception as e:
            logging.error(f"LLM Batch generation failed: {e}")

    if not accumulated_questions:
        raise ValueError("Failed to generate valid MCQs. Try narrowing the topic.")

    return MCQResponseSchema(
        topic=request.topic or context_package.topic,
        question_count=len(accumulated_questions),
        difficulty_distribution=difficulty_counts,
        questions=accumulated_questions,
        citations_attached=bool(context_package.citations),
        exam_prep_mode=request.exam_prep_mode,
        ready_for_display=True,
        provider=used_provider,
        processing_time=round(time.time() - start_time, 2)
    )
