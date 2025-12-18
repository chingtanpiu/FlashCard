
# 极简闪卡 (Flashcards App) - 前端工程与后端接入指南

## 1. 项目简介
这是一个基于 React + TypeScript + Vite 构建的移动端优先（Mobile-First）的轻量级闪卡复习应用。
- **当前状态**: 纯前端应用 (Serverless-like)，数据存储完全依赖浏览器的 `localStorage`。
- **目标**: 接入后端服务，实现用户系统、云端数据同步及多端互通。

---

## 2. 技术栈
- **核心框架**: React 18 (Hooks 风格)
- **构建工具**: Vite
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **图标库**: Lucide React
- **持久化**: LocalStorage (待替换为 API)

---

## 3. 核心功能与业务逻辑

### 3.1 闪卡管理
- **CRUD**: 支持创建、读取、更新、删除闪卡。
- **批量操作**:
    - **批量创建**: 支持一次性输入多组“问题-答案”。
    - **JSON 导入/导出**: 支持标准 JSON 格式备份。
- **冲突检测**: 前端在导入时会自动检测重复问题，并提供 UI 让用户选择（保留现有/覆盖/编辑）。

### 3.2 复习系统 (核心算法)
- **加权随机抽题**: 
    - 权重配置: `未知 (8)` > `陌生 (5)` > `可能会忘 (3)` > `熟悉 (1)`。
    - 算法位于 `components/RandomReviewModal.tsx`。
- **乐观 UI (Optimistic UI)**: 用户点击反馈时，界面立即切换下一题，后台静默更新数据，消除延迟感。

---

## 4. 项目结构说明

后端工程师请重点关注 **`types.ts`** (数据契约) 和 **`App.tsx`** (数据源头)。

```text
/
├── types.ts                # [核心] TypeScript 类型定义 (数据模型)
├── App.tsx                 # [核心] 全局状态容器，目前负责所有数据交互
├── components/             
│   ├── FlashcardItem.tsx       # 单张卡片 (UI展示)
│   ├── RandomReviewModal.tsx   # [核心] 复习模式与抽题算法
│   ├── ConflictResolverModal.tsx # 导入冲突处理逻辑
│   └── ... (其他UI组件)
└── ...
```

---

## 5. 后端接入与改造指南 (致后端工程师)

本项目目前采用纯前端架构。为了将其升级为真正的云端应用，请参考以下详细的技术规范与建议。

### 5.1 核心架构原则
1.  **UI 乐观更新 (Optimistic UI)**: 前端在用户点击“熟悉/陌生”时，**不会**等待 API 返回结果，而是直接切换下一张卡片。
    *   *后端职责*: 接口响应速度虽然不阻塞 UI，但应尽量快（<200ms），并确保数据的一致性。
2.  **胖前端，瘦后端**: 复习算法（抽题逻辑）目前保留在前端。
    *   *后端职责*: 主要负责数据的增删改查（CRUD）和持久化存储。暂时不需要在后端实现复杂的记忆曲线算法，除非为了防止作弊或实现多端进度的严格同步。

### 5.2 数据库设计建议 (Schema)
推荐使用关系型数据库 (PostgreSQL/MySQL) 或 文档型数据库 (MongoDB)。

**表结构示例 (SQL参考):**

**1. Users (用户表)**
- `id`: UUID / Int (主键)
- `username`: Varchar
- `password_hash`: Varchar
- `created_at`: Timestamp

**2. Cards (闪卡表)**
- `id`: UUID (建议使用 UUID 以避免前端临时生成的 ID 在多端冲突)
- `user_id`: ForeignKey -> Users.id (**重要**: 必须做好数据隔离)
- `question`: Text (支持长文本，建立索引以便查重)
- `answer`: Text
- `familiarity`: Varchar/Int (对应前端: `'熟悉'|'可能会忘'|'陌生'|'未知'`)
- `tags`: JSONB 或 关联表 (建议简单场景直接存 JSON 数组 `["tag1", "tag2"]`)
- `created_at`: Timestamp
- `updated_at`: Timestamp (用于后续实现增量同步)

