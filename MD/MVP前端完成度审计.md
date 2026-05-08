# ai-knowledge-vue MVP 前端完成度审计

审计日期：2026-05-08  
审计范围：`MD/知识库PRD_V1.md`、`MD/KnowFlow_AI_Codex_Development_SOP.md`、当前 `src` 前端代码。  
结论口径：“已接真实 API”指页面通过 `src/api/request.ts` 的 axios `/api` 封装调用后端接口；本次未启动后端做联调验证。

## 1. 总体结论

当前前端的 MVP 页面骨架基本齐全，普通用户端和管理员端主路由都已配置，主要页面也大多接入了真实 API 封装。项目不是纯 mock 前端，`src/mock/data.ts` 已存在但当前页面未直接引用。

主要缺口不在“有没有页面”，而在以下几类：

1. 多个页面是“可演示 UI + API 调用”状态，但功能细节未完全达到 PRD 验收标准。
2. 一些 MVP 页面缺少后端级筛选、分页控件、状态刷新、错误态或二次确认细节。
3. 部分扩展功能已进入菜单和路由，但实际都是 `ExtensionFeatureView.vue` 占位页，MVP 应冻结或弱化展示。
4. SOP 要求的 API 契约稳定性还不够：前端使用了较多兼容字段适配，说明后端响应字段仍可能未完全固化。

## 2. 关键代码依据

| 类型 | 文件 | 现状 |
|---|---|---|
| 路由 | `src/router/index.ts` | 普通用户端 `/app/*`、后台 `/admin/*` 和扩展占位路由均已配置 |
| 请求层 | `src/api/request.ts` | axios `baseURL: '/api'`，带 token，处理 401/403 |
| 认证 API | `src/api/auth.ts` | 注册、登录、管理员登录、当前用户、资料修改、密码修改已封装 |
| 业务 API | `src/api/knowledge.ts` | 知识库、文档、问答、搜索、摘要、通知、后台管理、日志、公告均有接口封装 |
| 字段适配 | `src/utils/view-adapters.ts` | 前端兼容 `createdAt/createTime`、`docCount/documentCount` 等多套字段 |
| 占位页 | `src/views/common/ExtensionFeatureView.vue` | 扩展能力统一占位，未接真实业务 API |

## 3. 普通用户端 MVP 页面核对

| 路由 | 文件 | 页面状态 | 缺少功能 / 风险 | 已接真实 API |
|---|---|---|---|---|
| `/login` | `src/views/auth/LoginView.vue` | 基本完成 | 默认账号密码硬编码；内嵌注册没有邮箱输入；注册后 store 会持久化 token，但 UI 提示“请登录”，流程不一致 | 是：`/auth/login`、`/auth/register` |
| `/register` | `src/views/auth/RegisterView.vue` | 基本完成 | 仅校验必填和两次密码；缺少密码复杂度、用户名重复的前端提示；注册后同样会先持久化 token 再跳登录页 | 是：`/auth/register` |
| `/app/dashboard` | `src/views/app/DashboardView.vue` | 基本完成 | 快捷入口有上传、问答、通知，但缺“快速创建知识库”；页面展示了扩展入口，MVP 边界不够收敛 | 是：`/dashboard/overview` |
| `/app/knowledge` | `src/views/app/KnowledgeBaseListView.vue` | 基本完成 | 删除只有一次确认；缺状态筛选；分页只显示 prev/pager/next，不支持 pageSize；错误态不明显 | 是：`/knowledge-bases` |
| `/app/knowledge/create`、`/app/knowledge/:id/edit` | `src/views/app/KnowledgeBaseFormView.vue` | 基本完成 | 创建成功返回列表，未按 PRD 进入详情页；图标是文本输入，不是选择器；缺更完整表单规则 | 是：`POST/PUT /knowledge-bases` |
| `/app/knowledge/:id` | `src/views/app/KnowledgeBaseDetailView.vue` | 部分完成 | 只展示最近文档/最近问答，没有完整文档分页列表；“上传文档”未带入当前知识库；“基于此库提问”未预选当前知识库；缺编辑/删除入口 | 是：`/knowledge-bases/:id/detail` |
| `/app/documents` | `src/views/app/DocumentManageView.vue` | 基本完成 | 解析状态筛选是前端当前页过滤，不是后端过滤；上传区重复出现；删除一次确认；缺按知识库筛选文档列表 | 是：`/documents`、`/documents/upload` |
| `/app/documents/:id` | `src/views/app/DocumentDetailView.vue` | 基本完成 | 重新解析按钮不限制失败状态；预览只是文本接口，PDF/DOCX 在线预览属于扩展未做；缺上传人展示 | 是：详情、预览、下载、重命名、重试、删除 |
| `/app/chat` | `src/views/app/ChatView.vue` | 核心可用但需补强 | 缺问题长度限制；没有“检索中/生成中”等分阶段状态；引用不能点击查看详情；请求失败后乐观追加的用户消息不会回滚；导出/反馈/重新生成属于扩展，可能超出 MVP | 是：`/chat/ask`、会话、消息、清空、删除等 |
| `/app/history` | `src/views/app/HistoryView.vue` | 基本完成 | 搜索仅本页过滤，代码已提示后端暂未提供搜索参数；删除一次确认；缺按知识库筛选 | 是：`/chat/sessions` |
| `/app/history/:id` | `src/views/app/SessionDetailView.vue` | 基本完成 | 需要确认与 `/app/chat` 的会话详情体验是否重复；同样缺引用详情点击、分阶段状态 | 是：会话消息、继续追问、导出等 |
| `/app/search` | `src/views/app/SearchView.vue` | 部分完成 | PRD 要求文档关键词搜索支持文档名、类型、上传时间筛选；当前仅知识库 + query + topK + 语义/关键词模式 | 是：`/search/semantic`、`/search/keyword` |
| `/app/summary` | `src/views/app/KnowledgeSummaryView.vue` | 基本接入 | PRD 把“文档摘要”列为 MVP，“知识库摘要”也在 PRD MVP 小节中；当前能触发生成但缺保存摘要结果、重新生成历史状态、错误态展示 | 是：`/summaries/document`、`/summaries/knowledge-base` |
| `/app/notifications` | `src/views/app/NotificationCenterView.vue` | 已有页面 | PRD 通知属于 MVP 但第一版建议范围里优先级不如 RAG 主链路；需确认已读状态、全部已读、公告展示是否完整 | 是：通知、公告、未读数 |
| `/app/settings` | `src/views/app/SettingsView.vue` | 基本完成 | PRD 要求修改密码成功后重新登录，当前页面提示后端仍保持当前登录态；这与验收标准不一致 | 是：`/users/me`、`/users/me/password` |

