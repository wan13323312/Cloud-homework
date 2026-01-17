from typing import TypedDict
from langgraph.graph import StateGraph, END
from .llm_pipeline import parse_concept, mine_relations, check_relation

# 1. 定义状态（图的“内存”）
class KGState(TypedDict):
    concept: str          # 用户输入的核心概念
    core_data: dict       # 流水线1输出的核心概念结构化数据
    related_list: list    # 流水线2输出的关联概念列表
    valid_related: list   # 校验通过的关联概念列表
    need_retry: bool      # 是否需要重新挖掘（容错逻辑标记）

# 2. 定义节点（图的“执行者）
def parse_node(state: KGState) -> dict:
    """节点1：执行概念解析（调用流水线1）"""
    core_data = parse_concept(state["concept"])
    return {"core_data": core_data, "need_retry": False}

def mine_node(state: KGState) -> dict:
    """节点2：执行关联挖掘（调用流水线2）"""
    related_list = mine_relations(state["core_data"])
    return {"related_list": related_list}

def check_node(state: KGState) -> dict:
    """节点3：执行校验+条件判断（调用流水线3）"""
    valid_related = []
    for rel in state["related_list"]:
        check_res = check_relation(state["core_data"]["name"], rel)
        if check_res["valid"]:
            valid_related.append(rel)
    # 条件判断：若校验通过的关联概念<2个，需要重新挖掘
    need_retry = len(valid_related) < 2
    return {"valid_related": valid_related, "need_retry": need_retry}

# 3. 构建图
def build_kg_graph():
    # 创建图实例
    builder = StateGraph(KGState)
    # 添加节点
    builder.add_node("parse", parse_node)    # 解析节点
    builder.add_node("mine", mine_node)      # 挖掘节点
    builder.add_node("check", check_node)    # 校验节点
    # 固定边：解析→挖掘→校验
    builder.set_entry_point("parse")        # 入口：解析节点
    builder.add_edge("parse", "mine")       # 解析后→挖掘
    builder.add_edge("mine", "check")      # 挖掘后→校验
    # 条件边：校验后判断是否重新挖掘
    def route_check(state: KGState) -> str:
        return "mine" if state["need_retry"] else END  # 重试→挖掘，否则结束
    builder.add_conditional_edges(
        source="check",          # 从校验节点出发
        condition=route_check,   # 路由函数
        mapping={"mine": "mine", END: END}  # 条件映射
    )
    # 编译图（供外部调用）
    return builder.compile()

# 全局图实例（接口模块直接调用）
kg_graph = build_kg_graph()