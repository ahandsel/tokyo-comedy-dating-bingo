import { createApp } from 'vue'
import App from './App.vue'
import { createAppI18n, resolveInitialLocale } from './i18n'
import { safeLocalStorage } from './composables/useGameStorage'
import './style.css'

const i18n = createAppI18n(resolveInitialLocale(safeLocalStorage(), navigator))

createApp(App).use(i18n).mount('#app')
