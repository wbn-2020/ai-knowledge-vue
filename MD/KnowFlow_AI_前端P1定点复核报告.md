# KnowFlow AI 前端 P1 定点复核报告

时间：2026-05-09  
项目：`ai-knowledge-vue`  
范围：仅复核 3 个 P1 问题，**未修改任何代码**

---

## P1-1 知识库详情页 `/app/knowledge/:id` 控制台错误复核

### 1) 复现步骤
1. 登录普通用户（`mvp_user_170400`）。
2. 打开知识库详情页路由（本次环境中命中为 `/app/knowledge/undefined`，由前置数据缺失触发）。
3. 观察 Console / Runtime error 与 Network 请求。

### 2) 实际结果
- 复现到 1 条运行时错误（`pageerror`）。
- 页面请求了异常 URL：`/api/knowledge-bases/NaN/detail`。
- 后端响应体是业务 `code=500`（HTTP 状态仍是 200）。

### 3) 控制台错误完整堆栈
```text
Error: 绯荤粺閿欒
    at request.interceptors.response.use.status (http://127.0.0.1:5173/src/api/request.ts:25:29)
    at async Axios.request (http://127.0.0.1:5173/node_modules/.vite/deps/axios.js?v=587b817b:2646:14)
    at async loadDetail (http://127.0.0.1:5173/src/views/app/KnowledgeBaseDetailView.vue:24:22)
    at async Promise.all (index 0)
    at async refreshAll (http://127.0.0.1:5173/src/views/app/KnowledgeBaseDetailView.vue:49:7)
```

### 4) Network 请求/响应摘要
- `GET http://127.0.0.1:5173/api/knowledge-bases/NaN/detail`
  - HTTP: `200`
  - Body: `{"code":500,"message":"系统错误","data":null}`

### 5) 是否影响演示
- **有影响（P1）**：当路由参数异常时会出现错误，影响稳定性和观感。
- 但在“有效 knowledgeBaseId”前提下，主链路不一定阻断。

### 6) 修复建议（不改代码，仅建议）
- 建议检查并加固：[src/views/app/KnowledgeBaseDetailView.vue](/C:/codex-project/ai-knowledge-vue/src/views/app/KnowledgeBaseDetailView.vue)
  - 对 `route.params.id` 做 `Number.isFinite` 校验。
  - 非法 id 时提前返回并展示“无效知识库”状态，避免请求 `NaN`。

---

## P1-2 文档上传后状态展示复核（PENDING/SUCCESS/FAILED）

### 1) 复现步骤
1. 登录普通用户。
2. 进入 `/app/documents`。
3. 上传 `test.txt`（本地测试文件）。
4. 观察列表状态文本，再刷新页面后再次观察。
5. 查看 Network 中 `/api/documents` 返回字段。

### 2) 实际结果
- 本次未观察到状态标签文本（`PENDING/SUCCESS/FAILED`）。
- 上传后与刷新后，文档列表仍为空。

### 3) 控制台错误完整堆栈
- 本项未捕获新增控制台错误堆栈。

### 4) Network 请求/响应摘要
1. `GET /api/documents?keyword=&parseStatus=&embeddingStatus=&pageNo=1&pageSize=10`
   - HTTP: `200`
   - Body: `{"code":0,"message":"ok","data":{"list":[],"total":0,"pageNo":1,"pageSize":10}}`
2. 刷新后同请求同结果，`list` 仍为空。

补充：
- 本轮尝试通过接口预置测试数据时：
  - `POST /api/knowledge-bases` 返回 `404`
  - `POST /api/documents/upload` 返回 `404`
- 因为无法可靠预置“有文档数据”的真实知识库，导致状态展示无法完整验证到。

### 5) 是否影响演示
- **有影响（P1）**：文档上传后若列表无数据，无法向演示观众说明解析状态流转。

### 6) 修复建议（不改代码，仅建议）
- 前端建议优先核对文档上传入口与知识库绑定逻辑文件：
  - [src/views/app/DocumentManageView.vue](/C:/codex-project/ai-knowledge-vue/src/views/app/DocumentManageView.vue)
  - [src/views/app/KnowledgeBaseDetailView.vue](/C:/codex-project/ai-knowledge-vue/src/views/app/KnowledgeBaseDetailView.vue)
- 后端侧需确认当前账号是否具备可写知识库、以及 `POST /api/knowledge-bases`、`POST /api/documents/upload` 在该账号下可用。

---

## P1-3 智能问答页复核（answer + references）

### 1) 复现步骤
1. 登录普通用户。
2. 进入 `/app/chat`。
3. 尝试选择知识库并提交问题。
4. 观察 `/api/chat/ask` 是否返回 200。
5. 检查 answer 展示与 references 区域展示。

### 2) 实际结果
- `/api/knowledge-bases` 返回可选知识库仅 1 个，且 `documentCount=0`。
- 本轮未捕获到 `/api/chat/ask` 请求 200（`ask200=false`）。
- 页面可见问答区域文本，但 references 区域未检测到“空引用提示”或来源展示。

### 3) 控制台错误完整堆栈
- 本项未捕获新增控制台错误堆栈。

### 4) Network 请求/响应摘要
- `GET /api/knowledge-bases?pageNo=1&pageSize=100&sortBy=updateTime`
  - HTTP: `200`
  - Body 摘要：仅默认知识库，`documentCount: 0`
- 未抓到 `POST /api/chat/ask` 的 200 成功记录（本次环境条件下）。

### 5) 是否影响演示
- **有影响（P1）**：当知识库无可用文档时，问答核心链路无法稳定演示“answer + references”。

### 6) 修复建议（不改代码，仅建议）
- 前端建议检查：
  - [src/views/app/ChatView.vue](/C:/codex-project/ai-knowledge-vue/src/views/app/ChatView.vue)
    - 在 references 为空时明确展示“暂无引用”占位文案。
    - 在未选知识库或知识库无可用文档时给出明确阻断提示。
- 后端/数据侧建议：
  - 准备至少 1 个 `documentCount > 0` 且可问答的测试知识库用于联调演示。

---

## 总结结论

1. 已按要求完成 3 个 P1 的定点复核，并记录了控制台堆栈与 Network 摘要。  
2. 当前主要风险不在“页面打不开”，而在“演示数据条件不足”导致的链路不稳定：  
   - 详情页参数异常会触发错误；  
   - 文档列表未出现上传结果；  
   - 问答未稳定命中 `chat/ask 200` 与 references 展示。  
3. 本次仅复核与记录，**未修改任何代码**。

