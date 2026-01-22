export async function fetch_gen(concept) {
    try {
        const res = await fetch('http://localhost:8000/api/kg/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ concept })
        });

        // 关键：先打印原始响应体（不管是不是JSON）
        const rawText = await res.text();
        console.log("后端返回的原始响应体：", rawText); // 这行一定会输出，除非请求失败

        // 再解析JSON
        const data = JSON.parse(rawText);
        console.log("解析后的data：", data);
        return data;
    } catch (error) {
        console.error("异常详情：", error);
        return { code:500, data:{nodes:[], links:[]}, msg:error.message };
    }
}

export async function fetch_quick_search(concept){
    const res = await fetch('http://localhost:8000/api/kg/query-db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ concept })
    });
    const data = await res.json();
    return data;
}