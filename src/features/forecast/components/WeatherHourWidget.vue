<template>
  <base-widget
    title="Próximas 24 horas"
    icon="mdi-clock-outline"
  >
    <div class="d-flex align-center mb-4">
      <div class="text-subtitle-1">
        {{ formattedDate }}
      </div>
      <v-spacer />
      <div class="text-body-2">
        Máx: {{ maxTemp }}°C | Mín: {{ minTemp }}°C
      </div>
    </div>

    <div class="weather-timeline">
      <div 
        v-for="(forecast, index) in hourlyForecast"
        :key="index"
        class="weather-hour"
      >
        <div class="text-caption">{{ forecast.hour }}h</div>
        <v-icon 
          :icon="getWeatherIcon(forecast.weatherCode)"
          :color="isNightHour(forecast.hour) ? 'blue-grey' : 'amber'"
          size="24"
        />
        <div class="text-body-2">{{ forecast.temp }}°</div>
      </div>
    </div>
  </base-widget>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { getWeatherIcon } from '@/services/weather'
import BaseWidget from './base/BaseWidget.vue'

interface HourlyForecast {
  hour: number
  temp: number
  weatherCode: number
}

const props = defineProps<{
  date: Date
  maxTemp: number
  minTemp: number
  hourlyForecast: HourlyForecast[]
  sunsetHour: number
  sunriseHour: number
}>()

const formattedDate = computed(() => {
  return props.date.toLocaleDateString('es', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  })
})

function isNightHour(hour: number): boolean {
  return hour < props.sunriseHour || hour >= props.sunsetHour
}
</script>

<style scoped>
.weather-timeline {
  display: flex;
  overflow-x: auto;
  gap: 16px;
  padding: 8px 0;
}

.weather-hour {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 48px;
  text-align: center;
}

/* Estilizar la barra de desplazamiento */
.weather-timeline::-webkit-scrollbar {
  height: 6px;
}

.weather-timeline::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

.weather-timeline::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
}

.weather-timeline::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}
</style>
