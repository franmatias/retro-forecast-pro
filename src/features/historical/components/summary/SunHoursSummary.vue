<template>
  <summary-card 
    title="Resumen de horas de sol" 
    icon="mdi-white-balance-sunny" 
    icon-color="amber-darken-2"
    :location-name="locationName"
  >
    <v-row>
      <v-col cols="12" md="4" class="text-center">
        <div class="text-subtitle-1">Máximo diario</div>
        <div class="text-h4 font-weight-bold">{{ maxSunHours.toFixed(1) }} h</div>
      </v-col>
      <v-col cols="12" md="4" class="text-center">
        <div class="text-subtitle-1">Media diaria</div>
        <div class="text-h4 font-weight-bold">{{ avgSunHours.toFixed(1) }} h</div>
      </v-col>
      <v-col cols="12" md="4" class="text-center">
        <div class="text-subtitle-1">Total acumulado</div>
        <div class="text-h4 font-weight-bold">{{ totalSunHours.toFixed(0) }} h</div>
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12" class="text-center">
        <div class="text-subtitle-2 mb-2">Días soleados (> 6h de sol)</div>
        <div class="text-h5">{{ sunnyDays }} de {{ totalDays }} días</div>
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

// Cálculos específicos de horas de sol
const maxSunHours = computed(() => calculateMax(props.locationData, 'sunshine_hours'))
const avgSunHours = computed(() => calculateAverage(props.locationData, 'sunshine_hours'))
const totalSunHours = computed(() => 
  props.locationData.reduce((total, day) => total + (day.sunshine_hours || 0), 0)
)
const totalDays = computed(() => props.locationData.length)
const sunnyDays = computed(() => 
  props.locationData.filter(day => day.sunshine_hours > 6).length
)
</script>