## 4. 管理员端 MVP 页面核对

| 路由 | 文件 | 页面状态 | 缺少功能 / 风险 | 已接真实 API |
|---|---|---|---|---|
| `/admin/login` | `src/views/admin/AdminLoginView.vue` | 基本完成 | 默认账号密码硬编码；普通用户访问后台会跳后台登录，但未看到更细粒度菜单权限 | 是：`/admin/auth/login` |
| `/admin/dashboard` | `src/views/admin/DashboardView.vue` | 基本完成 | 看板依赖后端 overview；趋势图/排行属于扩展未做可接受 | 是：`/admin/dashboard/overview` |
| `/admin/users` | `src/views/admin/UserManageView.vue` | 部分完成 | 有分页参数但页面没有分页控件；禁用/启用无二次确认和原因；重置密码缺规则校验 | 是：用户列表、状态、重置密码 |
| `/admin/users/:id` | `src/views/admin/UserDetailView.vue` | 基本完成 | 缺用户关联知识库/文档/操作记录展示；禁用原因未填写 | 是：用户详情、状态、重置密码 |
| `/admin/knowledge-bases` | `src/views/admin/AdminKnowledgeView.vue` | 部分完成 | 有分页参数但页面没有分页控件；缺关键词/状态筛选；删除违规知识库缺处理原因 | 是：列表、状态、删除 |
| `/admin/knowledge-bases/:id` | `src/views/admin/KnowledgeDetailView.vue` | 部分完成 | 关联文档通过 `getAdminDocuments({ pageNo:1,pageSize:50 })` 拉全平台文档，未按当前知识库过滤，存在展示错误风险 | 是，但关联文档查询不完整 |
| `/admin/documents` | `src/views/admin/AdminDocumentView.vue` | 部分完成 | 有分页参数但页面没有分页控件；缺关键词、知识库、状态筛选；失败原因展示不充分 | 是：列表、详情、删除、重试 |
| `/admin/documents/:id` | `src/views/admin/DocumentDetailView.vue` | 基本完成 | 需要补上传人、完整失败原因、处理任务链路跳转 | 是 |
| `/admin/tasks` | `src/views/admin/TaskView.vue` | 部分完成 | 有分页参数但页面没有分页控件；缺状态/任务类型/文档筛选；没有失败任务重试入口 | 是：`/admin/document-tasks` |
| `/admin/tasks/:id` | `src/views/admin/TaskDetailView.vue` | 基本展示 | 只有详情和日志展示，缺失败任务管理动作 | 是 |
| `/admin/ai-models` | `src/views/admin/ModelConfigView.vue` | 部分完成 | 表单没有 API Key 字段或脱敏展示；大模型和 Embedding 配置未明显区分；缺模型参数完整配置 | 是：模型 CRUD、测试调用 |
| `/admin/prompts` | `src/views/admin/PromptView.vue` | 基本完成 | 缺 Prompt 变量校验、默认模板保护、场景绑定说明 | 是：Prompt CRUD、启停 |
| `/admin/settings` | `src/views/admin/SystemSettingView.vue` | 基本完成 | 只覆盖上传、切片、检索参数；缺系统基础配置分组和删除/恢复默认策略 | 是：系统配置读取/保存 |
| `/admin/logs` | `src/views/admin/LogView.vue` | 基本完成 | 日志查询和导出较完整；日志详情路由存在但列表没有详情入口；告警依赖 `/admin/logs/alerts` | 是：操作、登录、AI 调用日志 |
| `/admin/logs/:id` | `src/views/admin/LogDetailView.vue` | 页面存在 | 需确认是否能从日志列表进入；缺不同日志类型的详情上下文 | 不明确 |
| `/admin/announcements` | `src/views/admin/AnnouncementView.vue` | 基本完成 | 公告在 PRD 后台 MVP 页面中列出，但 SOP 认为可后置；当前 CRUD 完整度较高 | 是：公告 CRUD |

