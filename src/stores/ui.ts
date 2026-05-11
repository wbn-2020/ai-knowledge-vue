import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUiStore = defineStore('ui', () => {
  const adminCollapsed = ref(false)
  const activeWorkspace = ref('knowledge')

  function toggleAdminSidebar() {
    adminCollapsed.value = !adminCollapsed.value
  }

  function resetState() {
    adminCollapsed.value = false
    activeWorkspace.value = 'knowledge'
  }

  return { adminCollapsed, activeWorkspace, toggleAdminSidebar, resetState }
})
