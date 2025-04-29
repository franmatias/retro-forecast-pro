import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * Define la estructura de una ubicación mejorada para la interfaz de usuario
 */
export interface EnhancedLocation {
  id: string;
  name: string;
  location: string;
  latitude: number;
  longitude: number;
  country: string;
}

/**
 * Store para mantener el estado específico de la página de Dashboard
 */
export const useDashboardStore = defineStore('dashboard', () => {
  // Estado
  const selectedLocationId = ref<EnhancedLocation | null>(null);
  const mapType = ref<string>('temp');
  
  // Acciones
  function setSelectedLocation(location: EnhancedLocation | null) {
    selectedLocationId.value = location;
  }
  
  function setMapType(type: string) {
    mapType.value = type;
  }

  return {
    selectedLocationId,
    mapType,
    setSelectedLocation,
    setMapType
  }
})
