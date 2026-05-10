function escapeHtml(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function renderMarkdownSafe(input: string) {
  let html = escapeHtml(input || '')
  html = html.replace(/```([a-zA-Z0-9_-]*)?\n([\s\S]*?)```/g, (_m, lang, code) => {
    const language = String(lang || '').toLowerCase().trim()
    const plainLang = new Set(['', 'text', 'txt', 'plain', 'markdown', 'md'])
    if (plainLang.has(language)) {
      // Some upstream chunks wrap normal prose with ```text fences.
      // Unwrap to normal markdown flow instead of forcing code-block style.
      return String(code || '').trim()
    }
    return `<pre><code>${String(code || '').trim()}</code></pre>`
  })
  // Drop stray fence markers that may appear in chunked content.
  html = html.replace(/^```[a-zA-Z0-9_-]*\s*$/gm, '')
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>')
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/^######\s+(.*)$/gm, '<h6>$1</h6>')
  html = html.replace(/^#####\s+(.*)$/gm, '<h5>$1</h5>')
  html = html.replace(/^####\s+(.*)$/gm, '<h4>$1</h4>')
  html = html.replace(/^###\s+(.*)$/gm, '<h3>$1</h3>')
  html = html.replace(/^##\s+(.*)$/gm, '<h2>$1</h2>')
  html = html.replace(/^#\s+(.*)$/gm, '<h1>$1</h1>')

  const lines = html.split('\n')
  const out: string[] = []
  let inUl = false
  let inOl = false
  for (const raw of lines) {
    const line = raw.trim()
    if (/^[-*]\s+/.test(line)) {
      if (!inUl) {
        if (inOl) out.push('</ol>')
        out.push('<ul>')
        inUl = true
        inOl = false
      }
      out.push(`<li>${line.replace(/^[-*]\s+/, '')}</li>`)
      continue
    }
    if (/^\d+\.\s+/.test(line)) {
      if (!inOl) {
        if (inUl) out.push('</ul>')
        out.push('<ol>')
        inOl = true
        inUl = false
      }
      out.push(`<li>${line.replace(/^\d+\.\s+/, '')}</li>`)
      continue
    }
    if (inUl) {
      out.push('</ul>')
      inUl = false
    }
    if (inOl) {
      out.push('</ol>')
      inOl = false
    }
    out.push(line ? `<p>${line}</p>` : '<br />')
  }
  if (inUl) out.push('</ul>')
  if (inOl) out.push('</ol>')
  return out.join('')
}
