function clearAllStats(graph) {
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



export function change_to_finding_mode(graph){

    clearAllStats(graph);
    graph.getEdges().forEach(function(edge){
        graph.setItemState(edge, 'findingPath',true);
    });

    graph.getNodes().forEach(function(node){
        graph.setItemState(node,'findingPath',true);
    });

    const select1 = document.getElementById('node1');
    const select2 = document.getElementById('node2');
    const nodes = graph.getNodes();
    nodes.forEach(node => {
        const option1 = document.createElement('option');
        option1.value = node.getModel().id;
        option1.textContent = node.getModel().id;
        select1.appendChild(option1);

        const option2 = document.createElement('option');
        option2.value = node.getModel().id;
        option2.textContent = node.getModel().id;
        select2.appendChild(option2);
    });
}

export function out_finding_mode(graph){
    clearAllStats(graph);
}


/**
 * 找到从节点 a 到节点 b 的最大瓶颈路径（路径上最小 strength 最大）
 * 假设图是无向的，所有边双向
 *
 * @param {string} a - 起始节点 ID
 * @param {string} b - 目标节点 ID
 * @param {Object} graph - AntV G6 Graph 实例
 * @returns {{ nodes: string[], edges: string[] } | null}
 */
function findMaxBottleneckPath(a, b, graph) {

    // 边界情况
    const nodeMap = new Set(graph.getNodes().map(node => node.get('id')));
    if (!nodeMap.has(a) || !nodeMap.has(b)) {
        return null; // 节点不存在
    }

    // 构建邻接表
    const adj = {};
    nodeMap.forEach(id => adj[id] = []);

    const edges = graph.getEdges();
    edges.forEach(edge => {
        const source = edge.getModel().source;
        const target = edge.getModel().target;
        const edgeId = edge.getModel().id;

        // 安全获取 strength：优先从 model，其次直接属性
        const model = edge.getModel();
        const strength = edge.getModel().strength;

        // 无向图：双向添加
        adj[source].push({ target, edgeId, strength });
        adj[target].push({ target: source, edgeId, strength });
    });

    // 记录到达每个节点时的最大 bottleneck 值（用于剪枝）
    const maxBottleneckTo = {};
    nodeMap.forEach(id => maxBottleneckTo[id] = -Infinity);
    maxBottleneckTo[a] = Infinity;

    // 优先队列：按 bottleneck 降序（模拟最大堆）
    const pq = [{ nodeId: a, bottleneck: Infinity }];

    // 用于重建路径
    const parent = {}; // parent[nodeId] = { from, viaEdgeId }
    parent[a] = null;

    while (pq.length > 0) {
        // 取出当前 bottleneck 最大的节点
        pq.sort((x, y) => y.bottleneck - x.bottleneck);
        const current = pq.shift();
        const u = current.nodeId;
        const currentBottleneck = current.bottleneck;

        // 如果已找到更优路径，跳过
        if (currentBottleneck < maxBottleneckTo[u]) continue;

        // 遍历邻居
        for (const { target: v, edgeId, strength } of adj[u]) {
            const newBottleneck = Math.min(currentBottleneck, strength);

            // 如果找到更大的 bottleneck 到达 v，则更新
            if (newBottleneck > maxBottleneckTo[v]) {
                maxBottleneckTo[v] = newBottleneck;
                parent[v] = { from: u, viaEdge: edgeId };
                pq.push({ nodeId: v, bottleneck: newBottleneck });
            }
        }
    }

    // 如果 b 不可达
    if (maxBottleneckTo[b] === -Infinity) {
        return null;
    }

    // 重建路径
    const pathNodes = [];
    const pathEdges = [];
    let cur = b;
    while (cur !== null) {
        pathNodes.unshift(cur);
        const p = parent[cur];
        if (p && p.viaEdge) {
            pathEdges.unshift(p.viaEdge);
        }
        cur = p ? p.from : null;
    }

    return {
        nodes: pathNodes,
        edges: pathEdges
    };
}

function highlightPath(graph, nodeIds, edgeIds) {

    // 为指定节点设置 'tracePath' 状态
    nodeIds.forEach(id => {
        const node = graph.findById(id);
        if (node) {
            graph.setItemState(node, 'tracePath', true);
        }
    });

    // 为指定边设置 'tracePath' 状态
    edgeIds.forEach(id => {
        const edge = graph.findById(id);
        if (edge) {
            graph.setItemState(edge, 'tracePath', true);
        }
    });
}


export function startFindPath(graph){
    let id1 = '';
    let id2 = '';

    const selectElement1 = document.getElementById('node1');
    if (selectElement1) {
        id1 = selectElement1.value;
    }

    const selectElement2 = document.getElementById('node2');
    if (selectElement2) {
        id2 = selectElement2.value;
    }

    if(id1 === id2)
    {
        alert('两个节点不能一样');
        return;
    }

    if(id1 === 'default' || id2 === 'default')
    {
        alert('有一个节点未作出选择');
        return;
    }

    let result = findMaxBottleneckPath(id1,id2,graph);
    if (result) {
        highlightPath(graph, result['nodes'],result['edges']);
    }
    else{
        alert('节点不可达');
    }
}


