from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from docling.document_converter import DocumentConverter
# from docling.datamodel.accelerator_options import AcceleratorOptions
import tempfile
import os
import shutil
import requests
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables from .env.local (or .env)
# Try loading from project root (parent directory) and current directory
project_root = Path(__file__).parent.parent
load_dotenv(project_root / '.env.local')
load_dotenv(project_root / '.env')
load_dotenv('.env.local')  # Also try current directory
load_dotenv('.env')  # Also try current directory

app = FastAPI()

# Configure CORS
# In production, replace with specific origins
origins = [
    "http://localhost:3000",
    "http://localhost:5173", # Vite default
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize converter (this might take a moment to load models on startup)
converter = DocumentConverter()

# Request model for analyze endpoint
class AnalyzeRequest(BaseModel):
    content: str
    prompt: str
    model: str

@app.post("/convert")
async def convert_document(file: UploadFile = File(...)):
    try:
        # Create a temporary file to save the uploaded content
        # Docling needs a file path
        suffix = os.path.splitext(file.filename)[1]
        if not suffix:
            suffix = ""
            
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            shutil.copyfileobj(file.file, tmp)
            tmp_path = tmp.name

        try:
            # Convert the document
            result = converter.convert(tmp_path)
            # Export to markdown
            markdown_content = result.document.export_to_markdown()
            return {"markdown": markdown_content}
        finally:
            # Clean up the temporary file
            if os.path.exists(tmp_path):
                os.remove(tmp_path)
                
    except Exception as e:
        print(f"Error converting file: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze")
async def analyze_content(request: AnalyzeRequest):
    try:
        gemini_api_key = os.getenv("VITE_GEMINI_API_KEY")
        if not gemini_api_key:
            # Debug: print available env vars (without values for security)
            env_vars = [k for k in os.environ.keys() if 'GEMINI' in k or 'API' in k]
            print(f"Available env vars with 'GEMINI' or 'API': {env_vars}")
            print(f"Current working directory: {os.getcwd()}")
            print(f"Project root: {project_root}")
            raise HTTPException(status_code=500, detail="VITE_GEMINI_API_KEY not configured")
        
        # Create the prompt combining content and instruction
        full_prompt = f"{request.prompt}\n\nContent:\n{request.content}"
        
        # Call Gemini API directly via HTTP
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{request.model}:generateContent"
        headers = {
            "Content-Type": "application/json",
        }
        params = {
            "key": gemini_api_key
        }
        payload = {
            "contents": [{
                "parts": [{
                    "text": full_prompt
                }]
            }]
        }
        
        response = requests.post(url, headers=headers, params=params, json=payload)
        response.raise_for_status()
        
        result = response.json()
        result_text = ""
        if "candidates" in result and len(result["candidates"]) > 0:
            candidate = result["candidates"][0]
            if "content" in candidate and "parts" in candidate["content"]:
                parts = candidate["content"]["parts"]
                if len(parts) > 0 and "text" in parts[0]:
                    result_text = parts[0]["text"]
        
        return {"result": result_text}
        
    except Exception as e:
        print(f"Error analyzing content: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
