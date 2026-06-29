import tiktoken
import nltk
from typing import List, Dict

# Ensure tokenizer is ready
encoder = tiktoken.get_encoding("cl100k_base")

def get_token_count(text: str) -> int:
    return len(encoder.encode(text))

def segment_text(content: str, max_tokens: int = 700, min_tokens: int = 250, overlap_tokens: int = 100) -> List[Dict]:
    """
    Splits text into chunks of optimal token lengths, preserving sentence boundaries.
    Overlaps chunks by overlap_tokens to preserve context across chunks.
    """
    try:
        sentences = nltk.sent_tokenize(content)
    except LookupError:
        # Fallback if NLTK data is missing
        sentences = [s.strip() + "." for s in content.replace("?", ".").replace("!", ".").split(".") if s.strip()]

    chunks = []
    current_chunk = []
    current_length = 0
    
    for sentence in sentences:
        sentence_tokens = get_token_count(sentence)
        
        if current_length + sentence_tokens > max_tokens:
            if current_length >= min_tokens:
                # Flush the current chunk
                chunk_text = " ".join(current_chunk)
                chunks.append({
                    "content": chunk_text,
                    "token_count": current_length
                })
                
                # Create overlap for the next chunk
                # Find the sentences to carry over
                overlap_length = 0
                overlap_sentences = []
                for s in reversed(current_chunk):
                    s_tokens = get_token_count(s)
                    if overlap_length + s_tokens <= overlap_tokens:
                        overlap_sentences.insert(0, s)
                        overlap_length += s_tokens
                    else:
                        break
                        
                current_chunk = overlap_sentences
                current_length = overlap_length
                
        current_chunk.append(sentence)
        current_length += sentence_tokens
        
    # Flush remaining
    if current_chunk and current_length > 50: # Avoid tiny tail chunks
        chunk_text = " ".join(current_chunk)
        chunks.append({
            "content": chunk_text,
            "token_count": current_length
        })
        
    return chunks
