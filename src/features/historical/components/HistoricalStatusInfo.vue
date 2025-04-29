<template>
  <!-- Loading State -->
  <v-row v-if="loading">
    <v-col cols="12" class="text-center">
      <v-progress-circular indeterminate />
    </v-col>
  </v-row>

  <!-- Empty State -->
  <v-row v-if="!loading && !hasData">
    <v-col cols="12" class="text-center">
      <v-alert v-if="error" type="error" class="mb-4">
        {{ error }}
      </v-alert>
      <p>Selecciona ubicaciones y fechas para ver datos históricos</p>
    </v-col>
  </v-row>

  <!-- No Locations State -->
  <v-row v-if="!hasStoredLocations">
    <v-col cols="12" class="text-center">
      <v-alert type="info" class="mb-4">
        No hay ubicaciones guardadas. Por favor, añade ubicaciones en la página de Localización antes de consultar datos históricos.
      </v-alert>
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
defineProps({
  loading: Boolean,
  hasData: Boolean,
  error: String,
  hasStoredLocations: Boolean
})
</script>
