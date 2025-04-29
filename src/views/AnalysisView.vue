<template>
  <div class="analysis-view-container">
    <AnalysisWeather />
  </div>
</template>

<script setup lang="ts">
import AnalysisWeather from '@/features/analysis/components/AnalysisWeather.vue';

// Component logic here
</script>

<style scoped>
.analysis-view-container {
  width: 100%;
  height: 100%;
  padding: 0;
  margin: 0;
  display: flex;
}
</style>