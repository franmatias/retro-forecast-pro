# Característica de Ubicaciones (Locations)

## Descripción

Este módulo maneja toda la funcionalidad relacionada con ubicaciones geográficas en la aplicación Retro-Forecast-Pro, incluyendo:

- Búsqueda de ubicaciones
- Visualización de mapas interactivos
- Guardado de ubicaciones favoritas
- Geolocalización del usuario

## Estructura de carpetas

## Componentes principales

- **LocationsMaps**: Componente principal que integra mapa, búsqueda y tabla de ubicaciones
- **LocationView**: Vista principal que incorpora todos los componentes de ubicación

## Composables

- **useLeafletMap**: Gestión del mapa de Leaflet
- **useLocationSearch**: Búsqueda de ubicaciones usando Nominatim API
- **useGeolocation**: Obtención de la posición del usuario con Geolocation API

## Servicios

- **LocationService**: Servicios de geocodificación y datos de ubicación

## Store

- **locationStore**: Gestión del estado global de ubicaciones guardadas

## Uso

```vue
<template>
  <LocationsMaps />
</template>

<script setup>
import { LocationsMaps } from '@/features/locations/components'
</script>
```
