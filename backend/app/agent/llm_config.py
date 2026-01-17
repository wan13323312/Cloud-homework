from dotenv import load_dotenv
from langchain_openai import ChatOpenAI

# 加载环境变量（从docker-compose.yml的environment中读取）
load_dotenv()

def get_llm():
    """复用实验一的模型配置，返回初始化后的ChatModel"""
    # 选项1：智谱GLM-4.5-Flash（推荐，免费且中文支持好）
    return ChatOpenAI(
    api_key="sk-eeguuqrgdxpamorwpxmypfmmmkycsycchvrfitekxtatioqr",
    base_url="https://api.siliconflow.cn/v1", # <--- 硅基流动官方兼容地址
    model="deepseek-ai/DeepSeek-V3.2-Exp",
    temperature=0.3,
    max_retries=3
)