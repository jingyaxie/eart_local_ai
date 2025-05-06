from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional, Union
import openai
from openai import OpenAI
import dashscope
from dashscope import Generation
from tenacity import retry, stop_after_attempt, wait_exponential
import logging
import requests
from datetime import datetime
import os
from pathlib import Path
import yaml
from dataclasses import dataclass
from enum import Enum

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class ModelProvider(str, Enum):
    """模型提供商枚举"""
    OPENAI = "openai"
    DEEPSEEK = "deepseek"
    QWEN = "qwen"
    ZHIPU = "zhipu"
    BAIDU = "baidu"
    MOONSHOT = "moonshot"
    MINIMAX = "minimax"
    ANTHROPIC = "anthropic"

@dataclass
class ModelConfig:
    """模型配置"""
    api_key: str
    model: str
    api_base: Optional[str] = None
    api_version: Optional[str] = None
    timeout: int = 30
    max_retries: int = 3
    temperature: float = 0.7
    max_tokens: Optional[int] = None

class BaseLLM(ABC):
    """大模型服务基类"""
    
    def __init__(self, config: ModelConfig):
        self.config = config
        self.logger = logging.getLogger(self.__class__.__name__)

    @abstractmethod
    def chat_completion(
        self,
        messages: List[Dict[str, str]],
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        stream: bool = False
    ) -> Dict[str, Any]:
        """聊天补全"""
        pass

    @abstractmethod
    def get_embedding(self, text: str) -> List[float]:
        """获取文本嵌入向量"""
        pass

    def _log_request(self, method: str, **kwargs):
        self.logger.info(f"Request: {method} - {kwargs}")

    def _log_response(self, method: str, response: Any):
        self.logger.info(f"Response: {method} - {response}")

    def _handle_error(self, error: Exception, method: str):
        self.logger.error(f"Error in {method}: {str(error)}")
        raise error

class OpenAILLM(BaseLLM):
    """OpenAI 模型服务"""
    
    def __init__(self, config: ModelConfig):
        super().__init__(config)
        self.client = OpenAI(
            api_key=config.api_key,
            base_url=config.api_base,
            timeout=config.timeout
        )

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
    def chat_completion(
        self,
        messages: List[Dict[str, str]],
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        stream: bool = False
    ) -> Dict[str, Any]:
        try:
            self._log_request("chat_completion", messages=messages)
            
            response = self.client.chat.completions.create(
                model=self.config.model,
                messages=messages,
                temperature=temperature or self.config.temperature,
                max_tokens=max_tokens or self.config.max_tokens,
                stream=stream
            )
            
            if stream:
                self._log_response("chat_completion", "streaming response")
                return response
            else:
                result = {
                    "content": response.choices[0].message.content,
                    "role": response.choices[0].message.role,
                    "finish_reason": response.choices[0].finish_reason
                }
                self._log_response("chat_completion", result)
                return result
                
        except Exception as e:
            self._handle_error(e, "chat_completion")

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
    def get_embedding(self, text: str) -> List[float]:
        try:
            self._log_request("get_embedding", text=text)
            
            response = self.client.embeddings.create(
                model="text-embedding-3-small",
                input=text
            )
            
            embedding = response.data[0].embedding
            self._log_response("get_embedding", f"vector length: {len(embedding)}")
            return embedding
            
        except Exception as e:
            self._handle_error(e, "get_embedding")

class QwenLLM(BaseLLM):
    """通义千问模型服务"""
    
    def __init__(self, config: ModelConfig):
        super().__init__(config)
        dashscope.api_key = config.api_key

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
    def chat_completion(
        self,
        messages: List[Dict[str, str]],
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        stream: bool = False
    ) -> Dict[str, Any]:
        try:
            self._log_request("chat_completion", messages=messages)
            
            response = Generation.call(
                model=self.config.model,
                messages=messages,
                temperature=temperature or self.config.temperature,
                max_tokens=max_tokens or self.config.max_tokens,
                stream=stream
            )
            
            if stream:
                self._log_response("chat_completion", "streaming response")
                return response
            else:
                result = {
                    "content": response.output.text,
                    "role": "assistant",
                    "finish_reason": "stop"
                }
                self._log_response("chat_completion", result)
                return result
                
        except Exception as e:
            self._handle_error(e, "chat_completion")

    def get_embedding(self, text: str) -> List[float]:
        try:
            self._log_request("get_embedding", text=text)
            
            response = Generation.call(
                model="text-embedding-v1",
                input=text
            )
            
            embedding = response.output.embeddings[0]
            self._log_response("get_embedding", f"vector length: {len(embedding)}")
            return embedding
            
        except Exception as e:
            self._handle_error(e, "get_embedding")

