<template>
  <summary-card 
    title="Resumen de temperaturas" 
    icon="mdi-thermometer" 
    icon-color="red-darken-2"
    :subtitle="locationName"
  >
    <v-row>
      <v-col cols="12" md="4" class="text-center">
        <div class="text-subtitle-1">Temperatura máxima</div>
        <div class="text-h4 font-weight-bold">{{ maxTemp.toFixed(1) }}°C</div>
      </v-col>
      <v-col cols="12" md="4" class="text-center">
        <div class="text-subtitle-1">Temperatura media</div>
        <div class="text-h4 font-weight-bold">{{ avgTemp.toFixed(1) }}°C</div>
      </v-col>
      <v-col cols="12" md="4" class="text-center">
        <div class="text-subtitle-1">Temperatura mínima</div>
        <div class="text-h4 font-weight-bold">{{ minTemp.toFixed(1) }}°C</div>
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

// Cálculos específicos de temperatura
const maxTemp = computed(() => calculateMax(props.locationData, 'temperature'))
const minTemp = computed(() => calculateMin(props.locationData, 'temperature'))
const avgTemp = computed(() => calculateAverage(props.locationData, 'temperature'))
</script>
