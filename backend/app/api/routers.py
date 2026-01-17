from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.agent.kg_graph import kg_graph
from app.db.neo4j_conn import driver  # 之前实现的数据库连接

router = APIRouter()


# 请求参数格式（前端传参）
class ConceptRequest(BaseModel):
    concept: str


# 核心接口：生成跨学科知识图谱
@router.post("/api/kg/generate")
async def generate_kg(request: ConceptRequest):
    concept = request.concept.strip()
    if not concept:
        raise HTTPException(status_code=400, detail="请输入核心概念")

    try:
        # 1. 运行LangGraph图（执行“解析→挖掘→校验”流程）
        initial_state = {"concept": concept, "need_retry": False}
        final_state = kg_graph.invoke(initial_state)  # 自动处理重试逻辑

        # 2. 组装节点/边数据（供前端Echarts渲染）
        nodes = [final_state["core_data"]] + final_state["valid_related"]
        links = [
            {
                "source": final_state["core_data"]["id"],
                "target": rel["id"],
                "relation": rel["relation"],
                "strength": rel["strength"]
            } for rel in final_state["valid_related"]
        ]

        # 3. 存入Neo4j（复用之前的数据库逻辑，省略）
        # ...

        return {
            "code": 200,
            "data": {"nodes": nodes, "links": links},
            "msg": f"成功生成{len(nodes) - 1}个跨学科关联概念"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"大模型调用失败：{str(e)}")