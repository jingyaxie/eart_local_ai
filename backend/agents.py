from abc import ABC, abstractmethod
import openai
import os
from dotenv import load_dotenv
from typing import Optional, List, Dict
import json

load_dotenv()

# Initialize OpenAI client
openai.api_key = os.getenv("OPENAI_API_KEY")

class BaseAgent(ABC):
    def __init__(self):
        self.model = "gpt-4"  # Default to GPT-4
        self.system_prompt = ""
        self.conversation_history: List[Dict] = []

    @abstractmethod
    async def get_response(self, message: str) -> str:
        pass

    def _add_to_history(self, role: str, content: str):
        self.conversation_history.append({"role": role, "content": content})
        # Keep only last 10 messages to manage context window
        if len(self.conversation_history) > 10:
            self.conversation_history = self.conversation_history[-10:]

class CourseQAAgent(BaseAgent):
    def __init__(self):
        super().__init__()
        self.system_prompt = """You are an AI teaching assistant for an art and design course. 
        Your role is to help students understand course content, provide creative suggestions, 
        and offer emotional support during their learning journey. Be encouraging and constructive 
        in your feedback."""

    async def get_response(self, message: str) -> str:
        self._add_to_history("user", message)
        
        try:
            response = await openai.ChatCompletion.acreate(
                model=self.model,
                messages=[
                    {"role": "system", "content": self.system_prompt},
                    *self.conversation_history
                ],
                temperature=0.7,
                max_tokens=500
            )
            
            response_text = response.choices[0].message.content
            self._add_to_history("assistant", response_text)
            return response_text
            
        except Exception as e:
            return f"I apologize, but I encountered an error: {str(e)}"

class PortfolioAgent(BaseAgent):
    def __init__(self):
        super().__init__()
        self.system_prompt = """You are an AI portfolio advisor for art and design students. 
        Your role is to help students develop their portfolios by providing constructive feedback, 
        suggesting improvements, and guiding them through the creative process. Focus on both 
        technical aspects and conceptual development."""

    async def get_response(self, message: str) -> str:
        self._add_to_history("user", message)
        
        try:
            response = await openai.ChatCompletion.acreate(
                model=self.model,
                messages=[
                    {"role": "system", "content": self.system_prompt},
                    *self.conversation_history
                ],
                temperature=0.7,
                max_tokens=500
            )
            
            response_text = response.choices[0].message.content
            self._add_to_history("assistant", response_text)
            return response_text
            
        except Exception as e:
            return f"I apologize, but I encountered an error: {str(e)}"

class VisaAgent(BaseAgent):
    def __init__(self):
        super().__init__()
        self.system_prompt = """You are an AI visa application assistant. Your role is to help 
        students prepare for their visa applications by providing guidance on required documents, 
        preparing for interviews, and ensuring all requirements are met. Be thorough and precise 
        in your advice."""

    async def get_response(self, message: str) -> str:
        self._add_to_history("user", message)
        
        try:
            response = await openai.ChatCompletion.acreate(
                model=self.model,
                messages=[
                    {"role": "system", "content": self.system_prompt},
                    *self.conversation_history
                ],
                temperature=0.7,
                max_tokens=500
            )
            
            response_text = response.choices[0].message.content
            self._add_to_history("assistant", response_text)
            return response_text
            
        except Exception as e:
            return f"I apologize, but I encountered an error: {str(e)}"

class CourseSummaryAgent(BaseAgent):
    def __init__(self):
        super().__init__()
        self.system_prompt = """You are an AI course summary assistant. Your role is to analyze 
        course recordings and generate concise summaries, extract key points, and identify 
        homework requirements. Be thorough and organized in your summaries."""

    async def get_response(self, message: str) -> str:
        self._add_to_history("user", message)
        
        try:
            response = await openai.ChatCompletion.acreate(
                model=self.model,
                messages=[
                    {"role": "system", "content": self.system_prompt},
                    *self.conversation_history
                ],
                temperature=0.7,
                max_tokens=1000
            )
            
            response_text = response.choices[0].message.content
            self._add_to_history("assistant", response_text)
            return response_text
            
        except Exception as e:
            return f"I apologize, but I encountered an error: {str(e)}" 