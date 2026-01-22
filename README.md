# 跨学科知识图谱智能体 - 后端运行指南
## 一、环境准备
### 1. 基础依赖
- Docker & Docker Compose（推荐版本：Docker 20.10+，Docker Compose 2.0+）
  - Windows：安装 [Docker Desktop](https://www.docker.com/products/docker-desktop/)（勾选“Use WSL 2 instead of Hyper-V”）
  - macOS/Linux：参考 [Docker 官方安装文档](https://docs.docker.com/get-docker/)
- Git（可选，用于克隆代码）
- Python 3.10+（可选，本地调试用，容器化部署无需）

### 2. 验证环境
打开终端/命令行，执行以下命令验证 Docker 环境：
```bash
# 验证 Docker 版本
docker --version
# 验证 Docker Compose 版本
docker compose version
```
输出类似如下内容即表示环境正常：
```
Docker version 26.0.0, build 2ae903e
Docker Compose version v2.25.0
```

## 二、代码准备
### 1. 克隆/下载代码
将后端代码包解压到本地目录（如 `C:\code\cloud_homework\Cloud-homework` 或 `/home/user/cloud-homework`），确保目录结构如下：
```
Cloud-homework/
├── docker-compose.yml       # 容器编排配置
└── backend/                 # 后端代码目录
    ├── Dockerfile           # 后端镜像构建配置
    ├── requirements.txt     # Python 依赖
    └── app/                 # 核心代码
        ├── main.py          # FastAPI 入口
        ├── api/             # 接口路由
        ├── db/              # Neo4j 连接
        └── services/        # 业务逻辑
```

### 2. 配置环境变量（可选）
无需手动修改，`docker-compose.yml` 已内置以下核心配置：
- Neo4j 连接信息：`NEO4J_URI=bolt://neo4j:7687`、`NEO4J_USER=neo4j`、`NEO4J_PASSWORD=12345678`
- 跨域配置：允许所有来源访问
- 服务端口：后端 8000 端口，Neo4j 7474/7687 端口

## 三、启动服务
### 1. 进入代码根目录
打开终端/命令行，切换到代码根目录（`docker-compose.yml` 所在目录）：
```bash
# Windows
cd C:\code\cloud_homework\Cloud-homework
# macOS/Linux
cd /home/user/cloud-homework
```

### 2. 启动容器
执行以下命令构建并启动后端 + Neo4j 容器：
```bash
# 构建镜像并启动容器（首次启动需下载镜像，耗时约 1-3 分钟）
docker compose up -d --build
```
命令说明：
- `-d`：后台运行容器
- `--build`：强制重新构建镜像（确保代码修改生效）

### 3. 验证服务启动
#### （1）查看容器状态
```bash
docker compose ps
```
输出如下内容表示容器正常运行（`STATUS` 为 `Up`）：
```
NAME                       IMAGE                    COMMAND                   SERVICE   CREATED         STATUS         PORTS
cloud-homework-backend-1   cloud-homework-backend   "uvicorn app.main:ap…"   backend   10 seconds ago  Up 9 seconds   0.0.0.0:8000->8000/tcp
cloud-homework-neo4j-1     neo4j:5.15-community     "tini -g -- /startup…"   neo4j     10 seconds ago  Up 9 seconds   0.0.0.0:7474->7474/tcp, 0.0.0.0:7687->7687/tcp
```

#### （2）查看启动日志
```bash
# 查看后端日志（验证 Neo4j 驱动初始化）
docker compose logs -f backend
# 查看 Neo4j 日志（验证 7687 端口就绪）
docker compose logs -f neo4j
```
- 后端日志出现 `✅ 第X次尝试：Neo4j连接成功` 表示驱动初始化完成；
- Neo4j 日志出现 `Bolt enabled on 0.0.0.0:7687.` 表示 Neo4j 服务就绪。

## 四、接口测试
### 1. 健康检查接口
访问以下地址验证服务可用性：
```
http://localhost:8000/health
```
正常响应：
```json
{
  "status": "ok",
  "services": {
    "backend": "running",
    "neo4j": true
  },
  "version": "1.0"
}
```

## 五、常见问题排查
### 1. 容器启动失败
- 问题：端口被占用（如 8000/7474/7687）
- 解决：关闭占用端口的程序，或修改 `docker-compose.yml` 中的端口映射（如 `8001:8000`）。

### 2. Neo4j 连接失败
- 问题：日志显示 `Connection refused`
- 解决：Neo4j 启动需 5-10 秒，等待后重新调用接口即可（代码已内置重试逻辑）。

### 3. 接口返回 500 错误
- 问题：驱动未初始化
- 解决：查看后端日志 `docker compose logs -f backend`，确认是否有 `Neo4j连接成功` 日志，若无则重启容器：
  ```bash
  docker compose down -v && docker compose up -d --build
  ```

## 六、停止服务
如需停止服务，执行以下命令：
```bash
# 停止容器（保留数据）
docker compose stop
# 停止并删除容器+数据卷（彻底清理）
docker compose down -v
```
