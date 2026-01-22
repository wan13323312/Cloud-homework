const map_dict = {
    1: '#FFF9C4', // 淡黄
    2: '#FFF176',
    3: '#FFEE58',
    4: '#FFC107', // 橙黄
    5: '#F44336'  // 红色（Material Red）
};

import{change_to_finding_mode,out_finding_mode,startFindPath} from './finding_mode.js'

let infinding = false;


function preprocess(data) {
  for (let t of data['nodes']) {
    t['id'] = t['name'];
    t['label'] = t['name'];
  }


  let new_dt = {};
  new_dt['edges'] = data['links'];
  new_dt['nodes'] = data['nodes'];
  return new_dt;
}

function mergeGraphs(graph1, graph2) {
    // 假设 graph2 是普通对象：{ nodes: [...], edges: [...] }
    const nodes2 = graph2.nodes || [];
    const edges2 = graph2.edges || [];

    // 构建 graph1 中已存在的节点 ID 集合
    const existingNodeIds = new Set(
        graph1.getNodes().map(node => node.get('id'))
    );

    // 构建 graph1 中已存在的无向边集合（标准化 key）
    const existingEdgeKeys = new Set();
    graph1.getEdges().forEach(edge => {
        const source = edge.getSource().get('id');
        const target = edge.getTarget().get('id');
        const key = [source, target].sort().join('|');
        existingEdgeKeys.add(key);
    });

    // 添加 graph2 中的新节点（跳过重复）
    nodes2.forEach(nodeModel => {
        if (nodeModel.id == null) {
            console.warn('跳过无 id 的节点:', nodeModel);
            return;
        }
        if (!existingNodeIds.has(nodeModel.id)) {
            graph1.addItem('node', { ...nodeModel });
            existingNodeIds.add(nodeModel.id);
        }
    });

    // 添加 graph2 中的新边（跳过重复，且确保端点存在）
    edges2.forEach(edgeModel => {
        const { source, target } = edgeModel;
        if (source == null || target == null) {
            console.warn('跳过无效边（缺少 source 或 target）:', edgeModel);
            return;
        }

        // 只有当两个端点都已存在于图中时才添加边
        if (!existingNodeIds.has(source) || !existingNodeIds.has(target)) {
            console.warn(`跳过边 ${source} -> ${target}：端点节点不存在`);
            return;
        }

        const edgeKey = [source, target].sort().join('|');
        if (!existingEdgeKeys.has(edgeKey)) {
            graph1.addItem('edge', { ...edgeModel });
            existingEdgeKeys.add(edgeKey);
        }
    });

}


function addnodes(graph) {
    graph.on('node:dblclick', function (e) {
        let d = {
            "nodes": [
                {"name": "信息熵", "domain": "计算机"},
                {"name": "abc1", "domain": "计算机"},
                {"name": "bcd2", "domain": "计算机"},

            ],
            "links":[
            {
                "source": "信息熵",
                "target": "abc1",
                "relation": "热力学熵描述了系统微观状态混乱度的统计物理量，而信息熵是克劳德·香农借鉴此概念，用于量化信息源的不确定性或信息量。两者在数学形式上具有同构性（都满足概率的负对数期望），使得统计物理和信息论之间建立了深刻的桥梁。",
                "strength": 5
            },
            {
                "source": "信息熵",
                "target": "bcd2",
                "relation": "吉布斯自由能（G）的定义式为 G = H - TS，其中T是温度，S是系统的熵。该公式明确地将能量（焓H）与无序度（熵S）结合起来，揭示了化学反应的自发性不仅取决于能量降低（焓减），也取决于熵增的驱动。",
                "strength": 4
            }]
        }
        let data = preprocess(d);
        graph.setAutoPaint(false);
        mergeGraphs(graph, data);
        graph.setAutoPaint(true);
        graph.layout();

        const edges = graph.getEdges();
        // 遍历并更新每条边的颜色
        edges.forEach(edge => {
            graph.updateItem(edge, {
                style: {
                    stroke: map_dict[edge.getModel().strength],        // 新颜色
                }
            });
        });
    });
}


