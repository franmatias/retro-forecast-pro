<template>
  <base-widget
    title="Recomendaciones"
    icon="mdi-umbrella"
  >
    <v-alert
      density="compact"
      type="info"
      variant="tonal"
      class="mb-2"
    >
      <div class="font-weight-bold">{{ recommendation.title }}</div>
      <div>{{ recommendation.description }}</div>
    </v-alert>
    <div class="d-flex flex-wrap mt-4">
      <v-chip
        v-for="(item, index) in items"
        :key="index"
        class="ma-1"
        :color="item.color"
        :prepend-icon="item.icon"
      >
        {{ item.label }}
      </v-chip>
    </div>
  </base-widget>
</template>

<script setup lang="ts">
import BaseWidget from './base/BaseWidget.vue'

interface RecommendedItem {
  icon: string
  label: string
  color: string
}

interface WeatherRecommendation {
  title: string
  description: string
}

defineProps<{
  recommendation: WeatherRecommendation
  items: RecommendedItem[]
}>()
</script>