## 5. 扩展功能占位，不应算 MVP 完成

这些路由已存在，但都使用 `src/views/common/ExtensionFeatureView.vue`，页面文案也说明“后续接入后端 API 后替换 mock 数据”。它们不应计入 MVP 完成度。

普通用户端扩展占位包括：

- `/app/knowledge-share`
- `/app/knowledge-collaboration`
- `/app/knowledge-templates`
- `/app/knowledge-archive`
- `/app/document-batch-upload`
- `/app/document-preview`
- `/app/document-tags`
- `/app/document-versions`
- `/app/document-favorites`
- `/app/document-advanced-parse`
- `/app/chat-advanced`
- `/app/advanced-search`
- `/app/history-advanced`
- `/app/knowledge-tools`
- `/app/notification-advanced`
- `/app/theme-settings`

后台扩展占位包括：

- `/admin/roles`
- `/admin/token-costs`
- `/admin/queue-monitor`
- `/admin/scheduled-tasks`
- `/admin/content-review`
- `/admin/storage-stats`
- `/admin/model-routing`
- `/admin/prompt-evaluation`
- `/admin/audit-advanced`
- `/admin/announcement-advanced`

## 6. 当前最影响 MVP 验收的缺口

### P0：必须先补齐，影响主链路演示

1. **知识库详情未形成完整容器页**
   - 路由：`/app/knowledge/:id`
   - 文件：`src/views/app/KnowledgeBaseDetailView.vue`
   - 缺口：没有完整文档列表分页；上传和问答没有携带当前知识库上下文；缺编辑/删除入口。
   - 建议任务：让详情页成为“该知识库的文档、问答、状态、入口”的中心页。

2. **文档列表筛选不完整**
   - 路由：`/app/documents`
   - 文件：`src/views/app/DocumentManageView.vue`
   - 缺口：解析状态是当前页前端过滤；缺按知识库筛选；无法保证分页后筛选结果准确。
   - 建议任务：补 `knowledgeBaseId`、`parseStatus`、`embeddingStatus` 查询参数，并与后端契约对齐。

3. **问答页缺少 RAG 状态和错误恢复**
   - 路由：`/app/chat`
   - 文件：`src/views/app/ChatView.vue`
   - 缺口：只有 skeleton，没有“检索文档/生成回答/完成/失败”状态；失败后用户消息已追加但无错误提示；引用不能打开详情。
   - 建议任务：补问答状态机、错误态、引用详情入口、问题长度限制。

4. **用户设置修改密码不符合 PRD**
   - 路由：`/app/settings`
   - 文件：`src/views/app/SettingsView.vue`
   - 缺口：PRD 要求修改成功后重新登录，当前仍保留登录态。
   - 建议任务：修改密码成功后调用 logout 并跳转 `/login`，或与后端确认强制失效策略。

### P1：管理员端验收前应补齐

5. **后台列表页分页控件缺失**
   - 路由/文件：`/admin/users`、`/admin/knowledge-bases`、`/admin/documents`、`/admin/tasks`
   - 缺口：代码传了 `pageNo/pageSize`，但多数页面没有分页控件，无法翻页。
   - 建议任务：统一补 `el-pagination`，支持 pageSize，保持与日志/公告页一致。

