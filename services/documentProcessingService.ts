/**
 * Document Processing Service
 * 
 * This service handles the conversion of various document formats into a standardized
 * format for use in the document analysis system. It supports multiple file types with
 * intelligent fallback mechanisms.
 * 
 * ## Overview
 * 
 * The document processing pipeline:
 * 
 * 1. Accepts a list of files (PDF, DOCX, TXT, MD, JSON, etc.)
 * 2. Determines the file type and processing strategy
 * 3. Converts files to markdown/text format
 * 4. Encodes content to Base64 for storage
 * 5. Returns processed DocumentFile objects with error handling
 * 
 * ## Processing Strategy
 * 
 * ### Text Files (TXT, MD, JSON)
 * - Processed directly in the browser using FileReader API
 * - No backend required
 * - Fast and reliable for plain text formats
 * 
 * ### PDF and DOCX Files
 * - Sent to backend server running Docling converter
 * - Backend URL: http://localhost:8000/convert (configurable via VITE_API_URL)
 * - Preserves formatting and structure
 * - Falls back to text extraction if backend unavailable
 * 
 * ### Other Formats
 * - Attempts backend conversion first
 * - Falls back to text extraction if backend fails
 * - Provides clear error messages if both methods fail
 * 
 * ## Error Handling
 * 
 * The service implements graceful error handling:
 * - Individual file failures don't stop batch processing
 * - Detailed error messages for each failed file
 * - Continues processing remaining files even if some fail
 * - Returns both successful and failed file information
 * 
 * ## Usage Example
 * 
 * ```typescript
 * import { processDocumentFiles } from './services/documentProcessingService';
 * 
 * const files = Array.from(event.target.files);
 * const result = await processDocumentFiles(files);
 * 
 * if (result.success.length > 0) {
 *   setDocuments(prev => [...prev, ...result.success]);
 * }
 * 
 * if (result.errors.length > 0) {
 *   console.error('Processing errors:', result.errors);
 * }
 * ```
 */

import { DocumentFile } from '../types';
import { processDocumentToMarkdown } from './documentProcessor';

/**
 * Result of processing a batch of files
 */
export interface DocumentProcessingResult {
  /** Successfully processed files */
  success: DocumentFile[];
  /** Files that failed to process with error messages */
  errors: Array<{ fileName: string; error: string }>;
}

/**
 * Reads a text file directly in the browser using FileReader API
 * 
 * This is used for plain text files (TXT, MD, JSON) that don't require
 * backend processing. It's faster and doesn't require server resources.
 * 
 * @param file - The file to read
 * @returns Promise that resolves to the file content as a string
 * @throws Error if file reading fails
 */
