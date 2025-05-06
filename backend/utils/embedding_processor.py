import os
from typing import List, Dict, Any, Optional
import numpy as np
from PIL import Image
import base64
from io import BytesIO
import openai
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.embeddings import OpenAIEmbeddings
from langchain.vectorstores import Chroma
import chromadb
from chromadb.config import Settings
import json
from datetime import datetime

class EmbeddingProcessor:
    def __init__(self, openai_api_key: str):
        self.openai_api_key = openai_api_key
        openai.api_key = openai_api_key
        self.embeddings = OpenAIEmbeddings(openai_api_key=openai_api_key)
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len,
        )
        
        # Initialize ChromaDB
        self.chroma_client = chromadb.Client(Settings(
            persist_directory="data/chroma",
            anonymized_telemetry=False
        ))
        
    def _encode_image_to_base64(self, image_path: str) -> str:
        """Convert image to base64 string."""
        with Image.open(image_path) as img:
            buffered = BytesIO()
            img.save(buffered, format="PNG")
            return base64.b64encode(buffered.getvalue()).decode()

    def _get_image_embedding(self, image_path: str) -> List[float]:
        """Get embedding for image using OpenAI's vision model."""
        try:
            base64_image = self._encode_image_to_base64(image_path)
            
            response = openai.ChatCompletion.create(
                model="gpt-4-vision-preview",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": "Describe this image in detail."},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/png;base64,{base64_image}"
                                }
                            }
                        ]
                    }
                ],
                max_tokens=300
            )
            
            # Get text description
            description = response.choices[0].message.content
            
            # Get embedding for the description
            embedding = self.embeddings.embed_query(description)
            return embedding
            
        except Exception as e:
            print(f"Error getting image embedding: {str(e)}")
            return None

    def _get_text_embedding(self, text: str) -> List[float]:
        """Get embedding for text."""
        try:
            return self.embeddings.embed_query(text)
        except Exception as e:
            print(f"Error getting text embedding: {str(e)}")
            return None

    def _get_audio_embedding(self, audio_path: str) -> List[float]:
        """Get embedding for audio using OpenAI's Whisper model."""
        try:
            with open(audio_path, "rb") as audio_file:
                transcript = openai.Audio.transcribe("whisper-1", audio_file)
            
            # Get embedding for the transcript
            embedding = self.embeddings.embed_query(transcript.text)
            return embedding
            
        except Exception as e:
            print(f"Error getting audio embedding: {str(e)}")
            return None

    def process_file(self, file_path: str, file_type: str, metadata: Dict[str, Any]) -> Dict[str, Any]:
        """Process file and generate embeddings."""
        try:
            # Get embedding based on file type
            if file_type == "image":
                embedding = self._get_image_embedding(file_path)
            elif file_type == "audio":
                embedding = self._get_audio_embedding(file_path)
            else:  # document
                with open(file_path, 'r', encoding='utf-8') as f:
                    text = f.read()
                chunks = self.text_splitter.split_text(text)
                embeddings = [self._get_text_embedding(chunk) for chunk in chunks]
                embedding = np.mean(embeddings, axis=0).tolist()

            if embedding is None:
                raise Exception("Failed to generate embedding")

            # Store in ChromaDB
            collection = self.chroma_client.get_or_create_collection(
                name=f"files_{file_type}",
                metadata={"hnsw:space": "cosine"}
            )

            # Prepare document
            doc_id = f"{os.path.basename(file_path)}_{datetime.utcnow().isoformat()}"
            doc_metadata = {
                **metadata,
                "file_path": file_path,
                "file_type": file_type,
                "processed_at": datetime.utcnow().isoformat()
            }

            # Add to collection
            collection.add(
                ids=[doc_id],
                embeddings=[embedding],
                metadatas=[doc_metadata]
            )

            return {
                "doc_id": doc_id,
                "embedding": embedding,
                "metadata": doc_metadata
            }

        except Exception as e:
            print(f"Error processing file: {str(e)}")
            return None

    def search_similar(self, query: str, file_type: Optional[str] = None, limit: int = 5) -> List[Dict[str, Any]]:
        """Search for similar files using query."""
        try:
            # Get query embedding
            query_embedding = self._get_text_embedding(query)
            
            if file_type:
                collection = self.chroma_client.get_collection(f"files_{file_type}")
            else:
                # Search across all collections
                collections = self.chroma_client.list_collections()
                results = []
                
                for collection in collections:
                    if collection.name.startswith("files_"):
                        results.extend(
                            collection.query(
                                query_embeddings=[query_embedding],
                                n_results=limit
                            )
                        )
                
                return results

            # Search in specific collection
            results = collection.query(
                query_embeddings=[query_embedding],
                n_results=limit
            )
            
            return results

        except Exception as e:
            print(f"Error searching similar files: {str(e)}")
            return []

    def delete_file_embedding(self, doc_id: str, file_type: str) -> bool:
        """Delete file embedding from ChromaDB."""
        try:
            collection = self.chroma_client.get_collection(f"files_{file_type}")
            collection.delete(ids=[doc_id])
            return True
        except Exception as e:
            print(f"Error deleting file embedding: {str(e)}")
            return False 