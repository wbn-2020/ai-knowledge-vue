import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import 'element-plus/dist/index.css'
import App from './App.vue'
import router from './router'
import './styles/global.scss'
import { useAuthStore } from '@/stores/auth'
import { AUTH_EXPIRED_EVENT } from '@/constants/auth'

const app = createApp(App)

const pinia = createPinia()
app.use(pinia)
app.use(router)
app.use(ElementPlus, { locale: zhCn })

Object.entries(ElementPlusIconsVue).forEach(([name, component]) => {
  app.component(name, component)
})

window.addEventListener(AUTH_EXPIRED_EVENT, () => {
  const authStore = useAuthStore(pinia)
  authStore.forceLogout()
})

app.mount('#app')
