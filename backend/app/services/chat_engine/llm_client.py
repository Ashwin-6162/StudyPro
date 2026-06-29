import os
import logging
import time

from app.services import gemini_service, grok_service

# To keep track of the used provider when fallback occurs
class LLMGenerationResult:
    def __init__(self, text: str, provider: str):
        self.text = text
        self.provider = provider

def generate_text(system_prompt: str, user_prompt: str, provider: str = None, json_mode: bool = False) -> LLMGenerationResult:
    """
    Routes the text generation request to the selected provider (Gemini or Grok).
    Implements automatic fallback if the primary provider fails.
    Returns an LLMGenerationResult containing the generated text and the actual provider used.
    """
    if not provider:
        provider = os.getenv("DEFAULT_PROVIDER", "gemini").lower()

    primary_provider = provider
    secondary_provider = "grok" if provider == "gemini" else "gemini"
    
    # Attempt primary provider
    try:
        logging.info(f"Attempting to generate text using {primary_provider} (JSON Mode: {json_mode})...")
        if primary_provider == "grok":
            text = grok_service.generate(system_prompt, user_prompt, json_mode=json_mode)
        else:
            text = gemini_service.generate(system_prompt, user_prompt, json_mode=json_mode)
        return LLMGenerationResult(text=text, provider=primary_provider)
    except Exception as e:
        logging.warning(f"Primary provider ({primary_provider}) failed: {e}. Falling back to {secondary_provider}...")
        
        # Automatic Fallback
        try:
            if secondary_provider == "grok":
                text = grok_service.generate(system_prompt, user_prompt, json_mode=json_mode)
            else:
                text = gemini_service.generate(system_prompt, user_prompt, json_mode=json_mode)
            logging.info(f"Fallback to {secondary_provider} succeeded.")
            return LLMGenerationResult(text=text, provider=secondary_provider)
        except Exception as fallback_error:
            logging.error(f"Fallback provider ({secondary_provider}) also failed: {fallback_error}.")
            raise Exception(f"Both primary ({primary_provider}) and fallback ({secondary_provider}) LLM providers failed.")
