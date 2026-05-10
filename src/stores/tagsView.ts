import { defineStore } from 'pinia'

export type LayoutScope = 'front' | 'admin'

export interface VisitedTag {
  path: string
  fullPath: string
  title: string
  affix?: boolean
}

function titleOf(route: any) {
  return String(route?.meta?.title || route?.name || route?.path || 'Untitled')
}

function layoutOf(route: any): LayoutScope {
  const metaLayout = String(route?.meta?.layout || '')
  if (metaLayout === 'admin') return 'admin'
  if (metaLayout === 'front') return 'front'
  const path = String(route?.path || '')
  return path.startsWith('/admin') ? 'admin' : 'front'
}

function isAffixRoute(route: any) {
  const path = String(route?.path || '')
  return Boolean(route?.meta?.affix) || path === '/app/dashboard' || path === '/admin/dashboard'
}

function normalizeTaskDetailTag(route: any) {
  const path = String(route?.path || '')
  const fullPath = String(route?.fullPath || path)
  const match = path.match(/^\/admin\/tasks\/(.+)$/)
  if (!match) {
    return {
      path,
      fullPath,
      title: titleOf(route),
    }
  }
  const id = Number(match[1])
  if (!Number.isFinite(id) || id <= 0) {
    return {
      path: '/admin/tasks',
      fullPath: '/admin/tasks',
      title: '任务管理',
    }
  }
  return {
    path,
    fullPath,
    title: `任务详情 #${id}`,
  }
}

export const useTagsViewStore = defineStore('tagsView', {
  state: () => ({
    visitedViewsMap: {
      front: [] as VisitedTag[],
      admin: [] as VisitedTag[],
    },
  }),
  getters: {
    frontVisitedViews: (state) => state.visitedViewsMap.front,
    adminVisitedViews: (state) => state.visitedViewsMap.admin,
  },
  actions: {
    getViews(layout: LayoutScope) {
      return this.visitedViewsMap[layout]
    },
    addVisitedView(route: any) {
      const layout = layoutOf(route)
      const normalized = normalizeTaskDetailTag(route)
      const fullPath = normalized.fullPath
      if (!fullPath) return
      const list = this.visitedViewsMap[layout]
      if (list.some((item) => item.fullPath === fullPath)) return
      list.push({
        path: normalized.path,
        fullPath,
        title: normalized.title,
        affix: isAffixRoute(route),
      })
    },
    removeVisitedView(layout: LayoutScope, fullPath: string) {
      this.visitedViewsMap[layout] = this.visitedViewsMap[layout].filter((item) => item.fullPath !== fullPath)
    },
    removeOtherViews(layout: LayoutScope, fullPath: string) {
      this.visitedViewsMap[layout] = this.visitedViewsMap[layout].filter((item) => item.affix || item.fullPath === fullPath)
    },
    removeAllViews(layout: LayoutScope) {
      this.visitedViewsMap[layout] = this.visitedViewsMap[layout].filter((item) => item.affix)
    },
    ensureAffix(route: any) {
      if (!isAffixRoute(route)) return
      const layout = layoutOf(route)
      const fullPath = String(route?.fullPath || route?.path || '')
      if (!fullPath) return
      const list = this.visitedViewsMap[layout]
      if (list.some((item) => item.fullPath === fullPath)) return
      list.unshift({
        path: String(route?.path || fullPath),
        fullPath,
        title: titleOf(route),
        affix: true,
      })
    },
  },
})
