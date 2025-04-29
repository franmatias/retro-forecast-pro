import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import aemetScraper, { type WeatherAlert } from '@/services/aemet-scraper';
import { useLocationStore } from './locationStore';

export const useAlertsStore = defineStore('alerts', () => {
  const alerts = ref<WeatherAlert[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const lastUpdate = ref<Date | null>(null);
  
  // Tiempo de caché: 30 minutos
  const CACHE_TIME = 30 * 60 * 1000; 
  
  // Obtener alertas filtradas por ubicación actual
  const filteredAlerts = computed(() => {
    const locationStore = useLocationStore();
    const currentLocation = locationStore.getSelectedLocation();
    
    if (!currentLocation) {
      return alerts.value;
    }
    
    // Obtener la comunidad autónoma desde la dirección
    const address = currentLocation.address || '';
    const region = extractRegion(address);
    
    if (!region) {
      return alerts.value;
    }
    
    return alerts.value.filter(alert => 
      alert.region.toLowerCase().includes(region.toLowerCase())
    );
  });
  
  // Convertir alertas al formato que espera el componente WeatherAlerts
  const compatibleAlerts = computed(() => {
    return filteredAlerts.value.map(alert => ({
      title: alert.title,
      description: alert.description,
      type: alert.type,
      level: alert.level
    }));
  });
  
  // Extraer la comunidad autónoma de la dirección
  function extractRegion(address: string): string | null {
    const regions = [
      'Andalucía', 'Aragón', 'Asturias', 'Baleares', 'Canarias',
      'Cantabria', 'Castilla-La Mancha', 'Castilla y León', 'Cataluña',
      'Extremadura', 'Galicia', 'Madrid', 'Murcia', 'Navarra',
      'País Vasco', 'La Rioja', 'Valencia', 'Ceuta', 'Melilla'
    ];
    
    for (const region of regions) {
      if (address.includes(region)) {
        return region;
      }
    }
    
    // Si no encontramos una coincidencia exacta, intentamos coincidencias parciales
    if (address.includes('Alicante') || address.includes('Castellón') || address.includes('Valencia')) {
      return 'Valencia';
    }
    
    // Si aún no hay coincidencia, devolver null
    return null;
  }
  
  // Función para cargar las alertas
  async function fetchAlerts(forceUpdate = false): Promise<void> {
    // Evitar múltiples solicitudes simultáneas
    if (loading.value) return;
    
    // Usar caché si está disponible y no ha expirado
    if (!forceUpdate && 
        lastUpdate.value && 
        (new Date().getTime() - lastUpdate.value.getTime() < CACHE_TIME)) {
      console.log('Usando alertas en caché');
      return;
    }
    
    loading.value = true;
    error.value = null;
    
    try {
      // Configurar el scraper para usar siempre datos simulados
      // Esto evita los problemas con CORS y el error 403
      aemetScraper.setUseSimulatedData(true);
      
      const newAlerts = await aemetScraper.getAlerts();
      alerts.value = newAlerts;
      lastUpdate.value = new Date();
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Error al obtener los avisos';
      console.error('Error al cargar avisos de AEMET:', e);
    } finally {
      loading.value = false;
    }
  }

  return {
    alerts,
    loading,
    error,
    lastUpdate,
    filteredAlerts,
    compatibleAlerts,
    fetchAlerts
  };
});