### 5.3 API 接口规范 (RESTful)
所有接口应返回 JSON，且需在 Header 中包含鉴权 Token (如 `Authorization: Bearer <token>`)。

| 动作 | 路径 | 描述 | 请求体示例 | 响应示例 |
| :--- | :--- | :--- | :--- | :--- |
| **GET** | `/api/cards` | 获取当前用户所有卡片 | - | `[{ "id": "uuid", "question": "...", ... }]` |
| **POST** | `/api/cards` | 创建单张卡片 | `{ "question": "...", "answer": "..." }` | `{ "id": "new-uuid", "created_at": "..." }` |
| **PATCH** | `/api/cards/{id}` | 更新卡片 (状态/内容) | `{ "familiarity": "熟悉" }` | `{ "success": true, "data": { ... } }` |
| **DELETE** | `/api/cards/{id}` | 删除卡片 | - | `{ "success": true }` |
| **POST** | `/api/cards/batch` | 批量导入 (事务处理) | `[{ "question": "...", ... }, ...]` | `{ "added_count": 10, "ids": [...] }` |

**特别注意**:
*   **状态字段**: 数据库建议存 Int 枚举以节省空间，但 API 输出时最好映射回 String，或者提供文档说明映射关系。
*   **批量接口**: 导入功能可能一次发送上百条数据，请确保后端支持较大的 Body，并开启数据库事务，要么全部成功，要么全部失败。

### 5.4 关键业务流程的对接策略

#### A. 初始化数据加载 (Data Fetching)
*   **现状**: `useEffect` 也就是页面加载时读取 LocalStorage。
*   **改造**: 页面加载时调用 `GET /api/cards`。
*   **性能优化建议**: 如果卡片数量超过 2000 张，建议后端支持 **增量同步 (Sync)** 机制。
    *   *简单版*: 每次全量拉取（几千条纯文本 JSON 也就几百 KB，完全可接受）。
    *   *进阶版*: 前端请求带上 `last_updated_timestamp`，后端只返回该时间点后变化的卡片。

#### B. 导入与冲突处理 (Import Logic)
*   **现状**: 前端读取 JSON -> 前端遍历内存中的卡片查重 -> 弹窗解决冲突 -> 写入 LocalStorage。
*   **后端建议**: **保持此逻辑**。不要把查重逻辑完全丢给后端数据库（虽然数据库要有 Unique 索引兜底）。
*   **流程推荐**: 
    1. 用户上传 JSON。
    2. 前端解析，并与**已加载的云端数据**在本地对比。
    3. 用户在前端解决冲突。
    4. 前端将最终结果（无冲突的数据）调用 `POST /api/cards/batch` 写入后端。
    *理由*: 这样后端逻辑最简单，不需要处理复杂的“询问用户保留哪一个”的交互逻辑。

#### C. ID 生成策略
*   **现状**: 前端使用 `Date.now()` 生成伪 ID。
*   **改造**:
    1.  **新建卡片**: 前端发起 POST，后端生成 UUID 并返回，前端收到响应后更新本地临时 ID 为真实 UUID。
    2.  **批量导入**: 同样依赖后端返回的新 ID 列表。

### 5.5 安全与部署 (Security & Ops)
1.  **JWT**: 建议使用 JWT (Json Web Token) 进行无状态鉴权。
2.  **CORS**: 前后端分离开发时（前端 localhost:5173, 后端 localhost:3000），后端必须配置 `Access-Control-Allow-Origin`。
3.  **XSS 防护**: 虽然 React 默认转义了 HTML，但后端存入数据时仍建议做简单的清洗，防止恶意脚本注入。
4.  **环境配置**: 请在部署时提供 API Base URL，前端将通过 `import.meta.env.VITE_API_URL` 进行配置。
