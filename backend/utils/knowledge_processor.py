from typing import List, Dict, Any, Optional
import json
from datetime import datetime
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.embeddings import OpenAIEmbeddings
from langchain.vectorstores import Chroma
from langchain.schema import Document
from langchain.chains import ConversationalRetrievalChain
from langchain.memory import ConversationBufferMemory
from langchain.chat_models import ChatOpenAI
import chromadb
from chromadb.config import Settings
import os

class KnowledgeProcessor:
    def __init__(self, openai_api_key: str, collection_name: str = "default"):
        """Initialize the knowledge processor with a specific collection name."""
        self.openai_api_key = openai_api_key
        self.collection_name = collection_name
        self.embeddings = OpenAIEmbeddings(openai_api_key=openai_api_key)
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len,
        )
        self.db = Chroma(
            collection_name=collection_name,
            embedding_function=self.embeddings,
            persist_directory=f"./data/chroma/{collection_name}"
        )
        
        # Initialize conversation memory
        self.conversation_memory = {}
        
    @classmethod
    def create_knowledge_base(cls, openai_api_key: str, collection_name: str) -> 'KnowledgeProcessor':
        """Create a new knowledge base instance."""
        return cls(openai_api_key, collection_name)

    @classmethod
    def get_knowledge_base(cls, openai_api_key: str, collection_name: str) -> 'KnowledgeProcessor':
        """Get an existing knowledge base instance."""
        return cls(openai_api_key, collection_name)

    def process_document(self, content: str, metadata: Dict[str, Any]) -> str:
        """Process a document and store its chunks in the knowledge base."""
        try:
            # Split the content into chunks
            chunks = self.text_splitter.split_text(content)
            
            # Create documents with metadata
            documents = [
                Document(
                    page_content=chunk,
                    metadata={
                        **metadata,
                        "chunk_index": i,
                        "total_chunks": len(chunks)
                    }
                )
                for i, chunk in enumerate(chunks)
            ]
            
            # Add documents to the vector store
            self.db.add_documents(documents)
            
            return f"Processed {len(chunks)} chunks from document"
            
        except Exception as e:
            raise Exception(f"Error processing document: {str(e)}")

    def search_knowledge(self, query: str, category: Optional[str] = None, limit: int = 5) -> List[Dict[str, Any]]:
        """Search the knowledge base."""
        try:
            # Prepare search parameters
            search_kwargs = {"k": limit}
            if category:
                search_kwargs["filter"] = {"category": category}
            
            # Perform the search
            results = self.db.similarity_search_with_score(query, **search_kwargs)
            
            # Format results
            formatted_results = []
            for doc, score in results:
                formatted_results.append({
                    "content": doc.page_content,
                    "metadata": doc.metadata,
                    "score": score
                })
            
            return formatted_results
            
        except Exception as e:
            raise Exception(f"Error searching knowledge base: {str(e)}")

    def chat_with_knowledge(self, query: str, conversation_id: str) -> Dict[str, Any]:
        """Chat with the knowledge base using conversation history."""
        try:
            # Create a conversation chain
            memory = ConversationBufferMemory(
                memory_key="chat_history",
                return_messages=True
            )
            
            # Create the chain
            chain = ConversationalRetrievalChain.from_llm(
                llm=ChatOpenAI(
                    temperature=0.7,
                    openai_api_key=self.openai_api_key
                ),
                retriever=self.db.as_retriever(),
                memory=memory,
                return_source_documents=True
            )
            
            # Get response
            response = chain({"question": query})
            
            # Format response
            return {
                "answer": response["answer"],
                "sources": [
                    {
                        "content": doc.page_content,
                        "metadata": doc.metadata
                    }
                    for doc in response["source_documents"]
                ]
            }
            
        except Exception as e:
            raise Exception(f"Error in chat: {str(e)}")

    def delete_knowledge(self, document_ids: List[str], category: Optional[str] = None) -> bool:
        """Delete documents from the knowledge base."""
        try:
            # Prepare delete parameters
            delete_kwargs = {"ids": document_ids}
            if category:
                delete_kwargs["where"] = {"category": category}
            
            # Delete documents
            self.db.delete(**delete_kwargs)
            return True
            
        except Exception as e:
            raise Exception(f"Error deleting documents: {str(e)}")

    def list_collections(self) -> List[str]:
        """List all available knowledge base collections."""
        try:
            client = chromadb.Client()
            return [collection.name for collection in client.list_collections()]
        except Exception as e:
            raise Exception(f"Error listing collections: {str(e)}")

    def get_collection_stats(self) -> Dict[str, Any]:
        """Get statistics about the current knowledge base collection."""
        try:
            collection = self.db._collection
            return {
                "name": collection.name,
                "count": collection.count(),
                "metadata": collection.metadata
            }
        except Exception as e:
            raise Exception(f"Error getting collection stats: {str(e)}") 