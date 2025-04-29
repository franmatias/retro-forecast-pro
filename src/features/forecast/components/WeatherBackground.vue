<template>
  <div 
    class="weather-background debug-background"
    :class="[`background-${currentState.background}`, `weather-${currentState.background}`]"
  >
    <div class="debug-info">
      Weather Code: {{ weatherCode }}
      Background Type: {{ currentState.background }}
    </div>
    <div class="weather-elements" aria-hidden="true">
      <!-- Elementos animados según el clima -->
      <template v-if="currentState.background === 'sunny'">
        <div class="sun" />
        <div 
          v-for="n in 5" 
          :key="n"
          class="sun-ray"
          :style="{ transform: `rotate(${n * 72}deg)` }"
        />
      </template>

      <template v-else-if="currentState.background === 'rainy'">
        <div 
          v-for="n in 20" 
          :key="n"
          class="raindrop"
          :style="{ 
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 2}s`
          }"
        />
      </template>

      <template v-else-if="currentState.background === 'cloudy'">
        <div 
          v-for="n in 5" 
          :key="n"
          class="cloud"
          :style="{ 
            left: `${n * 20}%`,
            animationDelay: `${n * 0.5}s`
          }"
        />
      </template>

      <template v-else-if="currentState.background === 'snowy'">
        <div 
          v-for="n in 30" 
          :key="n"
          class="snowflake"
          :style="{ 
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 3}s`
          }"
        />
      </template>

      <template v-else-if="currentState.background === 'stormy'">
        <div class="lightning" />
        <div 
          v-for="n in 20" 
          :key="n"
          class="raindrop storm"
          :style="{ 
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 2}s`
          }"
        />
      </template>
    </div>
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'

interface WeatherState {
  background: 'sunny' | 'rainy' | 'cloudy' | 'snowy' | 'stormy' | 'default'
  color: string
}

const weatherStates: Record<number, WeatherState> = {
  0: { background: 'sunny', color: '#FFB300' },      // Clear sky
  1: { background: 'sunny', color: '#FFB300' },      // Mainly clear
  2: { background: 'cloudy', color: '#90A4AE' },     // Partly cloudy
  3: { background: 'cloudy', color: '#78909C' },     // Overcast
  45: { background: 'cloudy', color: '#78909C' },    // Foggy
  48: { background: 'cloudy', color: '#78909C' },    // Rime fog
  51: { background: 'rainy', color: '#64B5F6' },     // Light drizzle
  53: { background: 'rainy', color: '#42A5F5' },     // Moderate drizzle
  55: { background: 'rainy', color: '#2196F3' },     // Dense drizzle
  61: { background: 'rainy', color: '#64B5F6' },     // Slight rain
  63: { background: 'rainy', color: '#42A5F5' },     // Moderate rain
  65: { background: 'rainy', color: '#2196F3' },     // Heavy rain
  71: { background: 'snowy', color: '#E0E0E0' },     // Slight snow
  73: { background: 'snowy', color: '#EEEEEE' },     // Moderate snow
  75: { background: 'snowy', color: '#F5F5F5' },     // Heavy snow
  95: { background: 'stormy', color: '#5C6BC0' },    // Thunderstorm
  96: { background: 'stormy', color: '#3F51B5' },    // Thunderstorm with hail
  99: { background: 'stormy', color: '#303F9F' }     // Heavy thunderstorm
}

const props = defineProps<{
  weatherCode: number
}>()

const currentState = computed(() => {
  return weatherStates[props.weatherCode] || { background: 'default', color: '#424242' }
})

// Añadir watch para debugging
watch(() => props.weatherCode, (newCode) => {
  console.log('WeatherBackground - Weather Code:', newCode)
  console.log('WeatherBackground - Current State:', weatherStates[newCode])
})
</script>

<style scoped>
.weather-background {
  position: relative;
  min-height: 200px;
  overflow: hidden;
  transition: background-color 0.5s ease;
}

.weather-elements {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

/* Fondos */
.background-sunny { background: linear-gradient(to bottom, #FFB300, #FFF176); }
.background-rainy { background: linear-gradient(to bottom, #78909C, #546E7A); }
.background-cloudy { background: linear-gradient(to bottom, #90A4AE, #78909C); }
.background-snowy { background: linear-gradient(to bottom, #ECEFF1, #CFD8DC); }
.background-stormy { background: linear-gradient(to bottom, #455A64, #263238); }
.background-default { background: linear-gradient(to bottom, #424242, #212121); }

/* Sol y rayos */
.sun {
  position: absolute;
  top: 20%;
  left: 50%;
  width: 60px;
  height: 60px;
  background: #FFB300;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  box-shadow: 0 0 50px #FFB300;
  animation: pulse 2s ease-in-out infinite;
}

.sun-ray {
  position: absolute;
  top: 20%;
  left: 50%;
  width: 100px;
  height: 2px;
  background: rgba(255, 179, 0, 0.3);
  transform-origin: 0 0;
  animation: rotate 20s linear infinite;
}

/* Lluvia */
.raindrop {
  position: absolute;
  width: 2px;
  height: 20px;
  background: linear-gradient(to bottom, transparent, #64B5F6);
  animation: rain 1s linear infinite;
}

.raindrop.storm {
  animation-duration: 0.7s;
}

/* Nubes */
.cloud {
  position: absolute;
  width: 100px;
  height: 40px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 20px;
  animation: float 10s linear infinite;
}

.cloud::before,
.cloud::after {
  content: '';
  position: absolute;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 50%;
}

.cloud::before {
  width: 50px;
  height: 50px;
  top: -20px;
  left: 15px;
}

.cloud::after {
  width: 30px;
  height: 30px;
  top: -10px;
  left: 45px;
}

/* Nieve */
.snowflake {
  position: absolute;
  width: 8px;
  height: 8px;
  background: white;
  border-radius: 50%;
  animation: snow 3s linear infinite;
}

/* Relámpago */
.lightning {
  position: absolute;
  top: 20%;
  left: 50%;
  width: 4px;
  height: 100px;
  background: #FFF176;
  animation: lightning 3s infinite;
}

/* Animaciones */
@keyframes pulse {
  0%, 100% { transform: translate(-50%, -50%) scale(1); }
  50% { transform: translate(-50%, -50%) scale(1.1); }
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes rain {
  0% { transform: translateY(-100%) rotate(20deg); opacity: 0; }
  25% { opacity: 1; }
  100% { transform: translateY(1000%) rotate(20deg); opacity: 0; }
}

@keyframes float {
  0% { transform: translateX(-100%); opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { transform: translateX(100%); opacity: 0; }
}

@keyframes snow {
  0% { transform: translateY(-100%) rotate(0deg); opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { transform: translateY(1000%) rotate(360deg); opacity: 0; }
}

@keyframes lightning {
  0%, 85% { opacity: 0; transform: translateX(-50%) scaleY(1); }
  90% { opacity: 1; transform: translateX(-50%) scaleY(1.2); }
  95% { opacity: 0; transform: translateX(-50%) scaleY(1); }
  100% { opacity: 0; transform: translateX(-50%) scaleY(1); }
}

.debug-background {
  background-color: rgba(255, 0, 0, 0.1) !important; /* Color rojo semitransparente para debugging */
}

.debug-info {
  position: fixed;
  top: 10px;
  right: 10px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 10px;
  border-radius: 4px;
  font-family: monospace;
  z-index: 1000;
}
</style>
