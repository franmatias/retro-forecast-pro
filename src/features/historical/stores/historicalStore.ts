import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useHistoricalStore = defineStore('historical', () => {
  // Estado
  const selectedLocationIds = ref<string[]>([])
  const startDate = ref<string>('')
  const endDate = ref<string>('')

  // Acciones
  function setSelectedLocations(locationIds: string[]) {
    selectedLocationIds.value = locationIds
  }

  function setDateRange(start: string, end: string) {
    startDate.value = start
    endDate.value = end
  }

  function hasSelectedLocations(): boolean {
    return selectedLocationIds.value.length > 0
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
