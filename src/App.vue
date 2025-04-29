<template>
  <v-app>
    <v-app-bar>
      <v-app-bar-nav-icon
        class="d-md-none"
        @click="drawer = !drawer"
      />
      
      <v-toolbar-title>Retro Forecast Pro</v-toolbar-title>
      
      <v-spacer />
      
      <!-- Botones de navegación visibles solo en pantallas medianas y grandes -->
      <div class="d-none d-md-flex">
        <v-btn to="/" variant="text"> Localización </v-btn>
        <v-btn to="/forecast" variant="text"> Predicción </v-btn>
        <v-btn to="/historical" variant="text"> Histórico </v-btn>
        <v-btn to="/analysis" variant="text"> Analizar</v-btn>
        <v-btn to="/about" variant="text"> About </v-btn>
      </div>
    </v-app-bar>

    <!-- Menú lateral para móviles -->
    <v-navigation-drawer
      v-model="drawer"
      temporary
      location="left"
    >
      <v-list density="compact" nav>
        <v-list-item prepend-icon="mdi-map-marker" title="Localización" to="/" @click="drawer = false"></v-list-item>
        <v-list-item prepend-icon="mdi-weather-partly-cloudy" title="Predicción" to="/forecast" @click="drawer = false"></v-list-item>
        <v-list-item prepend-icon="mdi-history" title="Histórico" to="/historical" @click="drawer = false"></v-list-item>
        <v-list-item prepend-icon="mdi-chart-bar" title="Analizar" to="/analysis" @click="drawer = false"></v-list-item>
        <v-list-item prepend-icon="mdi-information-outline" title="About" to="/about" @click="drawer = false"></v-list-item>
      </v-list>
    </v-navigation-drawer>

    <v-main class="full-width-main">
      <router-view />
    </v-main>

    <FooterLayout />
  </v-app>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import FooterLayout from '@/layouts/components/FooterLayout.vue'

// Estado para controlar la apertura/cierre del menú lateral
const drawer = ref(false)
</script>

<style>
.full-width-main {
  padding: 0 !important;
}

.v-main__wrap {
  width: 100%;
  max-width: 100%;
}

.analysis-view-container {
  width: 100vw;
  max-width: 100vw;
}
</style>
