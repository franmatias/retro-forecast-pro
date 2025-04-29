<template>
  <summary-card 
    title="Resumen de precipitaciones" 
    icon="mdi-weather-pouring" 
    icon-color="blue-darken-1"
    :subtitle="locationName"
  >
    <v-row>
      <v-col cols="12" md="4" class="text-center">
        <div class="text-subtitle-1">Precipitación máxima</div>
        <div class="text-h4 font-weight-bold">{{ maxRain.toFixed(1) }} mm</div>
      </v-col>
      <v-col cols="12" md="4" class="text-center">
        <div class="text-subtitle-1">Precipitación media</div>
        <div class="text-h4 font-weight-bold">{{ avgRain.toFixed(1) }} mm</div>
      </v-col>
      <v-col cols="12" md="4" class="text-center">
        <div class="text-subtitle-1">Total acumulado</div>
        <div class="text-h4 font-weight-bold">{{ totalRain.toFixed(1) }} mm</div>
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12" class="text-center">
        <div class="text-subtitle-2 mb-2">Días con precipitación</div>
        <div class="text-h5">{{ rainyDays }} de {{ totalDays }} días</div>
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

// Cálculos específicos de lluvia
const maxRain = computed(() => calculateMax(props.locationData, 'rainfall'))
const avgRain = computed(() => calculateAverage(props.locationData, 'rainfall'))
const totalRain = computed(() => 
  props.locationData.reduce((total, day) => total + (day.rainfall || 0), 0)
)
const totalDays = computed(() => props.locationData.length)
const rainyDays = computed(() => 
  props.locationData.filter(day => day.rainfall > 0).length
)
</script>
