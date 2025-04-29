<template>
  <summary-card 
    title="Resumen de humedad" 
    icon="mdi-water-percent" 
    icon-color="cyan-darken-2"
    :subtitle="locationName"
  >
    <v-row>
      <v-col cols="12" md="4" class="text-center">
        <div class="text-subtitle-1">Humedad máxima</div>
        <div class="text-h4 font-weight-bold">{{ maxHumidity.toFixed(1) }}%</div>
      </v-col>
      <v-col cols="12" md="4" class="text-center">
        <div class="text-subtitle-1">Humedad media</div>
        <div class="text-h4 font-weight-bold">{{ avgHumidity.toFixed(1) }}%</div>
      </v-col>
      <v-col cols="12" md="4" class="text-center">
        <div class="text-subtitle-1">Humedad mínima</div>
        <div class="text-h4 font-weight-bold">{{ minHumidity.toFixed(1) }}%</div>
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

// Cálculos específicos de humedad
const maxHumidity = computed(() => calculateMax(props.locationData, 'humidity'))
const minHumidity = computed(() => calculateMin(props.locationData, 'humidity'))
const avgHumidity = computed(() => calculateAverage(props.locationData, 'humidity'))
</script>
