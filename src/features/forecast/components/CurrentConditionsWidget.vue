<template>
  <base-widget
    title="Condiciones Actuales"
    icon="mdi-weather-partly-cloudy"
  >
    <div class="d-flex flex-column h-100">
      <div class="d-flex align-center mb-2">
        <div class="text-h3 font-weight-bold text-white">{{ temperature }}°C</div>
        <div class="ml-4">
          <div class="text-subtitle-1 text-white">{{ description }}</div>
          <div class="text-caption text-white-darken-1">Sensación térmica: {{ feelsLike }}°C</div>
        </div>
      </div>
      <v-list
        density="compact"
        bg-color="transparent"
      >
        <v-list-item
          v-for="(item, index) in items"
          :key="index"
          :prepend-icon="item.icon"
          class="text-white"
        >
          <v-list-item-title>{{ item.label }}: {{ item.value }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </div>
  </base-widget>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import BaseWidget from './base/BaseWidget.vue'

interface Props {
  temperature: number
  feelsLike: number
  humidity: number | string
  windSpeed: number
  windDirection: string
  pressure: number
  weatherIcon: string
  description: string
}

const props = defineProps<Props>()

const items = computed(() => [
  { icon: 'mdi-water-percent', label: 'Humedad', value: `${props.humidity}%` },
  { icon: 'mdi-weather-windy', label: 'Viento', value: `${props.windSpeed} km/h ${props.windDirection}` },
  { icon: 'mdi-gauge', label: 'Presión', value: `${props.pressure} hPa` }
])
</script>
