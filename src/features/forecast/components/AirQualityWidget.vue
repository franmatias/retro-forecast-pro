<template>
  <base-widget
    title="UV y Calidad del Aire"
    icon="mdi-weather-sunny"
  >
    <div class="d-flex flex-column">
      <div class="mb-4">
        <div class="d-flex justify-space-between align-center mb-2">
          <div class="text-subtitle-1 text-white">Índice UV</div>
          <div 
            class="font-weight-bold text-white"
            :class="uvIndexColor"
          >
            {{ uvIndex }}
          </div>
        </div>
        <v-progress-linear
          :model-value="uvIndexPercentage"
          :color="uvIndexColor.split('--')[0]"
          height="10"
          rounded
        />
        <div class="text-caption text-white-darken-1 mt-1">{{ uvDescription }}</div>
      </div>
      
      <div>
        <div class="d-flex justify-space-between align-center mb-2">
          <div class="text-subtitle-1 text-white">Calidad del Aire</div>
          <div 
            class="font-weight-bold text-white"
            :class="airQualityColor"
          >
            {{ airQualityText }}
          </div>
        </div>
        <v-progress-linear
          :model-value="airQualityPercentage"
          :color="airQualityColor.split('--')[0]"
          height="10"
          rounded
        />
        <div class="text-caption text-white-darken-1 mt-1">{{ airQualityDescription }}</div>
      </div>
    </div>
  </base-widget>
</template>

<script setup lang="ts">
import BaseWidget from './base/BaseWidget.vue'

interface Props {
  uvIndex: number
  uvIndexColor: string
  uvIndexPercentage: number
  uvDescription: string
  airQualityText: string
  airQualityColor: string
  airQualityPercentage: number
  airQualityDescription: string
}

defineProps<Props>()
</script>
