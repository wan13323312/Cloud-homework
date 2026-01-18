from neo4j import GraphDatabase, Driver
import os
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

# 全局Driver实例
driver: Driver = None


def init_neo4j():
    """初始化Neo4j连接"""
    global driver
    try:
        uri = os.getenv("NEO4J_URI")
        user = os.getenv("NEO4J_USER")
        password = os.getenv("NEO4J_PASSWORD")

        if not all([uri, user, password]):
            raise Exception("Neo4j配置未完善")

        driver = GraphDatabase.driver(uri, auth=(user, password))
        # 验证连接
        driver.verify_connectivity()
        print("Neo4j连接成功")
    except Exception as e:
        print(f"Neo4j连接失败：{e}")
        driver = None


# 初始化连接
init_neo4j()