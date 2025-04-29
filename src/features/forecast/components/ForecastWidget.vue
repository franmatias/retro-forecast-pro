<template>
  <base-widget
    title="Pronóstico"
    icon="mdi-calendar-clock"
  >
    <div class="forecast-container">
      <div 
        v-for="(forecast, i) in forecasts" 
        :key="i"
        class="forecast-item"
      >
        <v-hover v-slot="{ isHovering, props }">
          <v-card
            v-bind="props"
            :elevation="isHovering ? 4 : 0"
            class="ma-2 rounded-lg"
            height="100%"
            theme="dark"
            :style="{
              background: 'linear-gradient(135deg, #2D2D2D 0%, #1E1E1E 100%)'
            }"
          >
            <v-card-text class="text-center py-3">
              <div class="text-subtitle-2 font-weight-bold mb-1 text-white">
                {{ formatDay(forecast.day) }}
              </div>
              <v-icon 
                size="40" 
                :color="forecast.color"
                class="my-1"
              >
                {{ forecast.icon }}
              </v-icon>
              <div class="d-flex justify-center align-center">
                <span class="text-h6 font-weight-bold mr-2 text-white">{{ forecast.temp }}°</span>
                <span class="text-body-2 text-grey">{{ forecast.tempMin }}°</span>
              </div>
              <v-divider class="my-1" color="rgba(255, 255, 255, 0.1)" />
              <div class="d-flex justify-space-around text-caption text-white-darken-2">
                <div>
                  <v-icon size="16" color="white">mdi-weather-pouring</v-icon> {{ forecast.rain }}mm
                </div>
                <div>
                  <v-icon size="16" color="white">mdi-weather-windy</v-icon> {{ forecast.wind }}km/h
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-hover>
      </div>
    </div>
  </base-widget>
</template>

<script setup lang="ts">
import BaseWidget from './base/BaseWidget.vue'

interface Forecast {
  day: string
  temp: number
  tempMin: number
  icon: string
  color: string
  wind: number
  rain: number
}

function formatDay(dateStr: string): string {
  const date = new Date(dateStr)
  const day = date.getDate()
  const weekDay = date.toLocaleDateString('es', { weekday: 'short' })
  return `${weekDay} ${day}`
}

defineProps<{
  forecasts: Forecast[]
}>()
</script>

<style scoped>
.forecast-container {
  display: flex;
  flex-wrap: wrap;
  margin: 0 -8px;
}

.forecast-item {
  flex: 1 1 calc(100% / 7);
  min-width: 120px;
  padding: 0 8px;
  margin-bottom: 16px;
}

@media (max-width: 600px) {
  .forecast-item {
    flex: 1 1 100%;
  }
}

@media (min-width: 601px) and (max-width: 960px) {
  .forecast-item {
    flex: 1 1 50%;
  }
}

@media (min-width: 961px) and (max-width: 1264px) {
  .forecast-item {
    flex: 1 1 calc(100% / 4);
  }
}

@media (min-width: 1265px) {
  .forecast-item {
    flex: 1 1 calc(100% / 7);
  }
}
</style>
