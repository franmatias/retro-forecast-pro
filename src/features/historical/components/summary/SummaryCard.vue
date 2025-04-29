<template>
  <v-card class="my-3">
    <v-card-title class="pb-1">
      <div class="d-flex align-center">
        <v-icon class="mr-2" :color="iconColor">{{ icon }}</v-icon>
        {{ title }}
      </div>
    </v-card-title>
    
    <v-card-subtitle v-if="subtitle" class="pt-1">
      {{ subtitle }}
    </v-card-subtitle>
    
    <v-card-text>
      <slot></slot>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
defineProps({
  title: {
    type: String,
    required: true
  },
  subtitle: {
    type: String,
    default: ''
  },
  icon: {
    type: String,
    default: 'mdi-chart-box'
  },
  iconColor: {
    type: String,
    default: 'primary'
  }
})
</script>
