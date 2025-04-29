import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * Store para mantener el estado específico de la página de Datos Históricos
 */
export const useHistoricalStore = defineStore('historical', () => {
  // Estado
  const selectedLocationIds = ref<string[]>([]);
  const startDate = ref<string>('');
  const endDate = ref<string>('');

  // Acciones
  function setSelectedLocations(locationIds: string[]) {
    selectedLocationIds.value = locationIds;
  }
  
  function setDateRange(start: string, end: string) {
    startDate.value = start;
    endDate.value = end;
  }

  // Getters
  function hasSelectedLocations() {
    return selectedLocationIds.value.length > 0;
  }

  return {
    selectedLocationIds,
    startDate,
    endDate,
    setSelectedLocations,
    setDateRange,
    hasSelectedLocations
  }
})
