<template>
  <v-footer height="40" app class="footer-layout">
    <a
      v-for="item in items"
      :key="item.title"
      :href="item.href"
      :title="item.title"
      class="d-inline-block mx-2 social-link"
      rel="noopener noreferrer"
      target="_blank"
    >
      <v-icon :icon="item.icon" :size="item.icon === '$vuetify' ? 24 : 16" />
    </a>

    <div class="text-caption text-disabled" style="position: absolute; right: 16px">
      &copy; {{ new Date().getFullYear() }}
      <span class="d-none d-sm-inline-block">Retro Forecast Pro</span>
      —
      <a
        class="text-decoration-none on-surface"
        href="https://open-meteo.com/"
        rel="noopener noreferrer"
        target="_blank"
      >
        Powered by Open-Meteo
      </a>
    </div>
  </v-footer>
</template>

<script setup lang="ts">
const items = [
  {
    title: 'GitHub',
    icon: 'mdi-github',
    href: 'https://github.com/',
  },
  {
    title: 'LinkedIn',
    icon: 'mdi-linkedin',
    href: 'https://linkedin.com/',
  },
  {
    title: 'Email',
    icon: 'mdi-email',
    href: 'mailto:contact@example.com',
  },
]
</script>

<style scoped>
.footer-layout {
  border-top: 1px solid rgba(255, 255, 255, 0.12);
}

.footer-layout a {
  color: #64b5f6;
}

.footer-layout a:hover {
  color: #2196f3;
}

.social-link :deep(.v-icon) {
  color: rgba(var(--v-theme-on-background), var(--v-disabled-opacity));
  text-decoration: none;
  transition: 0.2s ease-in-out;
}

.social-link :deep(.v-icon):hover {
  color: rgba(25, 118, 210, 1);
}
</style>