export const readTextFile = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`));
    reader.readAsText(file);
  });
};

/**
 * Determines the appropriate processing strategy for a file based on its extension
 * 
 * @param fileName - The name of the file (used to extract extension)
 * @returns Object indicating file type classification
 */
const getFileTypeInfo = (fileName: string) => {
  const fileExtension = fileName.split('.').pop()?.toLowerCase();
  
  return {
    extension: fileExtension,
    isTextFile: fileExtension === 'txt' || fileExtension === 'md' || fileExtension === 'json',
    isPdfOrDocx: fileExtension === 'pdf' || fileExtension === 'docx',
  };
};

/**
 * Processes a single file and converts it to a DocumentFile object
 * 
 * Processing flow:
 * 
 * 1. Text files (TXT, MD, JSON) → Direct text reading
 * 2. PDF/DOCX → Backend conversion (with fallback to text)
 * 3. Other formats → Try backend first, fallback to text
 * 
 * @param file - The file to process
 * @returns Promise that resolves to a DocumentFile or rejects with an error
 */
const processSingleFile = async (file: File): Promise<DocumentFile> => {
  let markdownContent: string;
  let mimeType: string = 'text/markdown';

  const { isTextFile, isPdfOrDocx } = getFileTypeInfo(file.name);

  // Strategy 1: Text files - process directly in browser
  if (isTextFile) {
    const textContent = await readTextFile(file);
    markdownContent = textContent;
    mimeType = file.type || 'text/plain';
  }
  // Strategy 2: PDF/DOCX - use backend converter
  else if (isPdfOrDocx) {
    try {
      markdownContent = await processDocumentToMarkdown(file);
    } catch (backendError) {
      const errorMsg = backendError instanceof Error ? backendError.message : String(backendError);
      
      // Check if it's a backend availability issue
      if (errorMsg.includes('backend server running') || errorMsg.includes('Failed to fetch')) {
        throw new Error(
          `Backend server not available. Please ensure the server is running on ${import.meta.env.VITE_API_URL || 'http://localhost:8000'}`
        );
      } else {
        throw backendError;
      }
    }
  }
  // Strategy 3: Other formats - try backend, fallback to text
  else {
    try {
      markdownContent = await processDocumentToMarkdown(file);
    } catch (backendError) {
      // Fallback: try reading as text
      try {
        const textContent = await readTextFile(file);
        markdownContent = textContent;
        mimeType = file.type || 'text/plain';
      } catch (textError) {
        throw new Error(
          'Could not process file. Unsupported format or backend unavailable.'
        );
      }
    }
  }

  // Encode content to Base64 for storage
  // This matches the format expected by the rest of the application
  const contentBase64 = btoa(unescape(encodeURIComponent(markdownContent)));

  // Generate a unique ID for the document
  const documentId = Math.random().toString(36).substring(2, 9);

  return {
    id: documentId,
    name: file.name,
    type: file.type,
    size: file.size,
    content: contentBase64,
    mimeType: mimeType,
  };
};

/**
 * Processes multiple files in batch with comprehensive error handling
 * 
 * This is the main entry point for document processing. It:
 * - Processes files sequentially to avoid overwhelming the backend
 * - Continues processing even if individual files fail
 * - Collects all errors and returns them with successful files
 * - Provides detailed error messages for debugging
 * 
 * @param fileList - Array of File objects to process
 * @returns Promise that resolves to DocumentProcessingResult containing
 *          both successful files and error information
 * 
 * @example
 * ```typescript
 * const files = Array.from(event.target.files);
 * const result = await processDocumentFiles(files);
 * 
 * // Handle successful files
 * if (result.success.length > 0) {
 *   setDocuments(prev => [...prev, ...result.success]);
 * }
 * 
 * // Handle errors
 * if (result.errors.length > 0) {
 *   const errorMessage = result.errors.length === files.length
 *     ? `Failed to process all files:\n${result.errors.map(e => `${e.fileName}: ${e.error}`).join('\n')}`
 *     : `Some files failed:\n${result.errors.map(e => `${e.fileName}: ${e.error}`).join('\n')}\n\n${result.success.length} file(s) added successfully.`;
 *   alert(errorMessage);
 * }
 * ```
 */
export const processDocumentFiles = async (
  fileList: File[]
): Promise<DocumentProcessingResult> => {
  const processedFiles: DocumentFile[] = [];
  const errors: Array<{ fileName: string; error: string }> = [];

  // Process each file individually to handle errors gracefully
  for (const file of fileList) {
    try {
      const processedFile = await processSingleFile(file);
      processedFiles.push(processedFile);
    } catch (fileError) {
      console.error(`Failed to process ${file.name}:`, fileError);
      
      const errorMessage = fileError instanceof Error 
        ? fileError.message 
        : 'Unknown error occurred';
      
      errors.push({
        fileName: file.name,
        error: errorMessage,
      });
    }
  }

  return {
    success: processedFiles,
    errors,
  };
};

/**
 * Formats error messages for display to the user
 * 
 * Creates a user-friendly error message that distinguishes between
 * complete failure and partial success scenarios.
 * 
 * @param result - The processing result containing success and error arrays
 * @param totalFiles - Total number of files that were attempted
 * @returns Formatted error message string, or null if no errors
 */
export const formatProcessingErrors = (
  result: DocumentProcessingResult,
  totalFiles: number
): string | null => {
  if (result.errors.length === 0) {
    return null;
  }

  const errorDetails = result.errors
    .map(({ fileName, error }) => `${fileName}: ${error}`)
    .join('\n');

  if (result.errors.length === totalFiles) {
    // All files failed
    return `Failed to process all files:\n${errorDetails}`;
  } else {
    // Some files failed
    return `Some files failed to process:\n${errorDetails}\n\n${result.success.length} file(s) added successfully.`;
  }
};

