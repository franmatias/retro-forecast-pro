<template>
  <div class="about-wrapper">
    <v-container fluid class="about-container">
      <v-card class="about-card">
        <div class="text-center mb-6">
          <v-img
            src="@/assets/logo.svg"
            alt="Retro Forecast Pro Logo"
            width="180"
            class="mx-auto mb-4"
          />
          <h1 class="text-h3 font-weight-bold primary-text mb-2">Retro Forecast Pro</h1>
          <v-divider class="mx-auto my-6" width="100"></v-divider>
        </div>

        <v-row>
          <v-col cols="12" md="6">
            <div class="app-description px-4">
              <h2 class="text-h5 font-weight-medium mb-4">Acerca de la aplicación</h2>
              <p class="text-body-1">
                Retro Forecast Pro es una aplicación meteorológica avanzada diseñada para proporcionar 
                datos climáticos precisos y detallados. Combina pronósticos actuales con datos históricos, 
                permitiendo análisis comparativos y visualización de tendencias climáticas.
              </p>
              <p class="text-body-1 mt-4">
                Nuestras características incluyen:
              </p>
              <ul class="feature-list">
                <li>Pronósticos meteorológicos detallados en tiempo real</li>
                <li>Análisis de datos históricos y comparativas</li>
                <li>Visualización de patrones de precipitación</li>
                <li>Mapas interactivos con información geolocalizada</li>
                <li>Alertas y recomendaciones personalizadas</li>
              </ul>
              <p class="text-body-1 mt-4">
                Todos los datos meteorológicos son proporcionados por APIs de confianza y actualización constante,
                garantizando la precisión y relevancia de la información presentada.
              </p>
            </div>
          </v-col>

          <v-col cols="12" md="6">
            <div class="author-section">
              <v-card class="author-card mx-2 pa-4" flat>
                <div class="text-center">
                  <v-avatar size="120" class="mb-4">
                    <v-img src="https://avatars.githubusercontent.com/u/placeholder" alt="Francisco Matías"></v-img>
                  </v-avatar>
                  <h2 class="text-h5 font-weight-bold mb-2">Francisco Matías</h2>
                  <p class="text-subtitle-1 text-medium-emphasis mb-3">Desarrollador Principal</p>
                  <p class="text-body-2 font-italic">
                    "I'm a software engineer with a passion for creating innovative solutions."
                  </p>
                  
                  <v-divider class="my-4"></v-divider>
                  
                  <div class="contact-info mt-4">
                    <v-chip class="ma-1" prepend-icon="mdi-github">franmatias</v-chip>
                    <v-chip class="ma-1" prepend-icon="mdi-email">contact@example.com</v-chip>
                    <v-chip class="ma-1" prepend-icon="mdi-web">portfolio.dev</v-chip>
                  </div>
                </div>
              </v-card>
            </div>
            
            <v-card class="tech-stack-card mx-2 mt-6 pa-4" flat>
              <h3 class="text-h6 mb-4">Tecnologías utilizadas</h3>
              <div class="tech-chips">
                <v-chip class="ma-1" color="primary" variant="outlined">Vue 3</v-chip>
                <v-chip class="ma-1" color="primary" variant="outlined">TypeScript</v-chip>
                <v-chip class="ma-1" color="primary" variant="outlined">Vuetify</v-chip>
                <v-chip class="ma-1" color="primary" variant="outlined">Pinia</v-chip>
                <v-chip class="ma-1" color="primary" variant="outlined">Chart.js</v-chip>
                <v-chip class="ma-1" color="primary" variant="outlined">Leaflet</v-chip>
              </div>
            </v-card>
          </v-col>
        </v-row>
      </v-card>
      
    </v-container>
  </div>
</template>

<script setup lang="ts">
// Component logic here
</script>

<style scoped>
.about-wrapper {
  width: 100vw;
  max-width: 100vw;
  overflow-x: hidden;
}

.about-container {
  padding: 32px 24px;
  width: 100%;
  max-width: 100%;
}

.about-card {
  padding: 32px;
  border-radius: 16px;
  background-color: rgba(30, 30, 30, 0.7) !important;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2) !important;
  margin-bottom: 24px;
}

.primary-text {
  background: linear-gradient(45deg, #3f51b5, #2196f3);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  display: inline-block;
}

.author-section {
  height: auto;
  margin-bottom: 24px;
}

.author-card, .tech-stack-card {
  background-color: rgba(40, 40, 40, 0.5) !important;
  border-radius: 12px;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.author-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 20px rgba(0, 0, 0, 0.3) !important;
}

.tech-stack-card {
  margin-bottom: 24px;
  padding-bottom: 16px;
}

.tech-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
}

.feature-list li {
  margin-bottom: 8px;
  list-style-type: none;
  position: relative;
  padding-left: 28px;
}

.feature-list li:before {
  content: "✓";
  position: absolute;
  left: 0;
  color: #4caf50;
  font-weight: bold;
}

/* Estilos responsive */
@media (max-width: 960px) {
  .about-card {
    padding: 24px 16px;
  }
  
  .tech-stack-card {
    margin-top: 0;
  }
}
</style>
