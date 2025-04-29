<template>
  <summary-card 
    title="Resumen de presión atmosférica" 
    icon="mdi-gauge" 
    icon-color="indigo-darken-1"
    :subtitle="locationName"
  >
    <v-row>
      <v-col cols="12" md="4" class="text-center">
        <div class="text-subtitle-1">Presión máxima</div>
        <div class="text-h4 font-weight-bold">{{ maxPressure.toFixed(0) }} hPa</div>
      </v-col>
      <v-col cols="12" md="4" class="text-center">
        <div class="text-subtitle-1">Presión media</div>
        <div class="text-h4 font-weight-bold">{{ avgPressure.toFixed(0) }} hPa</div>
      </v-col>
      <v-col cols="12" md="4" class="text-center">
        <div class="text-subtitle-1">Presión mínima</div>
        <div class="text-h4 font-weight-bold">{{ minPressure.toFixed(0) }} hPa</div>
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

const { calculateMax, calculateMin, calculateAverage } = useSummaryStatistics()

// Cálculos específicos de presión atmosférica
const maxPressure = computed(() => calculateMax(props.locationData, 'pressure'))
const minPressure = computed(() => calculateMin(props.locationData, 'pressure'))
const avgPressure = computed(() => calculateAverage(props.locationData, 'pressure'))
</script>
