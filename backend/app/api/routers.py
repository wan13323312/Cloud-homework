from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.kg_service import kg_service

router = APIRouter()


# 请求模型
class ConceptRequest(BaseModel):
    concept: str


# 核心接口：生成知识图谱
@router.post("/api/kg/generate")
async def generate_kg(request: ConceptRequest):
    # 1. 仅保留基础校验（网关级过滤）
    concept = request.concept.strip()

    # 空值校验
    if not concept:
        raise HTTPException(status_code=400, detail="核心概念不能为空")

    # 长度校验
    if len(concept) > 20:
        raise HTTPException(status_code=400, detail="核心概念长度不能超过20字")

    # 2. 调用Agent生成图谱（输入有效性由Agent自主判断）
    try:
        final_graph = kg_service.run_agent(concept)
        # 若Agent返回无效输入提示，直接返回400
        if final_graph.get("code") == 400:
            raise HTTPException(status_code=400, detail=final_graph["msg"])

        node_count = len(final_graph.get("nodes", []))
        link_count = len(final_graph.get("links", []))
        return {
            "code": 200,
            "data": final_graph,
            "msg": f"成功生成{node_count}个节点、{link_count}条合法关联"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"生成失败：{str(e)}")