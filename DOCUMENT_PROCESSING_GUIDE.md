# Document Processing Services Guide

Quick reference for the document processing system used in this project.

## 📁 Files Overview

### Frontend Services

1. **`services/documentProcessingService.ts`** (Main Service)
   - **Purpose:** Main entry point for processing uploaded files
   - **Features:**
     - Handles multiple file types (PDF, DOCX, TXT, MD, JSON)
     - Text files processed in browser (no backend needed)
     - PDF/DOCX sent to backend for conversion
     - Comprehensive error handling
     - Batch processing with individual file error tracking
   - **Key Functions:**
     - `processDocumentFiles(files: File[])` - Main entry point
     - `formatProcessingErrors(result, totalFiles)` - Error formatting
   - **Returns:** `DocumentProcessingResult` with `success` and `errors` arrays

2. **`services/documentProcessor.ts`** (Backend Communication)
   - **Purpose:** Communicates with Python backend for PDF/DOCX conversion
   - **Features:**
     - Sends files to `/convert` endpoint
     - Returns markdown content
   - **Key Functions:**
     - `processDocumentToMarkdown(file: File)` - Converts file to markdown
   - **Dependencies:** Backend server must be running

3. **`services/geminiService.ts`** (AI Services)
   - **Purpose:** AI-powered extraction and analysis
   - **Features:**
     - Document data extraction with structured output
     - Prompt generation for column extraction
     - Chat-based data analysis
     - Retry logic with exponential backoff
   - **Key Functions:**
     - `extractColumnData(doc, column, modelId)` - Extract data from document
     - `generatePromptHelper(name, type, currentPrompt, modelId)` - Generate prompts
     - `analyzeDataWithChat(message, context, history, modelId)` - Chat analysis
   - **Dependencies:** `@google/genai`, requires `VITE_GEMINI_API_KEY`

### Backend Server

4. **`server/main.py`** (Python FastAPI Server)
   - **Purpose:** Document conversion backend
   - **Endpoints:**
     - `POST /convert` - Converts PDF/DOCX to markdown
     - `POST /analyze` - Alternative AI analysis endpoint
   - **Dependencies:** See `server/requirements.txt`
   - **Key Libraries:**
     - `docling` - Document conversion
     - `fastapi` - API framework
     - `uvicorn` - ASGI server

5. **`server/requirements.txt`**
   - Full list of Python dependencies
   - Main packages: `docling`, `fastapi`, `uvicorn`, `python-dotenv`

## 🔄 Processing Flow

### Text Files (TXT, MD, JSON)
```
File → FileReader API → Text Content → Base64 Encode → DocumentFile
```
- **No backend required**
- Processed directly in browser
- Fast and reliable

### PDF/DOCX Files
```
File → Backend Server (/convert) → Docling Converter → Markdown → Base64 Encode → DocumentFile
```
- **Backend required**
- Uses Docling for high-quality conversion
- Preserves formatting and structure

### Other Formats
```
File → Try Backend → Success: Markdown | Fail: Try Text Extraction → Base64 Encode → DocumentFile
```
- Attempts backend conversion first
- Falls back to text extraction if backend fails

## 🚀 Setup Instructions

### Frontend Setup

1. **Copy service files:**
   ```bash
   services/documentProcessingService.ts
   services/documentProcessor.ts
   services/geminiService.ts  # Optional - only if using AI features
   ```

2. **Install NPM packages:**
   ```bash
   npm install @google/genai  # Only if using AI features
   ```

3. **Set environment variables:**
   ```env
   VITE_API_URL=http://localhost:8000
   VITE_GEMINI_API_KEY=your_api_key_here  # Only if using AI features
   ```

### Backend Setup (Optional but Recommended for PDF/DOCX)

1. **Copy server files:**
   ```bash
   server/main.py
   server/requirements.txt
   ```

2. **Set up Python environment:**
   ```bash
   cd server
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Set environment variables:**
   Create `.env` or `.env.local` in project root:
   ```env
   VITE_GEMINI_API_KEY=your_api_key_here
   ```

4. **Start the server:**
   ```bash
   uvicorn main:app --reload
   ```
   Server runs on `http://localhost:8000` by default

## 💻 Usage Examples

### Basic File Processing

