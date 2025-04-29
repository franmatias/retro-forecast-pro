<template>
  <summary-card 
    title="Resumen de viento" 
    icon="mdi-weather-windy" 
    icon-color="blue-grey-darken-1"
    :subtitle="locationName"
  >
    <v-row>
      <v-col cols="12" md="4" class="text-center">
        <div class="text-subtitle-1">Velocidad máxima</div>
        <div class="text-h4 font-weight-bold">{{ maxWindSpeed.toFixed(1) }} km/h</div>
      </v-col>
      <v-col cols="12" md="4" class="text-center">
        <div class="text-subtitle-1">Velocidad media</div>
        <div class="text-h4 font-weight-bold">{{ avgWindSpeed.toFixed(1) }} km/h</div>
      </v-col>
      <v-col cols="12" md="4" class="text-center">
        <div class="text-subtitle-1">Dirección predominante</div>
        <div class="text-h4 font-weight-bold">{{ dominantDirection }}</div>
      </v-col>
    </v-row>
  </summary-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import SummaryCard from './SummaryCard.vue'
import { useSummaryStatistics } from '../../composables/useSummaryStatistics'
import type { WeatherData } from '../../models'

const props = defineProps({
  locationData: {
    type: Array as () => WeatherData[],
    required: true
  },
  locationName: {
    type: String,
    required: true
  }
})

const { calculateMax, calculateAverage } = useSummaryStatistics()

// Cálculos específicos de viento
const maxWindSpeed = computed(() => calculateMax(props.locationData, 'wind_speed'))
const avgWindSpeed = computed(() => calculateAverage(props.locationData, 'wind_speed'))

// Calcular dirección predominante del viento
const dominantDirection = computed(() => {
  const directions = [
    { min: 0, max: 22.5, name: 'N' },
    { min: 22.5, max: 67.5, name: 'NE' },
    { min: 67.5, max: 112.5, name: 'E' },
    { min: 112.5, max: 157.5, name: 'SE' },
    { min: 157.5, max: 202.5, name: 'S' },
    { min: 202.5, max: 247.5, name: 'SW' },
    { min: 247.5, max: 292.5, name: 'W' },
    { min: 292.5, max: 337.5, name: 'NW' },
    { min: 337.5, max: 360, name: 'N' }
  ]
  
  // Contar las ocurrencias de cada dirección
  const counts = directions.map(() => 0)
  
  props.locationData.forEach(data => {
    const dir = data.wind_direction
    if (dir !== undefined) {
      const dirIndex = directions.findIndex(d => dir >= d.min && dir < d.max)
      if (dirIndex !== -1) {
        counts[dirIndex]++
      }
    }
  })
  
  // Encontrar la dirección más común
  const maxIndex = counts.indexOf(Math.max(...counts))
  return directions[maxIndex]?.name || 'N/A'
})
</script>
