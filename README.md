# OpenRater

OpenRater 是一个遵从 OpenReview 单盲评审哲学的教授评估系统。系统以公平、公正为核心，支持管理员维护教授与课程信息、评审人匿名提交多维度评分、教授针对评审进行答辩（rebuttal）。

## 项目结构

```
.
├── backend        # FastAPI + SQLAlchemy 后端服务
├── frontend       # React + Vite 前端界面
└── LICENSE
```

## 功能概览

- **管理员**：
  - 引导（bootstrap）创建初始管理员账号。
  - 创建/管理课程、教授，并将教授与授课课程及教授账号关联。
- **评审人（Reviewer）**：
  - 在分配的课程上提交单盲评审，包含公平性、授课清晰度、课堂互动、作业负担、Confidence 等核心维度。
  - 查看自身历史提交。
- **教授**：
  - 登录后查看针对自己的所有评审，评审中不暴露评审人身份。
  - 针对每条评审提交一次 rebuttal。

## 快速开始

### 后端

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

首次启动后需要创建管理员账号，可通过交互式脚本：

```bash
python -m app.initial_data
```

或调用 `POST /auth/bootstrap` 完成初始化。

### 前端

```bash
cd frontend
npm install
npm run dev
```

默认前端会使用 `http://localhost:8000` 作为后端地址，可通过 `.env` 文件中的 `VITE_API_URL` 自定义。

## API 维度说明

- 所有评分取值范围为 1-5。
- Confidence 表示评审人对自己评价的自信程度。
- Rebuttal 由教授账号提交，且每条评审仅允许一次 rebuttal，确保流程透明一致。

## 授权模型

- 采用 JWT Bearer Token 机制。
- `/auth/bootstrap` 仅允许无管理员时调用，用于创建首个管理员。
- `/auth/register` 需由管理员调用，可创建三种角色：管理员、评审人、教授。

## 公平性保障

- 教授在查看评审时无法看到评审人身份，实现单盲。
- 教授账号与教授实体进行一对一绑定，避免越权查看他人评审。
- Rebuttal 审批流程受限于账号关联关系，确保答辩仅针对自身课程。

## 健康检查

- `GET /health` 返回 `{ "status": "ok" }`，用于部署监控。

## 提交说明

- 当前提交仅整理了文档信息，并未对现有前后端逻辑做额外调整，便于后续直接集成或部署。
