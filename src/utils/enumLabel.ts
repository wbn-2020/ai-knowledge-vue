export function taskTypeLabel(value: unknown): string {
  const raw = String(value || '').trim()
  const key = raw.toUpperCase()
  const map: Record<string, string> = {
    DOCUMENT_PARSE: '文档解析',
    DOCUMENT_VECTORIZE: '文档向量化',
    DOCUMENT_EMBEDDING: '文档向量化',
    VECTORIZE: '文档向量化',
    EMBEDDING: '文档向量化',
  }
  return map[key] || raw || '-'
}

export function taskStatusLabel(value: unknown): string {
  const raw = String(value || '').trim()
  const key = raw.toUpperCase()
  const map: Record<string, string> = {
    PENDING: '待执行',
    RUNNING: '执行中',
    PROCESSING: '执行中',
    SUCCESS: '成功',
    FAILED: '失败',
  }
  return map[key] || raw || '-'
}

export function operationModuleLabel(value: unknown): string {
  const raw = String(value || '').trim()
  const key = raw.toUpperCase()
  const map: Record<string, string> = {
    DOCUMENT: '文档',
    DOCUMENT_TASK: '文档任务',
    KNOWLEDGE_BASE: '知识库',
    SYSTEM_CONFIG: '系统参数',
    PROMPT_TEMPLATE: 'Prompt 模板',
    USER: '用户',
    AI_CONFIG: 'AI 配置',
    UNKNOWN: '-',
  }
  return map[key] || raw || '-'
}

export function operationActionLabel(value: unknown): string {
  const raw = String(value || '').trim()
  const key = raw.toUpperCase()
  const map: Record<string, string> = {
    DELETE_DOCUMENT: '删除文档',
    RETRY_DOCUMENT_TASK: '重试文档任务',
    DELETE_KB: '删除知识库',
    SET_KB_STATUS: '设置知识库状态',
    SEED_TEST_DATA: '初始化测试数据',
    SAVE_SYSTEM_CONFIG: '保存系统参数',
    UPDATE_PROMPT: '修改 Prompt 模板',
    CREATE_PROMPT: '新增 Prompt 模板',
    DELETE_PROMPT: '删除 Prompt 模板',
    TEST_MODEL: '测试模型连接',
  }
  return map[key] || raw || '-'
}

export function resultLabel(value: unknown, success?: unknown): string {
  if (typeof success === 'boolean') return success ? '成功' : '失败'
  const raw = String(value || '').trim()
  const key = raw.toUpperCase()
  if (key === 'SUCCESS') return '成功'
  if (key === 'FAILED') return '失败'
  return raw || '-'
}

export function aiModelTypeLabel(value: unknown): string {
  const raw = String(value || '').trim()
  const key = raw.toUpperCase()
  const map: Record<string, string> = {
    LLM: '大语言模型',
    EMBEDDING: 'Embedding 模型',
  }
  return map[key] || raw || '-'
}
