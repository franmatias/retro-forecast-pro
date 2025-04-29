<template>
  <base-widget
    v-if="alerts.length > 0"
    title="ALERTAS METEOROLÓGICAS"
    icon="mdi-alert"
  >
    <v-list>
      <v-list-item
        v-for="(alert, index) in alerts"
        :key="index"
        :title="alert.title"
        :subtitle="alert.description"
        :prepend-icon="getAlertIcon(alert.type)"
        class="text-white"
      />
    </v-list>
  </base-widget>
</template>

<script setup lang="ts">
import BaseWidget from './base/BaseWidget.vue'

interface WeatherAlert {
  title: string
  description: string
  type: string
}

defineProps<{
  alerts: WeatherAlert[]
}>()

function getAlertIcon(type: string): string {
  switch (type) {
    case 'storm':
      return 'mdi-weather-lightning'
    case 'rain':
      return 'mdi-weather-pouring'
    case 'snow':
      return 'mdi-weather-snowy'
    case 'wind':
      return 'mdi-weather-windy'
    case 'extreme':
      return 'mdi-alert-octagon'
    default:
      return 'mdi-alert'
  }
}
</script>
