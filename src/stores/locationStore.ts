import { defineStore } from 'pinia'
import { ref } from 'vue'

// Interfaces
export interface StoredLocation {
  name: string;
  address: string;
  lat: number;
  lng: number;
}

/**
 * Store para gestionar las ubicaciones
 * Usa el enfoque de Composition API
 */
export const useLocationStore = defineStore('location', () => {
  // Estado con tipado explícito
  const savedLocations = ref<StoredLocation[]>([]);
  const selectedLocationId = ref<string | null>(null); // Identificador único para la ubicación seleccionada
  
  // Getters
  const getLocationCount = () => savedLocations.value.length;
  const getLocations = () => savedLocations.value;
  const getSelectedLocation = (): StoredLocation | null => {
    if (!selectedLocationId.value) return null;
    
    // Buscar por una combinación de lat/lng que sirva como ID único
    const [lat, lng] = selectedLocationId.value.split(',');
    return savedLocations.value.find(
      loc => loc.lat === parseFloat(lat) && loc.lng === parseFloat(lng)
    ) || null;
  };
  
  // Acciones
  function addLocation(location: StoredLocation): boolean {
    // Verificar si la ubicación ya existe
    const exists = savedLocations.value.some(
      loc => loc.lat === location.lat && loc.lng === location.lng
    );
    
    if (exists) {
      return false;
    }
    
    savedLocations.value.push(location);
    setSelectedLocation(location); // Automáticamente seleccionar la nueva ubicación añadida
    return true;
  }
  
  function deleteLocation(location: StoredLocation): boolean {
    const index = savedLocations.value.findIndex(
      loc => loc.lat === location.lat && loc.lng === location.lng
    );
    
    if (index > -1) {
      // Si estamos eliminando la ubicación seleccionada actualmente
      const locationId = `${location.lat},${location.lng}`;
      if (selectedLocationId.value === locationId) {
        // Si hay más ubicaciones, seleccionar otra
        if (savedLocations.value.length > 1) {
          // Seleccionar la primera ubicación que no sea la actual
          const nextLocation = savedLocations.value.find(
            loc => loc.lat !== location.lat || loc.lng !== location.lng
          );
          if (nextLocation) {
            setSelectedLocation(nextLocation);
          }
        } else {
          // Si era la última ubicación, limpiar la selección
          selectedLocationId.value = null;
        }
      }
      
      savedLocations.value.splice(index, 1);
      return true;
    }
    
    return false;
  }
  
  function clearLocations(): void {
    savedLocations.value = [];
    selectedLocationId.value = null; // Limpiar la selección
  }

  // Método para establecer la ubicación seleccionada
  function setSelectedLocation(location: StoredLocation | null): void {
    if (!location) {
      selectedLocationId.value = null;
      return;
    }
    
    selectedLocationId.value = `${location.lat},${location.lng}`;
  }

  // Retornar el estado y las acciones explícitamente
  return {
    savedLocations,
    selectedLocationId,
    getLocationCount,
    getLocations,
    getSelectedLocation,
    addLocation,
    deleteLocation,
    clearLocations,
    setSelectedLocation
  }

}, {
  // @ts-expect-error: El plugin de persistencia de pinia añade esta opción  
  persist: true
});
