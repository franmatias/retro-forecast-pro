<template>
  <v-card
    class="wind-widget"
  >
    <v-card-title class="d-flex align-center">
      <v-icon
        start
        class="me-2"
      >
        mdi-weather-windy
      </v-icon>
      Viento
    </v-card-title>
    <v-card-text class="d-flex flex-column align-center">
      <!-- Wind speed and direction information - ahora juntos -->
      <div class="wind-info d-flex align-center justify-center mb-4">
        <div class="text-h4">
          {{ speed }} <span class="text-body-1">km/h</span>
        </div>
        <v-divider
          vertical
          class="mx-4"
          style="height: 36px;"
        />
        <div class="d-flex flex-column align-center">
          <div class="text-subtitle-1 font-weight-bold">
            {{ direction }}
          </div>
          <div class="text-caption text-medium-emphasis">
            {{ degrees }}°
          </div>
        </div>
      </div>
      
      <!-- Wind direction dial -->
      <div class="wind-dial-container">
        <div class="wind-dial">
          <!-- Compass circle and markings -->
          <div class="compass-circle">
            <div class="compass-center" />
          </div>
          
          <!-- Cardinal points -->
          <div class="cardinal-points-container">
            <div class="cardinal-point north">
              N
            </div>
            <div class="cardinal-point east">
              E
            </div>
            <div class="cardinal-point south">
              S
            </div>
            <div class="cardinal-point west">
              O
            </div>
          </div>
          
          <!-- Direction markers -->
          <div
            v-for="degree in [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330]"
            :key="degree"
            class="direction-marker"
            :class="{'major-marker': degree % 90 === 0}"
            :style="`transform: rotate(${degree}deg) translateY(-90px)`"
          />
          
          <!-- Wind direction pointer -->
          <div
            class="direction-pointer"
            :style="`transform: rotate(${degrees}deg)`"
          >
            <div class="pointer-arrow" />
          </div>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
defineProps<{
  speed: number;
  degrees: number;
  direction: string;
}>();
</script>

<style scoped>
.wind-widget {
  height: 100%;
}

.wind-dial-container {
  width: 100%;
  display: flex;
  justify-content: center;
  padding: 10px 0;
  box-sizing: border-box;
}

.wind-dial {
  position: relative;
  width: 240px; /* Tamaño cuadrado */
  height: 240px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.compass-circle {
  position: absolute;
  width: 200px;
  height: 200px;
  border-radius: 50%;
  border: 3px solid rgba(0, 0, 0, 0.15);
  box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.1), 0 0 15px rgba(0, 0, 0, 0.05);
  background: radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(240,240,240,0.5) 100%);
}

.compass-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: #1976d2;
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.3);
  z-index: 2;
}

.cardinal-points-container {
  position: absolute;
  width: 240px;
  height: 240px;
  top: 0;
  left: 0;
}

.cardinal-point {
  position: absolute;
  font-weight: bold;
  font-size: 18px;
  text-shadow: 1px 1px 2px rgba(255,255,255,0.8);
  z-index: 2;
  padding: 0 4px;
  border-radius: 4px;
}

.north {
  top: -15px; /* Acercado al círculo */
  left: 50%;
  transform: translateX(-50%);
  color: #e53935; /* Rojo más elegante */
  font-size: 20px; /* Norte más grande */
  font-weight: 700;
}

.east {
  right: -12px; /* Acercado al círculo */
  top: 50%;
  transform: translateY(-50%);
  color: #1976d2; /* Azul para Este */
}

.south {
  bottom: -15px; /* Acercado al círculo */
  left: 50%;
  transform: translateX(-50%);
  color: #43a047; /* Verde para Sur */
}

.west {
  left: -12px; /* Acercado al círculo */
  top: 50%;
  transform: translateY(-50%);
  color: #ff9800; /* Naranja para Oeste */
}

.direction-marker {
  position: absolute;
  width: 2px;
  height: 8px;
  background-color: rgba(0, 0, 0, 0.4);
  top: 50%;
  left: 50%;
  transform-origin: center center;
}

.major-marker {
  width: 3px;
  height: 12px;
  background-color: rgba(0, 0, 0, 0.6);
}

.direction-pointer {
  position: absolute;
  width: 6px;
  height: 100px;
  transform-origin: center center;
  display: flex;
  justify-content: center;
  transition: transform 1s ease-in-out;
  z-index: 3;
}

.pointer-arrow {
  width: 0;
  height: 0;
  border-left: 10px solid transparent;
  border-right: 10px solid transparent;
  border-bottom: 85px solid rgba(220, 53, 69, 0.9); /* Rojo más contrastado */
  position: absolute;
  top: 0;
  filter: drop-shadow(0 2px 3px rgba(0,0,0,0.2));
}

/* Responsiveness */
@media (max-width: 600px) {
  .wind-dial {
    width: 200px;
    height: 200px;
  }
  
  .compass-circle {
    width: 170px;
    height: 170px;
  }
  
  .cardinal-points-container {
    width: 200px;
    height: 200px;
  }
  
  .direction-marker {
    height: 6px;
  }
  
  .major-marker {
    height: 10px;
  }
  
  .north {
    top: -20px;
  }
  
  .south {
    bottom: -20px;
  }
  
  .east {
    right: -18px;
  }
  
  .west {
    left: -18px;
  }
}

/* Compatibilidad con tema claro/oscuro */
:deep(.v-theme--dark) .compass-circle {
  border-color: rgba(255, 255, 255, 0.25);
  background: radial-gradient(circle, rgba(50,50,50,0.8) 0%, rgba(30,30,30,0.5) 100%);
  box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.5), 0 0 15px rgba(255, 255, 255, 0.05);
}

:deep(.v-theme--dark) .direction-marker {
  background-color: rgba(255, 255, 255, 0.5);
}

:deep(.v-theme--dark) .major-marker {
  background-color: rgba(255, 255, 255, 0.7);
}

:deep(.v-theme--dark) .compass-center {
  background-color: #64B5F6;
}

:deep(.v-theme--dark) .cardinal-point {
  text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
}

.wind-info {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}
</style>