6. **后台知识库详情关联文档过滤错误风险**
   - 路由：`/admin/knowledge-bases/:id`
   - 文件：`src/views/admin/KnowledgeDetailView.vue`
   - 缺口：关联文档查询未传当前知识库 ID，可能显示全平台前 50 个文档。
   - 建议任务：后端接口支持 `knowledgeBaseId`，前端按当前 ID 查询。

7. **后台任务管理缺失败任务操作**
   - 路由：`/admin/tasks`
   - 文件：`src/views/admin/TaskView.vue`
   - 缺口：只可查看任务，缺失败任务重试/筛选。
   - 建议任务：补状态筛选、任务类型筛选、失败任务重试入口。

8. **AI 模型配置未覆盖 API Key 安全配置**
   - 路由：`/admin/ai-models`
   - 文件：`src/views/admin/ModelConfigView.vue`
   - 缺口：没有 API Key 输入/脱敏展示；大模型与 Embedding 模型缺清晰区分。
   - 建议任务：增加 provider、modelType、apiKeySecret、endpoint、temperature、enabled 等契约字段，并由后端脱敏返回。

### P2：优化完整度和演示一致性

9. **认证表单规则不足**
   - 路由：`/login`、`/register`
   - 文件：`src/views/auth/LoginView.vue`、`src/views/auth/RegisterView.vue`
   - 缺口：密码复杂度、邮箱格式、用户名重复等提示不完整；默认账号密码应只在开发环境提示。

10. **历史会话搜索只做本页过滤**
    - 路由：`/app/history`
    - 文件：`src/views/app/HistoryView.vue`
    - 缺口：后端未提供搜索参数，跨页搜索不可用。

11. **语义搜索缺 PRD 要求的文档筛选**
    - 路由：`/app/search`
    - 文件：`src/views/app/SearchView.vue`
    - 缺口：缺文档名、文档类型、上传时间筛选。

12. **摘要结果缺保存和重新生成状态**
    - 路由：`/app/summary`
    - 文件：`src/views/app/KnowledgeSummaryView.vue`
    - 缺口：能生成但未体现“保存摘要结果”“重新生成摘要”的完整闭环。

13. **扩展功能入口过多，MVP 边界被稀释**
    - 路由：多条 `/app/*`、`/admin/*` 扩展路由
    - 文件：`src/router/index.ts`、`src/layouts/AppLayout.vue`、`src/layouts/AdminLayout.vue`
    - 缺口：大量占位页出现在菜单和工作台入口，容易被误认为已完成。

## 7. 下一步开发优先级任务清单

### 第一批：打通用户端 MVP 主闭环

1. 调整知识库详情页：增加完整文档列表、当前知识库上传入口、当前知识库问答入口、编辑/删除入口。
2. 完善文档管理页：增加知识库筛选、解析状态/向量状态后端筛选、分页准确性、失败重试状态刷新。
3. 完善问答页：增加问题长度校验、分阶段状态、失败态处理、引用详情点击、无依据回答展示。
4. 修正用户设置密码修改流程：成功后清除登录态并跳转登录页，满足 PRD 验收。

### 第二批：补齐后台 MVP 管理能力

5. 给后台用户、知识库、文档、任务列表补分页控件和常用筛选。
6. 修复后台知识库详情的关联文档查询，按知识库 ID 过滤。
7. 补任务管理的失败任务筛选和重试入口。
8. 完善 AI 模型配置字段，支持 API Key 安全输入、脱敏展示、大模型/Embedding 区分。

### 第三批：收敛 MVP 边界和体验

9. 将扩展占位页从主菜单或工作台强入口中降级，避免 MVP 验收误判。
10. 固化 `docs/04-api-contract.md` 或 `MD/后端接口清单.md` 与 `src/api/knowledge.ts` 的字段契约，减少前端兼容字段。
11. 完善历史搜索、语义搜索筛选、摘要保存等 P2 功能。
12. 做一次前后端联调验收：注册/登录 -> 创建知识库 -> 上传文档 -> 解析成功 -> 提问 -> 查看引用 -> 查看历史 -> 后台查看日志和任务。

## 8. 建议验收顺序

1. 普通用户注册、登录、退出。
2. 创建、编辑、删除知识库。
3. 在指定知识库上传 PDF/DOCX/TXT/MD。
4. 查看文档解析状态、失败原因、重新解析。
5. 基于指定知识库提问，返回回答和引用来源。
6. 查看、重命名、删除问答历史。
7. 管理员查看用户、知识库、文档、任务。
8. 管理员配置模型、Prompt、系统参数。
9. 管理员查看登录日志、操作日志、AI 调用日志。

