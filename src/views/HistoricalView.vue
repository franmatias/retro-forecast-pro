<template>
  <v-container fluid class="historical-container">
    <historical-weather />
  </v-container>
</template>

<script setup lang="ts">
import { HistoricalWeather } from '@/features/historical';
</script>

<style scoped>
.historical-container {
  padding-top: 48px; /* Aumentado significativamente para asegurar que el título sea visible */
  padding-bottom: 24px;
  padding-left: 12px;
  padding-right: 12px;
}
</style>
