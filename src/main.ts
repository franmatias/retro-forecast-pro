/**
 * main.ts
 *
 * Archivo principal que inicializa la aplicación Vue
 */
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import App from './App.vue'
import router from './router'
import vuetify from './plugins/vuetify'

// Eliminamos la importación no utilizada
// import { useHistoricalStore } from '@/features/historical'

// Crear instancia de Pinia y añadir plugin de persistencia
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

// Crear y montar la aplicación
const app = createApp(App)
app.use(router)
app.use(pinia)
app.use(vuetify)

app.mount('#app')
