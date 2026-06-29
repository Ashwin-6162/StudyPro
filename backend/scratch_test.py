import os
from dotenv import load_dotenv
load_dotenv('.env')
from google import genai

client = genai.Client(api_key=os.getenv('GEMINI_API_KEY'))
models = ['gemini-2.5-flash-lite', 'gemini-2.0-flash-lite', 'gemini-flash-lite-latest', 'gemini-pro-latest', 'gemini-2.5-pro']
valid = []

for m in models:
    try:
        client.models.generate_content(model=m, contents='hi')
        valid.append(m)
        print(f"Success: {m}")
    except Exception as e:
        print(f"Failed {m}: {e}")

print('VALID MODELS WITH QUOTA:', valid)
