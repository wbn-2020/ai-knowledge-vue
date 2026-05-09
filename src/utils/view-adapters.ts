export function textOf(value: unknown, fallback = '-'): string {
  if (value === null || value === undefined || value === '') return fallback
  return String(value)
}

export function timeOf(row: any): string {
  return textOf(row?.updatedAt || row?.updateTime || row?.createdAt || row?.createTime)
}

export function countOf(row: any, keys: string[], fallback = 0): number {
  for (const key of keys) {
    const value = row?.[key]
    if (typeof value === 'number') return value
    if (value !== undefined && value !== null && value !== '' && !Number.isNaN(Number(value))) return Number(value)
  }
  return fallback
}

export function docCountOf(row: any): number {
  return countOf(row, ['docCount', 'documentCount', 'documentsCount'])
}

export function fileSizeOf(row: any): string {
  const value = row?.size ?? row?.fileSize
  if (typeof value === 'number') {
    if (value < 1024) return `${value} B`
    if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`
    return `${(value / 1024 / 1024).toFixed(1)} MB`
  }
  return textOf(value)
}

export function fileTypeOf(row: any): string {
  const value = row?.type || row?.fileType || row?.extension
  if (value) return String(value).replace('.', '').toUpperCase()
  const name = String(row?.name || row?.fileName || row?.originalName || '')
  const ext = name.includes('.') ? name.split('.').pop() : ''
  return ext ? ext.toUpperCase() : '-'
}

export function documentNameOf(row: any): string {
  return textOf(row?.name || row?.fileName || row?.originalName, '未命名文档')
}

export function kbNameOf(row: any): string {
  return textOf(row?.knowledgeBaseName || row?.kbName || row?.knowledgeBase?.name, '未关联知识库')
}

export function normalizeRole(role: unknown): 'user' | 'assistant' {
  return String(role || '').toLowerCase() === 'user' ? 'user' : 'assistant'
}

export function unwrapList<T = any>(value: any): T[] {
  if (Array.isArray(value)) return value
  if (Array.isArray(value?.list)) return value.list
  return []
}

export function messageCountOf(row: any): number {
  return countOf(row, ['messageCount', 'messagesCount', 'messageTotal'])
}

export function referenceTitleOf(ref: any, index = 0): string {
  if (typeof ref === 'string') return ref
  return textOf(ref?.documentName || ref?.name || ref?.title, `引用 ${index + 1}`)
}

export function referenceContentOf(ref: any): string {
  if (typeof ref === 'string') return ''
  return textOf(ref?.content || ref?.summary || ref?.text, '')
}

export function referenceScoreOf(ref: any): string {
  if (typeof ref === 'string') return ''
  const value = ref?.score ?? ref?.similarity
  if (value === undefined || value === null || value === '') return ''
  const score = Number(value)
  return Number.isNaN(score) ? String(value) : score.toFixed(2)
}

export function statusTagType(status: unknown): 'success' | 'warning' | 'danger' | 'info' {
  const value = String(status || '').toUpperCase()
  if (value === 'SUCCESS' || value === 'NORMAL' || value === 'ENABLED') return 'success'
  if (value === 'FAILED' || value === 'DISABLED') return 'danger'
  if (value === 'PARSING' || value === 'PROCESSING' || value === 'PENDING') return 'warning'
  return 'info'
}

export function parseStatusText(status: unknown): string {
  const value = String(status || '').toUpperCase()
  if (value === 'PENDING') return '待解析'
  if (value === 'PARSING' || value === 'PROCESSING') return '解析中'
  if (value === 'SUCCESS') return '解析成功'
  if (value === 'FAILED') return '解析失败'
  return textOf(status)
}

export function embeddingStatusText(status: unknown): string {
  const value = String(status || '').toUpperCase()
  if (value === 'PENDING') return '待向量化'
  if (value === 'PROCESSING' || value === 'PARSING') return '向量化中'
  if (value === 'SUCCESS') return '向量化成功'
  if (value === 'FAILED') return '向量化失败'
  return textOf(status)
}

export function documentErrorOf(row: any): string {
  return textOf(row?.errorMessage || row?.failReason || row?.parseError || row?.failureReason || row?.reason, '')
}

export function isReadOf(row: any): boolean {
  const value = row?.isRead ?? row?.read ?? row?.readFlag
  if (value === 1 || value === '1') return true
  if (value === 0 || value === '0') return false
  return Boolean(value)
}

export function searchTitleOf(row: any, index = 0): string {
  return textOf(row?.documentName || row?.name || row?.title, `检索结果 ${index + 1}`)
}

export function searchContentOf(row: any): string {
  return textOf(row?.content || row?.summary || row?.text, '后端未返回片段内容')
}

export function searchScoreOf(row: any): string {
  const value = row?.score ?? row?.similarity
  if (value === undefined || value === null || value === '') return '-'
  const score = Number(value)
  return Number.isNaN(score) ? String(value) : score.toFixed(2)
}
