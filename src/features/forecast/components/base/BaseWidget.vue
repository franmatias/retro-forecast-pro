<template>
  <v-card
    class="base-widget"
    theme="dark"
    :style="{
      background: 'linear-gradient(135deg, #1E1E1E 0%, #2D2D2D 100%)'
    }"
  >
    <v-card-text>
      <div class="d-flex align-center mb-6">
        <v-icon
          color="white"
          size="32"
          class="mr-3"
        >
          {{ icon }}
        </v-icon>
        <span class="text-h6 text-white text-uppercase font-weight-medium">
          {{ title }}
        </span>
      </div>
      <slot />
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  icon: string
}>()
</script>

<style scoped>
.base-widget {
  border-radius: 24px; /* Aumentado de 16px a 24px para bordes más redondeados */
  overflow: hidden;
  min-height: 200px; /* Altura mínima para todos los widgets */
  height: 100%;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
</style>
