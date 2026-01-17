from langchain_core.prompts import ChatPromptTemplate, FewShotChatMessagePromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from langchain.schema.runnable import RunnableSequence
from .llm_config import get_llm

# 初始化大模型
llm = get_llm()
# JSON解析器
json_parser = JsonOutputParser()

# --------------------------
# 流水线1：核心概念解析（输入概念→输出结构化定义）
# --------------------------
# 少样本提示
parse_examples = [
    {
        "input": "熵",
        "output": '{"id":"1","name":"熵","domain":"物理学","definition":"衡量系统无序程度的物理量，熵增定律指出孤立系统熵始终增大"}'
    },
    {
        "input": "最小二乘法",
        "output": '{"id":"1","name":"最小二乘法","domain":"数学","definition":"通过最小化误差平方和求解数据拟合参数的优化方法"}'
    }
]
# 样本模板
parse_example_prompt = ChatPromptTemplate.from_messages([
    ("human", "{input}"),
    ("ai", "{output}")
])
# 少样本Prompt
parse_few_shot = FewShotChatMessagePromptTemplate(
    example_prompt=parse_example_prompt,
    examples=parse_examples
)
# 最终Prompt模板
parse_prompt = ChatPromptTemplate.from_messages([
    ("system", "你是跨学科概念分析师，严格按JSON格式输出：id（固定1）、name（概念名）、domain（仅数学/物理/计算机/生物学/社会学）、definition（1句话）"),
    parse_few_shot,  # 加入少样本
    ("human", "解析概念：{concept}")
])
# 构建流水线（实验一3.4节LCEL语法）
parse_chain = parse_prompt | llm | json_parser

# --------------------------
# 流水线2：跨学科关联挖掘（输入核心概念→输出3个关联概念）
# --------------------------
# 少样本提示（避免无意义关联）
mine_examples = [
    {
        "input": '{"name":"熵","domain":"物理学","definition":"衡量系统无序程度的物理量"}',
        "output": '[{"id":"2","name":"信息熵","domain":"计算机","definition":"衡量信息不确定性的指标","relation":"数学定义一致，均基于概率分布","strength":5},{"id":"3","name":"耗散结构","domain":"生物学","definition":"远离平衡态的开放系统","relation":"基于熵增定律，生物通过能量交换降低自身熵","strength":4}]'
    }
]
mine_example_prompt = ChatPromptTemplate.from_messages([
    ("human", "{input}"),
    ("ai", "{output}")
])
mine_few_shot = FewShotChatMessagePromptTemplate(
    example_prompt=mine_example_prompt,
    examples=mine_examples
)
# 最终Prompt模板
mine_prompt = ChatPromptTemplate.from_messages([
    ("system", "从数学/物理/计算机/生物学/社会学中选3个不同领域，生成关联概念，输出JSON数组：id（2/3/4）、name、domain、definition（1句）、relation（2句关联逻辑）、strength（1-5）"),
    mine_few_shot,
    ("human", "核心概念：{core_data}")
])
# 构建流水线
mine_chain = mine_prompt | llm | json_parser

# --------------------------
# 流水线3：关联逻辑校验（输入核心概念+关联概念→输出是否有效）
# --------------------------
check_prompt = ChatPromptTemplate.from_messages([
    ("system", "判断关联逻辑是否合理，仅输出JSON：{\"valid\":true/false,\"reason\":\"验证理由\"}"),
    ("human", "核心概念：{core_name}，关联概念：{rel_name}，关联逻辑：{relation}")
])
check_chain = check_prompt | llm | json_parser

# --------------------------
# 对外暴露的调用函数
# --------------------------
def parse_concept(concept: str) -> dict:
    """调用流水线1：解析核心概念"""
    return parse_chain.invoke({"concept": concept})

def mine_relations(core_data: dict) -> list:
    """调用流水线2：挖掘关联概念"""
    return mine_chain.invoke({"core_data": str(core_data)})

def check_relation(core_name: str, rel_data: dict) -> dict:
    """调用流水线3：校验关联逻辑"""
    return check_chain.invoke({
        "core_name": core_name,
        "rel_name": rel_data["name"],
        "relation": rel_data["relation"]
    })