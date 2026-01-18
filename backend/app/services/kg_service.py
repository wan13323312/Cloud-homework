from app.agent.kg_graph import kg_graph


class KnowledgeGraphService:
    @staticmethod
    def run_agent(concept: str):
        """触发Agent，自主完成输入校验→查库→扩展→校验→存库→生成图谱"""
        # 初始化Agent状态（新增input_valid/input_error_msg）
        initial_state = {
            "concept": concept,
            "input_valid": False,  # 默认无效，由校验节点更新
            "input_error_msg": "",
            "db_result": "",
            "new_relations": [],
            "valid_relations": [],
            "invalid_relations": [],
            "cleaned_relations": [],
            "final_graph": {},
            "reasoning": [],
            "expand_retry_count" : 0  # 必须初始化
        }

        # 运行Agent
        result = kg_graph.invoke(initial_state)

        # return result
        # 若输入无效，直接返回提示
        if not result.get("input_valid"):
            return result["final_graph"]

        # 校验结果
        if not result.get("final_graph"):
            raise Exception("Agent执行失败，未生成图谱数据")

        return result["final_graph"]


# 实例化服务
kg_service = KnowledgeGraphService()