function draw_main(input) {
    let data = preprocess(input);
    const tooltip = new G6.Tooltip({
        offsetX: 10,
        offsetY: 10,
        fixToNode: [1, 0.5],
        // the types of items that allow the tooltip show up
        // 允许出现 tooltip 的 item 类型
        itemTypes: ['node', 'edge'],
        // custom the tooltip's content
        // 自定义 tooltip 内容
        getContent: (e) => {
            const outDiv = document.createElement('div');
            outDiv.style.width = 'fit-content';
            outDiv.style.height = 'fit-content';
            const model = e.item.getModel();
            if (e.item.getType() === 'node') {
                outDiv.innerHTML = `名称： ${model.name}<br/>领域：${model.domain}`;
            } else {
                const edge = e.item;
                const source = e.item.getSource();
                const target = e.item.getTarget();
                outDiv.innerHTML = `来源：${source.getModel().name}<br/>去向：${target.getModel().name}<br/>关联： ${edge.getModel().relation}<br/>强度:  ${edge.getModel().strength}`;
            }
            return outDiv;
        },
    });

    var graph = new G6.Graph({
        container: 'mountNode',
        width: window.innerWidth,
        height: window.innerHeight,
        fitView: true,
        layout: {
            type: 'force',
            edgeStrength: 0.7,
        },
        plugins: [tooltip],
        modes: {
            default: ['drag-canvas','zoom-canvas'],
        },
        defaultNode: {
            size: [20, 20],
            color: 'steelblue',
            style: {
                lineWidth: 2,
                fill: '#fff'
            }
        },

        defaultEdge: {
            style: {
                stroke: '#e2e2e2',// 线条颜色
                lineWidth: 2
            }
        },
        nodeStateStyles: {
            highlight: {
                opacity: 1,
            },
            dark: {
                opacity: 0.2,
            },
            findingPath:{
                opacity: 0.2
            },
            tracePath:{
                stroke:'#ff0000',
                opacity: 1
            }

        },
        edgeStateStyles: {
            highlight: {
                opacity: 1,
            },
            dark: {
                opacity: 0.2,
            },
            findingPath:{
                stroke:'#00ff00',
                opacity: 0.2
            },
            tracePath:{
                stroke:'#ff0000',
                opacity: 1
            }
        },
    });


    graph.data(data);
    // 获取图中所有的边

    function clearAllStats() {
        graph.setAutoPaint(false);
        graph.getNodes().forEach(function (node) {
            graph.clearItemStates(node);
        });
        graph.getEdges().forEach(function (edge) {
            graph.clearItemStates(edge);
        });
        graph.paint();
        graph.setAutoPaint(true);
    }

    graph.on('node:mouseenter', function (e) {

        if(infinding)
            return;

        const item = e.item;
        graph.setAutoPaint(false);
        graph.getNodes().forEach(function (node) {
            graph.clearItemStates(node);
            graph.setItemState(node, 'dark', true);
        });
        graph.setItemState(item, 'dark', false);
        graph.setItemState(item, 'highlight', true);
        graph.getEdges().forEach(function (edge) {
            if (edge.getSource() === item) {
                graph.setItemState(edge.getTarget(), 'dark', false);
                graph.setItemState(edge.getTarget(), 'highlight', true);
                graph.setItemState(edge, 'highlight', true);
                edge.toFront();
            } else if (edge.getTarget() === item) {
                graph.setItemState(edge.getSource(), 'dark', false);
                graph.setItemState(edge.getSource(), 'highlight', true);
                graph.setItemState(edge, 'highlight', true);
                edge.toFront();
            } else {
                graph.setItemState(edge, 'highlight', false);
                graph.setItemState(edge, 'dark', true);
            }
        });
        graph.paint();
        graph.setAutoPaint(true);
    });
    graph.on('node:mouseleave', function(e){
        if(infinding)
            return;
        clearAllStats();
    });
    graph.on('canvas:click', clearAllStats);



    graph.on('edge:mouseenter', function (e) {

        if(infinding)
            return;

        const item = e.item; // 获取当前鼠标进入的边
        const sourceNode = item.getSource(); // 获取源节点
        const targetNode = item.getTarget(); // 获取目标节点

        graph.setAutoPaint(false); // 暂停自动重绘

        // 遍历所有节点，并将它们设置为'dark'状态，除了sourceNode和targetNode
        graph.getNodes().forEach(function (node) {
            if(node !== sourceNode && node !== targetNode){
                graph.setItemState(node, 'dark', true);
                graph.setItemState(node, 'hightlight', false);
            }
        });

        graph.getEdges().forEach(function (edge) {
            if(edge != item){
                graph.setItemState(edge, 'dark', true);
                graph.setItemState(edge, 'hightlight', false);
            }
        });

        // 设置sourceNode和targetNode为非'dark'状态且为'highlight'状态
        [sourceNode, targetNode].forEach(function (node) {
            graph.setItemState(node, 'dark', false);
            graph.setItemState(node, 'highlight', true);
        });

        // 设置当前边为非'dark'状态且为'highlight'状态
        graph.setItemState(item, 'dark', false);
        graph.setItemState(item, 'highlight', true);

        graph.paint(); // 手动重绘图谱
        graph.setAutoPaint(true); // 重新启用自动重绘
    });

    //addnodes(graph);

    // 当鼠标离开边时，恢复原始状态
    graph.on('edge:mouseleave', function(e){
        if(infinding)
            return;
        clearAllStats();
    });


    addnodes(graph);


    graph.render();


    const edges = graph.getEdges();
    // 遍历并更新每条边的颜色
    edges.forEach(edge => {
        graph.updateItem(edge, {
            style: {
                stroke: map_dict[edge.getModel().strength],        // 新颜色
            }
        });
    });



    return graph;
}


