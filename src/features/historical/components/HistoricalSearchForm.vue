<template>
  <v-row>
    <!-- Location Selection -->
    <v-col cols="12" md="6">
      <v-select
        v-model="selectedLocations"
        :items="uniqueLocations"
        item-title="name"
        item-value="uniqueId"
        label="Seleccionar ubicaciones"
        multiple
        chips
        :disabled="!hasStoredLocations"
        :hint="!hasStoredLocations ? 'No hay ubicaciones guardadas. Por favor, añade ubicaciones en la página de Localización.' : ''"
        persistent-hint
        @update:model-value="handleLocationChange"
      >
        <template #selection="{ item }">
          <v-chip>{{ item.title }}</v-chip>
        </template>
        <template #item="{ item, props }">
          <v-list-item 
            v-bind="props" 
            :title="item.raw.name"
            :subtitle="item.raw.location"
          />
        </template>
      </v-select>
    </v-col>
    <!-- Date Range Selection -->
    <v-col cols="12" md="6">
      <v-row>
        <v-col cols="6">
          <v-text-field
            v-model="startDate"
            type="date"
            label="Fecha inicio"
          />
        </v-col>
        <v-col cols="6">
          <v-text-field
            v-model="endDate"
            type="date"
            label="Fecha fin"
          />
        </v-col>
      </v-row>
    </v-col>
    <!-- Search Button -->
    <v-col cols="12" class="text-center">
      <v-btn
        color="primary"
        :loading="loading"
        :disabled="!selectedLocations.length || !startDate || !endDate"
        class="px-6"
        @click="onSearch"
      >
        <v-icon start>mdi-magnify</v-icon>
        Buscar datos históricos
      </v-btn>
      <v-btn
        v-if="error"
        color="error"
        variant="text"
        class="ml-2"
        @click="onDebug"
      >
        <v-icon>mdi-bug</v-icon>
      </v-btn>
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
import { useLocations } from '../composables/useLocations'
import { useHistoricalSelection } from '../composables/useHistoricalSelection'

// Props
defineProps({
  loading: {
    type: Boolean,
    required: true
  },
  error: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['search', 'debug']);

// Composables
const { uniqueLocations, hasStoredLocations } = useLocations();
const { selectedLocations, startDate, endDate, handleLocationChange } = useHistoricalSelection();

// Ejecutar la búsqueda
function onSearch() {
  emit('search', {
    selectedLocations: selectedLocations.value,
    startDate: startDate.value,
    endDate: endDate.value
  });
}

// Mostrar información de depuración
function onDebug() {
  emit('debug');
}
</script>
