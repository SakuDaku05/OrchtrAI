import os
import io
import pdfplumber
from sentence_transformers import SentenceTransformer

model = None

def get_model():
    global model
    if model is None:
        model = SentenceTransformer('all-MiniLM-L6-v2')
    return model

def extract_text_from_file(file_content: bytes, filename: str) -> str:
    """Extracts text from PDF or raw text files."""
    text = ""
    extension = filename.lower().split('.')[-1]
    
    if extension == 'pdf':
        try:
            with pdfplumber.open(io.BytesIO(file_content)) as pdf:
                for page in pdf.pages:
                    extracted = page.extract_text()
                    if extracted:
                        text += extracted + "\n"
        except Exception as e:
            print(f"Error extracting PDF: {e}")
            raise ValueError(f"Failed to read PDF: {str(e)}")
    else:
        # Default fallback to plain text UTF-8
        text = file_content.decode('utf-8', errors='ignore')
        
    return text

def chunk_text(text: str, chunk_size: int = 1000, overlap: int = 100) -> list:
    """Splits a large text into smaller overlapping chunks for embedding."""
    chunks = []
    start = 0
    text_length = len(text)
    
    if text_length == 0:
        return chunks
        
    while start < text_length:
        end = start + chunk_size
        chunks.append(text[start:end].strip())
        start += chunk_size - overlap
        
    # Remove empty chunks
    return [c for c in chunks if c]

def embed_texts(texts: list) -> list:
    """Generates a dense vector embedding for a list of string chunks."""
    if not texts:
        return []
    # Generate embeddings as numpy arrays
    m = get_model()
    embeddings = m.encode(texts)
    # Convert exactly to list of floats for JSON serialization into Cosmos
    return [embedding.tolist() for embedding in embeddings]
