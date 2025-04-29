<template>
  <v-card class="location-info-widget">
    <v-card-title class="d-flex align-center">
      <v-icon start class="me-2">mdi-map-marker</v-icon>
      INFORMACIÓN LOCAL
    </v-card-title>
    <v-card-text>
      <div class="location-name text-h5 mb-2">{{ location.name }}</div>
      <div class="location-details text-body-2 mb-4">
        {{ location.region }}, {{ location.country }}
      </div>
      
      <v-row>
        <v-col cols="6">
          <div class="info-label text-caption text-medium-emphasis">Latitud</div>
          <div class="info-value text-body-2">{{ formatCoordinate(location.latitude, 'N', 'S') }}</div>
        </v-col>
        <v-col cols="6">
          <div class="info-label text-caption text-medium-emphasis">Longitud</div>
          <div class="info-value text-body-2">{{ formatCoordinate(location.longitude, 'E', 'W') }}</div>
        </v-col>
      </v-row>

      <v-divider class="my-3"></v-divider>

      <v-row>
        <v-col cols="6">
          <div class="info-label text-caption text-medium-emphasis">Elevación</div>
          <div class="info-value text-body-2">{{ location.elevation || 'N/A' }} m</div>
        </v-col>
        <v-col cols="6">
          <div class="info-label text-caption text-medium-emphasis">Población</div>
          <div class="info-value text-body-2">{{ formatPopulation(location.population) }}</div>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
interface LocationInfo {
  name: string;
  country: string;
  region: string;
  latitude: number;
  longitude: number;
  elevation: number;
  population: number;
}

defineProps<{
  location: LocationInfo;
}>();

function formatCoordinate(value: number, posLabel: string, negLabel: string): string {
  const absValue = Math.abs(value);
  const degrees = Math.floor(absValue);
  const minutes = Math.floor((absValue - degrees) * 60);
  const seconds = Math.round(((absValue - degrees) * 60 - minutes) * 60);
  
  const direction = value >= 0 ? posLabel : negLabel;
  
  return `${degrees}° ${minutes}' ${seconds}" ${direction}`;
}

function formatPopulation(population: number): string {
  if (!population) return 'N/A';
  
  if (population >= 1000000) {
    return `${(population / 1000000).toFixed(1)}M`;
  }
  
  if (population >= 1000) {
    return `${(population / 1000).toFixed(1)}K`;
  }
  
  return population.toString();
}
</script>

<style scoped>
.location-info-widget {
  height: 100%;
}

.info-label {
  margin-bottom: 4px;
}

.info-value {
  font-weight: 500;
}
</style>