class AnthropicLLM(BaseLLM):
    """Anthropic Claude 模型服务"""
    
    def __init__(self, config: ModelConfig):
        super().__init__(config)
        self.api_base = config.api_base or "https://api.anthropic.com/v1"

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
    def chat_completion(
        self,
        messages: List[Dict[str, str]],
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        stream: bool = False
    ) -> Dict[str, Any]:
        try:
            self._log_request("chat_completion", messages=messages)
            
            headers = {
                "x-api-key": self.config.api_key,
                "anthropic-version": self.config.api_version or "2023-06-01",
                "Content-Type": "application/json"
            }
            
            # 转换消息格式
            prompt = "\n".join([f"{msg['role']}: {msg['content']}" for msg in messages])
            
            data = {
                "model": self.config.model,
                "prompt": prompt,
                "temperature": temperature or self.config.temperature,
                "max_tokens_to_sample": max_tokens or self.config.max_tokens,
                "stream": stream
            }
            
            response = requests.post(
                f"{self.api_base}/complete",
                headers=headers,
                json=data,
                timeout=self.config.timeout
            )
            response.raise_for_status()
            
            result = response.json()
            self._log_response("chat_completion", result)
            
            if stream:
                return result
            else:
                return {
                    "content": result["completion"],
                    "role": "assistant",
                    "finish_reason": "stop"
                }
                
        except Exception as e:
            self._handle_error(e, "chat_completion")

    def get_embedding(self, text: str) -> List[float]:
        raise NotImplementedError("Anthropic Claude 暂不支持嵌入向量")

class LLMFactory:
    """大模型服务工厂类"""
    
    _providers = {
        ModelProvider.OPENAI: OpenAILLM,
        ModelProvider.QWEN: QwenLLM,
        ModelProvider.ANTHROPIC: AnthropicLLM
    }
    
    @classmethod
    def create(cls, provider: Union[str, ModelProvider], config: ModelConfig) -> BaseLLM:
        if isinstance(provider, str):
            try:
                provider = ModelProvider(provider)
            except ValueError:
                raise ValueError(f"不支持的提供商: {provider}")
        
        if provider not in cls._providers:
            raise ValueError(f"不支持的提供商: {provider}")
            
        service_class = cls._providers[provider]
        return service_class(config)

class ConfigManager:
    """配置管理器"""
    
    def __init__(self, config_path: Optional[str] = None):
        self.config_path = config_path or os.getenv("LLM_CONFIG_PATH", "config/llm_config.yaml")
        self.config = self._load_config()
    
    def _load_config(self) -> Dict[str, Any]:
        try:
            config_path = Path(self.config_path)
            if not config_path.exists():
                logger.warning(f"配置文件不存在: {self.config_path}")
                return {}
                
            with open(config_path, "r", encoding="utf-8") as f:
                return yaml.safe_load(f)
        except Exception as e:
            logger.error(f"加载配置文件失败: {str(e)}")
            return {}
    
    def get_model_config(self, provider: str) -> Optional[ModelConfig]:
        if provider not in self.config:
            return None
            
        config_data = self.config[provider]
        return ModelConfig(
            api_key=config_data["api_key"],
            model=config_data.get("model", ""),
            api_base=config_data.get("api_base"),
            api_version=config_data.get("api_version"),
            timeout=config_data.get("timeout", 30),
            max_retries=config_data.get("max_retries", 3),
            temperature=config_data.get("temperature", 0.7),
            max_tokens=config_data.get("max_tokens")
        ) 