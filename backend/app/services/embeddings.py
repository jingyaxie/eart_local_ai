from typing import List, Optional
import openai
from openai import OpenAI
import numpy as np
from tenacity import retry, stop_after_attempt, wait_exponential

class OpenAIEmbeddings:
    def __init__(self, api_key: str, model: str = "text-embedding-3-small"):
        """
        初始化 OpenAI 嵌入服务
        :param api_key: OpenAI API 密钥
        :param model: 使用的模型名称，可选值：
            - text-embedding-3-small (默认，速度快，成本低)
            - text-embedding-3-large (更高质量，但成本更高)
        """
        self.client = OpenAI(api_key=api_key)
        self.model = model

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        """
        为多个文档生成嵌入向量
        :param texts: 文本列表
        :return: 嵌入向量列表
        """
        if not texts:
            return []
            
        # 批量处理文本
        response = self.client.embeddings.create(
            model=self.model,
            input=texts
        )
        
        # 提取嵌入向量
        embeddings = [data.embedding for data in response.data]
        return embeddings

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
    def embed_query(self, text: str) -> List[float]:
        """
        为单个查询生成嵌入向量
        :param text: 查询文本
        :return: 嵌入向量
        """
        response = self.client.embeddings.create(
            model=self.model,
            input=text
        )
        return response.data[0].embedding

    def get_embedding_dimension(self) -> int:
        """
        获取嵌入向量的维度
        :return: 维度大小
        """
        # text-embedding-3-small 的维度是 1536
        # text-embedding-3-large 的维度是 3072
        return 1536 if self.model == "text-embedding-3-small" else 3072 