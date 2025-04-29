<template>
  <base-widget
    title="Mapa Meteorológico"
    icon="mdi-map"
  >
    <div class="d-flex flex-column h-100">
      <div class="d-flex justify-end mb-4">
        <v-btn-toggle 
          v-model="localMapType"
          mandatory
        >
          <v-btn value="temp">
            <v-icon>mdi-thermometer</v-icon>
            Temperatura
          </v-btn>
          <v-btn value="rain">
            <v-icon>mdi-weather-pouring</v-icon>
            Lluvia
          </v-btn>
          <v-btn value="wind">
            <v-icon>mdi-weather-windy</v-icon>
            Viento
          </v-btn>
        </v-btn-toggle>
      </div>
      
      <div class="flex-grow-1" style="height: 450px">
        <weather-map
          :location="location"
          :map-type="localMapType"
          :weather-data="weatherData"
        />
      </div>
    </div>
  </base-widget>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import BaseWidget from './base/BaseWidget.vue'
import WeatherMap from './WeatherMap.vue'
import type { Location, WeatherData } from '@/services/weather'

interface Props {
  location: Location
  mapType: string
  weatherData: WeatherData
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:mapType', value: string): void
}>()

const localMapType = ref(props.mapType)

watch(localMapType, (newValue) => {
  emit('update:mapType', newValue)
})

watch(() => props.mapType, (newValue) => {
  localMapType.value = newValue
})
</script>
