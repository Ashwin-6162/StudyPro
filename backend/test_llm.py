import os
from dotenv import load_dotenv
from app.services.chat_engine.llm_client import generate_text

load_dotenv()

try:
    print(f"API KEY IN ENV: {os.getenv('GEMINI_API_KEY')[:10]}...")
    resp = generate_text("Say hello.", "Hello!", model_name="gemini-2.5-flash-lite")
    print(f"SUCCESS: {resp}")
except Exception as e:
    print(f"ERROR: {e}")
