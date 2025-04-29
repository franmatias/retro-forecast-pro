<template>
  <v-container 
    fluid 
    class="forecast-container">
    <weather-forecast />
    <!-- Añadir el widget de alertas donde sea apropiado -->
    <v-col 
      cols="12" 
      md="6">
      <weather-alert-widget />
    </v-col>
  </v-container>
</template>

<script setup lang="ts">
import WeatherForecast from '@/features/forecast/components/WeatherForecast.vue'
import WeatherAlertWidget from '@/features/forecast/components/WeatherAlertWidget.vue'
</script>

<style scoped>
.forecast-container {
  padding-top: 24px;
  padding-bottom: 24px;
  padding-left: 12px;
  padding-right: 12px;
}
</style>
