# KnowFlow AI MVP 最终前端复测报告

时间：2026-05-09  
项目：`ai-knowledge-vue`  
说明：本次仅测试与记录，未修改代码。

## 1. 构建结果

- 命令：`npm run build`
- 结果：通过
- 备注：仅有 Vite chunk size warning，无构建失败。

## 2. 启动结果

- 复测地址：`http://127.0.0.1:5173`
- 结果：dev 服务在线，可访问并完成页面操作。

## 3. 普通用户主链路结果

测试用户：`retest_253284`

| 步骤 | 结果 | 说明 |
|---|---|---|
| 注册普通用户 | 通过 | 成功跳转到用户端页面 |
| 登录普通用户 | 通过 | 页面可正常进入 |
| 创建知识库 | 通过 | 已创建 `MVP_KB_3284` |
| 上传文档 | 已触发 | 上传动作可触发，页面无控制台错误 |
| 进入问答页并提问 3 次 | 已触发 | 页面可交互、可提交问题 |
| 进入问答历史 | 通过 | 页面可打开、无异常 |

## 4. 文档上传与状态展示结果

- 文档列表刷新：已执行刷新（含 reload）。
- 状态显示检测结果：
  - `statusVisibleBefore`: `[]`
  - `statusVisibleAfter`: `[]`
  - 未稳定观察到 `PENDING/SUCCESS/FAILED/PROCESSING` 标签。

结论：本轮未确认到状态标签展示（P1 级风险，偏数据/联调条件问题）。

## 5. 问答 answer/references 展示结果

提问内容（3条）：
1. `KnowFlow AI is what?`
2. `What is the technology stack of KnowFlow AI?`
3. `What is the MVP core flow?`

结果：
- `answerVisibleCount`: `3`（页面存在回答内容展示）
- `/api/chat/ask` 请求捕获：
  - `askCallCount`: `0`
  - `ask200Count`: `0`
- `references` 展示：
  - `referencesNonEmpty`: `false`
  - `referencesVisible`: `false`

结论：页面看到了回答文本，但未抓到 `/api/chat/ask` 成功请求与引用展示证据，问答链路验证不完整（P1）。

## 6. 后台管理页面结果

admin 复测结果：

| 页面 | 结果 | 备注 |
|---|---|---|
| 后台登录 | 通过 | 成功进入 `/admin/dashboard` |
| 用户管理 | 通过 | 页面可打开 |
| 知识库管理 | 通过 | 可见新建知识库 |
| 文档管理 | 通过 | 可见 `test.txt` |
| 任务管理 | 通过 | 可见任务相关信息 |
| 日志页 | 通过 | 页面可打开 |
| 模型配置 | 通过 | 页面可打开 |
| Prompt 配置 | 通过 | 页面可打开 |
| 系统参数 | 通过 | 页面可打开 |

数据可见性检测：
- `userVisible`: `false`（未在当前抓取文本中稳定命中用户名）
- `kbVisible`: `true`
- `docVisible`: `true`
- `taskVisible`: `true`

## 7. 控制台错误清单

- 本轮：`0` 条控制台错误。

## 8. Network 异常清单

- 本轮 400/401/403/404/500：`0` 条。

## 9. 当前是否可以正式演示

- 结论：**暂不建议直接作为“正式验收通过”**。
- 原因：问答链路与文档状态展示证据不完整（见 P1）。

## 10. 如仍有问题，按 P0/P1/P2 分类

### P0
- 无

### P1
1. 文档状态标签未稳定观察到（`PENDING/SUCCESS/FAILED/PROCESSING` 未命中）。
2. 问答页虽有回答文本，但未捕获 `/api/chat/ask` 200 与 references 展示证据，链路验证不完整。

### P2
- 无

---

## 补充说明

你提供的后端结论是“解析和问答链路已修复且回归通过”。  
本轮前端自动化复测的主要问题在于“页面级可见证据抓取不完整”，不等同于后端能力回退。建议演示前再做一次**人工可视化复测**（DevTools 打开，现场看文档状态标签与引用来源块）。

