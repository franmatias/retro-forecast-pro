<template>
  <v-fade-transition>
    <v-card
      :style="{
        borderLeft: `4px solid ${color}`,
        background: `linear-gradient(135deg, #1E1E1E 0%, ${adjustColorOpacity(color, 0.15)} 100%)`,
        backgroundSize: '200% 200%',
        backgroundPosition: 'center'
      }"
      class="stat-widget rounded-xl border-2 border-gray-800"
      theme="dark"
    >
      <v-card-text>
        <div class="d-flex align-center justify-space-between">
          <div>
            <div class="text-overline mb-1">{{ label }}</div>
            <div class="text-h4 mb-2">{{ value }}{{ unit }}</div>
            <div class="text-caption" v-if="subtitle">{{ subtitle }}</div>
          </div>
          <v-icon
            :color="color"
            size="48"
          >
            {{ icon }}
          </v-icon>
        </div>
      </v-card-text>
    </v-card>
  </v-fade-transition>
</template>

<script setup lang="ts">
interface Props {
  color: string
  icon: string
  value: number
  unit: string
  label: string
  subtitle?: string
  delay?: number
}

function adjustColorOpacity(color: string, opacity: number): string {
  // Para colores predefinidos de Vuetify
  const colorMap: Record<string, string> = {
    'orange': `rgba(255, 152, 0, ${opacity})`,
    'blue': `rgba(33, 150, 243, ${opacity})`,
    'light-blue': `rgba(3, 169, 44, ${opacity})`,
    'gold': `rgba(255, 215, 70, ${opacity})`
  }
  
  return colorMap[color] || color
}

defineProps<Props>()
</script>

<style scoped>
.stat-widget {
  transition: transform 0.2s, box-shadow 0.2s, background-position 0.3s ease;
}

.stat-widget:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
  background-position: right center;
}
</style>
