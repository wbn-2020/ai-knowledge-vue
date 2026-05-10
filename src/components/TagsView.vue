<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTagsViewStore, type LayoutScope } from '@/stores/tagsView'

const route = useRoute()
const router = useRouter()
const tagsStore = useTagsViewStore()

function currentLayout(): LayoutScope {
  const metaLayout = String(route.meta.layout || '')
  if (metaLayout === 'admin') return 'admin'
  if (metaLayout === 'front') return 'front'
  return String(route.path).startsWith('/admin') ? 'admin' : 'front'
}

const layoutScope = computed(() => currentLayout())
const tags = computed(() => tagsStore.getViews(layoutScope.value))

function canShow(routeLike: any) {
  const p = String(routeLike?.path || '')
  return p.startsWith('/app/') || p.startsWith('/admin/')
}

function addTag(target: any) {
  if (!canShow(target)) return
  tagsStore.addVisitedView(target)
}

function goTag(tag: { fullPath: string }) {
  if (route.fullPath === tag.fullPath) return
  router.push(tag.fullPath)
}

function closeTag(tag: { fullPath: string; affix?: boolean }) {
  if (tag.affix) return
  const list = tags.value
  const idx = list.findIndex((item) => item.fullPath === tag.fullPath)
  tagsStore.removeVisitedView(layoutScope.value, tag.fullPath)

  if (route.fullPath !== tag.fullPath) return
  const next = list[idx - 1] || list[idx + 1] || tagsStore.getViews(layoutScope.value)[0]
  if (next) router.push(next.fullPath)
}

function closeOthers() {
  tagsStore.removeOtherViews(layoutScope.value, route.fullPath)
}

function closeAll() {
  tagsStore.removeAllViews(layoutScope.value)
  const first = tagsStore.getViews(layoutScope.value)[0]
  if (first) router.push(first.fullPath)
}

watch(
  () => route.fullPath,
  () => addTag(route),
  { immediate: true },
)
</script>

<template>
  <div class="tags-view">
    <div class="tags-list">
      <el-tag
        v-for="tag in tags"
        :key="tag.fullPath"
        :closable="!tag.affix"
        :type="route.fullPath === tag.fullPath ? 'primary' : 'info'"
        effect="plain"
        class="tag-item"
        @click="goTag(tag)"
        @close="closeTag(tag)"
      >
        {{ tag.title }}
      </el-tag>
    </div>
    <div class="tag-actions">
      <el-button text size="small" @click="closeOthers">关闭其他</el-button>
      <el-button text size="small" @click="closeAll">关闭全部</el-button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.tags-view {
  height: 40px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 0 8px;
  border-bottom: 1px solid var(--color-border);
  background: #fff;
  overflow: hidden;
}

.tags-list {
  display: flex;
  align-items: center;
  gap: 8px;
  overflow-x: auto;
  overflow-y: hidden;
  min-width: 0;
  flex: 1;
}

.tag-item {
  cursor: pointer;
  white-space: nowrap;
}

.tag-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}
</style>
