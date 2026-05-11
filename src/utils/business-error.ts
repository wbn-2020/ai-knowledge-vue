export class BusinessError extends Error {
  bizCode?: string | number
  bizData?: any
  httpStatus?: number

  constructor(message: string, options?: { bizCode?: string | number; bizData?: any; httpStatus?: number }) {
    super(message)
    this.name = 'BusinessError'
    this.bizCode = options?.bizCode
    this.bizData = options?.bizData
    this.httpStatus = options?.httpStatus
  }
}

export function asBizCode(value: unknown): string {
  if (value === null || value === undefined) return ''
  return String(value).trim().toUpperCase()
}

export function isRagFriendlyCode(value: unknown): boolean {
  const code = asBizCode(value)
  return [
    'NO_RELEVANT_CONTEXT',
    'NO_CONTEXT',
    'KNOWLEDGE_BASE_EMPTY',
    'DOCUMENT_PROCESSING',
    'DOCUMENT_PARSE_FAILED',
    'NO_VECTOR_DATA',
    'NO_VECTOR',
  ].includes(code)
}

export function friendlyRagMessage(code: unknown, fallback?: string): string {
  const normalized = asBizCode(code)
  if (normalized === 'NO_RELEVANT_CONTEXT' || normalized === 'NO_CONTEXT') {
    return '当前知识库未找到与问题相关的内容，请上传相关文档或换个问题再试。'
  }
  if (normalized === 'KNOWLEDGE_BASE_EMPTY') {
    return '当前知识库为空，请先上传文档后再提问。'
  }
  if (normalized === 'DOCUMENT_PROCESSING') {
    return '文档正在处理中，请稍后再试。'
  }
  if (normalized === 'DOCUMENT_PARSE_FAILED') {
    return '部分文档解析失败，请修复或重新上传后再试。'
  }
  if (normalized === 'NO_VECTOR_DATA' || normalized === 'NO_VECTOR') {
    return '当前知识库暂无可用向量数据，请等待向量化完成后再试。'
  }
  return fallback || '当前暂时无法基于知识库完成回答，请稍后再试。'
}
