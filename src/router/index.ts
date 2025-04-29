/**
 * router/index.ts
 *
 * Automatic routes for `./src/pages/*.vue`
 */

// Composables
import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

import LocalizacionView from '@/views/LocationView.vue'
import ForecastView from '@/views/ForecastView.vue'
import HistoricalView from '@/views/HistoricalView.vue'
import AboutView from '@/views/AboutView.vue'
import AnalysisView from '@/views/AnalysisView.vue'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'Localizacion',
    component: LocalizacionView
  },
  {
    path: '/historical',
    name: 'Historical',
    component: HistoricalView
  },
  {
    path: '/forecast',
    name: 'Forecast',
    component: ForecastView
  },
  {
    path: '/analysis',
    name: 'Analysis',
    component: AnalysisView
  },
  {
    path: '/about',
    name: 'About',
    component: AboutView
  },

]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
