import os
import PyPDF2
import docx
from PIL import Image
import pytesseract
import speech_recognition as sr
from typing import Optional, Dict, Any
import json
from datetime import datetime

class FileContentExtractor:
    @staticmethod
    def extract_text_from_pdf(file_path: str) -> str:
        """Extract text from PDF file."""
        try:
            with open(file_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                text = ""
                for page in pdf_reader.pages:
                    text += page.extract_text() + "\n"
                return text.strip()
        except Exception as e:
            return f"Error extracting text from PDF: {str(e)}"

    @staticmethod
    def extract_text_from_docx(file_path: str) -> str:
        """Extract text from DOCX file."""
        try:
            doc = docx.Document(file_path)
            text = ""
            for paragraph in doc.paragraphs:
                text += paragraph.text + "\n"
            return text.strip()
        except Exception as e:
            return f"Error extracting text from DOCX: {str(e)}"

    @staticmethod
    def extract_text_from_image(file_path: str) -> str:
        """Extract text from image using OCR."""
        try:
            image = Image.open(file_path)
            text = pytesseract.image_to_string(image)
            return text.strip()
        except Exception as e:
            return f"Error extracting text from image: {str(e)}"

    @staticmethod
    def extract_text_from_audio(file_path: str) -> str:
        """Extract text from audio file using speech recognition."""
        try:
            recognizer = sr.Recognizer()
            with sr.AudioFile(file_path) as source:
                audio = recognizer.record(source)
                text = recognizer.recognize_google(audio)
                return text.strip()
        except Exception as e:
            return f"Error extracting text from audio: {str(e)}"

    @staticmethod
    def extract_metadata(file_path: str) -> Dict[str, Any]:
        """Extract metadata from file."""
        try:
            stats = os.stat(file_path)
            return {
                "size": stats.st_size,
                "created": datetime.fromtimestamp(stats.st_ctime).isoformat(),
                "modified": datetime.fromtimestamp(stats.st_mtime).isoformat(),
                "extension": os.path.splitext(file_path)[1].lower(),
            }
        except Exception as e:
            return {"error": str(e)}

    @staticmethod
    def extract_content(file_path: str, file_type: str) -> Dict[str, Any]:
        """Extract content and metadata from file based on type."""
        content = ""
        if file_type == "document":
            if file_path.lower().endswith('.pdf'):
                content = FileContentExtractor.extract_text_from_pdf(file_path)
            elif file_path.lower().endswith(('.docx', '.doc')):
                content = FileContentExtractor.extract_text_from_docx(file_path)
        elif file_type == "image":
            content = FileContentExtractor.extract_text_from_image(file_path)
        elif file_type == "audio":
            content = FileContentExtractor.extract_text_from_audio(file_path)

        metadata = FileContentExtractor.extract_metadata(file_path)
        
        return {
            "content": content,
            "metadata": metadata,
            "extraction_time": datetime.utcnow().isoformat()
        } 