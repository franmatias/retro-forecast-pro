<template>
  <v-container fluid class="location-container">
    <LocationsMaps />
  </v-container>
</template>

<script setup lang="ts">
import LocationsMaps from '@/features/locations/components/LocationsMaps.vue'
</script>

<style scoped>
.location-container {
  padding-top: 48px; /* Aumentado de 24px a 48px para que el título sea completamente visible */
  padding-bottom: 24px;
  padding-left: 12px;
  padding-right: 12px;
}
</style>