```typescript
import { processDocumentFiles } from './services/documentProcessingService';

// Process uploaded files
const files = Array.from(event.target.files);
const result = await processDocumentFiles(files);

// Handle successful files
if (result.success.length > 0) {
  setDocuments(prev => [...prev, ...result.success]);
}

// Handle errors
if (result.errors.length > 0) {
  const errorMessage = formatProcessingErrors(result, files.length);
  if (errorMessage) {
    alert(errorMessage);
  }
}
```

### Direct Backend Conversion

```typescript
import { processDocumentToMarkdown } from './services/documentProcessor';

// Convert a single file
const markdown = await processDocumentToMarkdown(file);
// Use markdown content...
```

### AI Extraction

```typescript
import { extractColumnData } from './services/geminiService';

// Extract data from document
const extraction = await extractColumnData(
  document,
  column,
  'gemini-2.5-flash'
);

// extraction contains:
// - value: string
// - confidence: 'High' | 'Medium' | 'Low'
// - quote: string (exact text from document)
// - page: number
// - reasoning: string
```

### AI Prompt Generation

```typescript
import { generatePromptHelper } from './services/geminiService';

// Generate a prompt for a column
const prompt = await generatePromptHelper(
  'Persons Mentioned',
  'text',
  undefined, // current prompt (optional)
  'gemini-2.5-flash'
);
```

## 🔧 Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|------------|
| `VITE_API_URL` | No | `http://localhost:8000` | Backend server URL |
| `VITE_GEMINI_API_KEY` | Yes (for AI) | - | Google Gemini API key |

### Backend CORS

The backend is configured to allow requests from:
- `http://localhost:3000` (Create React App)
- `http://localhost:5173` (Vite default)

To add more origins, edit `server/main.py`:
```python
origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://your-domain.com",  # Add your domain
]
```

## ⚠️ Error Handling

### Service-Level Errors

The `documentProcessingService` handles errors gracefully:
- Individual file failures don't stop batch processing
- Each error includes the file name and error message
- Returns both successful and failed files

### Backend Errors

If the backend is unavailable:
- PDF/DOCX files will fail with a clear error message
- Text files will still work (processed in browser)
- Error message includes the backend URL for troubleshooting

### AI Service Errors

The `geminiService` includes:
- Automatic retry with exponential backoff for rate limits
- Detailed error logging
- Graceful fallbacks where possible

## 📦 Dependencies

### Frontend
- **Required:**
  - None (text files work without any dependencies)
- **For PDF/DOCX:**
  - Backend server must be running
- **For AI features:**
  - `@google/genai` package
  - `VITE_GEMINI_API_KEY` environment variable

### Backend
- See `server/requirements.txt` for full list
- Main dependencies:
  - `docling` - Document conversion
  - `fastapi` - API framework
  - `uvicorn` - ASGI server
  - `python-dotenv` - Environment variables

## 🎯 When to Use Each Service

### Use `documentProcessingService.ts` when:
- Processing multiple files
- Need error handling for individual files
- Want to process different file types
- Need batch processing with error reporting

### Use `documentProcessor.ts` directly when:
- Processing a single file
- Already handling errors yourself
- Need direct backend communication

### Use `geminiService.ts` when:
- Extracting structured data from documents
- Generating prompts for column extraction
- Performing chat-based data analysis
- Need AI-powered features

## 🔍 Troubleshooting

### Backend Not Starting
- Check Python version (3.8+ recommended)
- Ensure all dependencies are installed: `pip install -r requirements.txt`
- Check for port conflicts (default: 8000)
- Verify environment variables are set

### PDF/DOCX Conversion Failing
- Ensure backend server is running
- Check `VITE_API_URL` matches backend URL
- Verify CORS settings allow your frontend origin
- Check backend logs for detailed error messages

### AI Features Not Working
- Verify `VITE_GEMINI_API_KEY` is set
- Check API key is valid and has quota
- Review console for rate limit errors
- Ensure `@google/genai` package is installed

### Text Files Not Processing
- Check browser console for errors
- Verify FileReader API is supported (all modern browsers)
- Check file encoding (UTF-8 recommended)

## 📚 Related Files

- `types.ts` - `DocumentFile` type definition
- `App.tsx` - Example usage of document processing
- `pages/demo.tsx` - Alternative file handling (drag-and-drop)

