<template>
  <div>
    <!-- Mostrar el widget solo si hay alertas -->
    <weather-alerts 
      v-if="hasAlerts" 
      :alerts="alertsToShow"
    />
    
    <!-- Indicador de carga -->
    <v-skeleton-loader
      v-if="loading" 
      type="card"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed, ref, watch, onUnmounted } from 'vue';
import { useAlertsStore } from '@/stores/alertsStore';
import { useLocationStore } from '@/stores/locationStore';
import WeatherAlerts from './WeatherAlerts.vue';

// Obtener los stores
const alertsStore = useAlertsStore();
const locationStore = useLocationStore();

// Estado para refrescar las alertas periódicamente
const refreshInterval = ref<number | null>(null);

// Determinar si hay alertas
const hasAlerts = computed(() => {
  return alertsStore.compatibleAlerts.length > 0;
});

// Las alertas para mostrar
const alertsToShow = computed(() => {
  return alertsStore.compatibleAlerts;
});

// Estado de carga
const loading = computed(() => {
  return alertsStore.loading;
});

// Cargar las alertas cuando cambia la ubicación
watch(() => locationStore.getSelectedLocation(), () => {
  alertsStore.fetchAlerts();
}, { deep: true });

// Configurar los refrescos periódicos y la carga inicial de alertas
onMounted(async () => {
  // Cargar alertas inmediatamente
  await alertsStore.fetchAlerts();
  
  // Refrescar cada 30 minutos
  refreshInterval.value = window.setInterval(() => {
    alertsStore.fetchAlerts(true);
  }, 30 * 60 * 1000);
});

// Limpiar el intervalo cuando se desmonte el componente
onUnmounted(() => {
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value);
  }
});
</script>
