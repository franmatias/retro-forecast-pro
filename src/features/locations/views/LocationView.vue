<template>
  <v-container fluid class="location-view-container pa-0 ma-0">
    <LocationsMaps />
  </v-container>
</template>

<script setup lang="ts">
import LocationsMaps from '../components/LocationsMaps.vue'
</script>

<style scoped>
.location-view-container {
  width: 100%;
  max-width: 100%;
  padding: 0 !important;
  margin: 0 !important;
}
</style>
