<template>
  <v-card
    class="additional-info-widget"
  >
    <v-card-title class="d-flex align-center">
      <v-icon
        start
        class="me-2"
      >
        mdi-information-outline
      </v-icon>
      INFORMACIÓN ADICIONAL
    </v-card-title>
    <v-card-text>
      <v-list>
        <v-list-item>
          <template #prepend>
            <v-icon color="blue">
              mdi-eye
            </v-icon>
          </template>
          <v-list-item-title>Visibilidad</v-list-item-title>
          <v-list-item-subtitle>{{ visibility }} km</v-list-item-subtitle>
        </v-list-item>

        <v-list-item>
          <template #prepend>
            <v-icon color="cyan">
              mdi-water
            </v-icon>
          </template>
          <v-list-item-title>Punto de rocío</v-list-item-title>
          <v-list-item-subtitle>{{ dewPoint }}°C</v-list-item-subtitle>
        </v-list-item>

        <v-list-item>
          <template #prepend>
            <v-icon color="grey">
              mdi-cloud
            </v-icon>
          </template>
          <v-list-item-title>Cobertura de nubes</v-list-item-title>
          <v-list-item-subtitle>{{ cloudCover }}%</v-list-item-subtitle>
        </v-list-item>

        <v-list-item>
          <template #prepend>
            <v-icon :color="getMoonPhaseIcon(moonPhase).color">
              {{ getMoonPhaseIcon(moonPhase).icon }}
            </v-icon>
          </template>
          <v-list-item-title>Fase lunar</v-list-item-title>
          <v-list-item-subtitle>{{ moonPhase }}</v-list-item-subtitle>
        </v-list-item>

        <v-list-item>
          <template #prepend>
            <v-icon :color="isDaytime ? 'amber' : 'indigo'">
              {{ isDaytime ? 'mdi-weather-sunny' : 'mdi-weather-night' }}
            </v-icon>
          </template>
          <v-list-item-title>¿Es de día?</v-list-item-title>
          <v-list-item-subtitle>{{ isDaytime ? 'Sí' : 'No' }}</v-list-item-subtitle>
        </v-list-item>
      </v-list>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
defineProps<{
  visibility: number;
  dewPoint: string | number;
  cloudCover: string | number;
  moonPhase: string;
  isDaytime: boolean;
  timezoneOffset: number; // Mantenemos la prop por compatibilidad
  sunrise: string; // Mantenemos la prop por compatibilidad
  sunset: string; // Mantenemos la prop por compatibilidad
}>();

function getMoonPhaseIcon(phase: string): { icon: string; color: string } {
  const phases = {
    'Luna nueva': { icon: 'mdi-moon-new', color: 'grey' },
    'Luna creciente': { icon: 'mdi-moon-waxing-crescent', color: 'blue-grey' },
    'Cuarto creciente': { icon: 'mdi-moon-first-quarter', color: 'cyan' },
    'Luna gibosa creciente': { icon: 'mdi-moon-waxing-gibbous', color: 'light-blue' },
    'Luna llena': { icon: 'mdi-moon-full', color: 'amber' },
    'Luna gibosa menguante': { icon: 'mdi-moon-waning-gibbous', color: 'deep-orange' },
    'Cuarto menguante': { icon: 'mdi-moon-last-quarter', color: 'orange' },
    'Luna menguante': { icon: 'mdi-moon-waning-crescent', color: 'brown' }
  };
  
  // @ts-expect-error Sabemos que phase puede no estar en el objeto
  return phases[phase] || { icon: 'mdi-moon-full', color: 'grey' };
}
</script>

<style scoped>
.additional-info-widget {
  height: 100%;
}

.v-list-item__subtitle {
  font-weight: 500;
}
</style>