let pd = {
    "nodes": [
        {"name": "熵", "domain": "未知"},
        {"name": "信息熵", "domain": "计算机"},
        {"name": "吉布斯自由能", "domain": "化学"},
        {"name": "社会熵", "domain": "社会学"},
        {"name": "热力学第二定律", "domain": "物理"},
        {"name": "玻尔兹曼熵公式", "domain": "数学/物理"},
        {"name": "代谢熵产生", "domain": "生物"}
    ],
    "links": [
        {
            "source": "熵",
            "target": "信息熵",
            "relation": "热力学熵描述了系统微观状态混乱度的统计物理量，而信息熵是克劳德·香农借鉴此概念，用于量化信息源的不确定性或信息量。两者在数学形式上具有同构性（都满足概率的负对数期望），使得统计物理和信息论之间建立了深刻的桥梁。",
            "strength": 5
        },
        {
            "source": "熵",
            "target": "吉布斯自由能",
            "relation": "吉布斯自由能（G）的定义式为 G = H - TS，其中T是温度，S是系统的熵。该公式明确地将能量（焓H）与无序度（熵S）结合起来，揭示了化学反应的自发性不仅取决于能量降低（焓减），也取决于熵增的驱动。",
            "strength": 4
        },
        {
            "source": "熵",
            "target": "社会熵",
            "relation": "社会学家将熵的概念引入对社会系统的分析，认为一个封闭、缺乏信息交流与能量输入的社会系统，其内部冲突、失序和不确定性（社会熵）会自发增加，这与热力学孤立系统的熵增原理在逻辑上具有类比性。",
            "strength": 3
        },
        {
            "source": "熵",
            "target": "热力学第二定律",
            "relation": "熵是热力学第二定律的核心物理量，用于量化系统的无序程度和过程的方向性。该定律通过熵增原理，将熵的概念与时间箭头、能量耗散及不可逆过程紧密联系在一起，是熵在物理学中最根本的体现。",
            "strength": 5
        },
        {
            "source": "熵",
            "target": "玻尔兹曼熵公式",
            "relation": "该公式为熵提供了统计力学的微观解释，将宏观的、唯象的热力学熵与系统微观粒子可能排列方式的数量（即混乱度）建立了定量桥梁。它表明熵本质上是系统微观状态不确定性的度量，是连接宏观与微观物理世界的关键。",
            "strength": 5
        },
        {
            "source": "熵",
            "target": "代谢熵产生",
            "relation": "生命体作为开放系统，通过从环境摄取低熵物质（如有序的有机物）并向环境排出高熵废物（如热量和简单分子），来抵消自身内部因代谢活动产生的熵增，从而维持低熵有序状态。这体现了熵概念在解释生命系统远离平衡态、对抗热力学衰败这一核心特征中的应用。",
            "strength": 4
        }
    ],
    "reasoning": [
        "0. 输入校验：开始调用validate_concept工具判断概念有效性",
        "0. 输入校验通过：熵是热力学/信息论核心学科概念，具有明确科学定义和研究价值",
        "1. 查库：获取熵的已有关联",
        "2. 清理旧关联：共处理0个不合理关联（软删除/标记异常）",
        "3. 扩展（第1次）：开始生成新关联",
        "3. 扩展（第1次）：生成5个新关联（跨学科、非重复）",
        "4. 校验：5个关联合法，0个关联不合法",
        "5. 存库：保存5个合法关联",
        "6. 生成图谱：共7个节点，6条合法关联"
    ],
    "cleaned_relations": []
}

document.addEventListener('DOMContentLoaded', () =>{
    let graph = draw_main(pd);
    document.getElementById('findbtn').addEventListener('click', ()=>startFindPath(graph));

// 2. 为寻路模式复选框绑定状态切换逻辑
    document.getElementById('findMode').addEventListener('change', function () {
        if (this.checked) {
            change_to_finding_mode(graph);      // 启用寻路模式
            infinding = true;
        } else {
            out_finding_mode(graph);     // 退出寻路模式
            infinding = false;
        }
    });
});