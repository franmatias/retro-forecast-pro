import { ref } from 'vue'
// Importar Leaflet desde nuestro archivo de configuración en lugar de directamente
import L from '../config/leaflet-setup'
import type { StoredLocation } from '../models/Types'
import { useLocationStore } from '../stores/locationStore'

export function useLeafletMap() {
    const map = ref<L.Map | null>(null)
    const markers = ref<L.Marker[]>([])
    const locationStore = useLocationStore()

    /**
     * Inicializa el mapa de Leaflet
     */
    const initMap = (elementId: string, defaultCenter: [number, number] = [37.3886303, -2.3384884], defaultZoom: number = 13) => {
        if (typeof window === 'undefined' || typeof L === 'undefined') return

        try {
            const mapContainer = document.getElementById(elementId)
            if (!mapContainer) {
                console.error('No se pudo encontrar el contenedor del mapa')
                return
            }

            const mapInstance = L.map(elementId, {
                center: defaultCenter,
                zoom: defaultZoom,
            })

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
            }).addTo(mapInstance)

            map.value = mapInstance
            loadSavedMarkers()
        } catch (error) {
            console.error('Error initializing map:', error)
        }
    }

    /**
     * Carga los marcadores guardados en el store
     */
    const loadSavedMarkers = () => {
        if (!map.value || !(map.value instanceof L.Map)) return

        // Limpiar marcadores existentes
        markers.value.forEach((marker) => marker.remove())
        markers.value = []

        // Añadir marcadores guardados
        locationStore.savedLocations.forEach((location: StoredLocation) => {
            const marker = L.marker([location.lat, location.lng])
                .addTo(map.value as L.Map)
                .bindPopup(`<strong>${location.name}</strong><br>${location.address}`)
            markers.value.push(marker)
        })

        // Ajustar vista si hay marcadores
        if (markers.value.length > 0 && locationStore.savedLocations.length > 0) {
            const bounds = L.latLngBounds(
                locationStore.savedLocations.map((loc: StoredLocation) => [loc.lat, loc.lng])
            )
            map.value.fitBounds(bounds, { padding: [50, 50] })
        }
    }

    /**
     * Centra el mapa en una ubicación específica
     */
    const centerOnLocation = (location: StoredLocation) => {
        if (!map.value || !(map.value instanceof L.Map)) return

        map.value.setView([location.lat, location.lng], 15)

        // Buscar y activar el popup del marcador correspondiente
        const markerIndex = locationStore.savedLocations.findIndex(
            (loc) => loc.lat === location.lat && loc.lng === location.lng
        )

        if (markerIndex >= 0 && markers.value[markerIndex]) {
            markers.value[markerIndex].openPopup()
        }

        // Actualizar la ubicación seleccionada en el store global
        locationStore.setSelectedLocation(location)
    }

    /**
     * Añade un marcador al mapa y guarda la ubicación en el store
     */
    const addMarkerAndSaveLocation = (location: StoredLocation) => {
        if (!map.value) return false

        try {
            // Añadir al store
            const added = locationStore.addLocation(location)

            if (!added) {
                return false
            }

            // Crear marcador
            const marker = L.marker([location.lat, location.lng])

            // Añadir al mapa
            if (map.value instanceof L.Map) {
                marker
                    .addTo(map.value)
                    .bindPopup(`<strong>${location.name}</strong><br>${location.address}`)
                    .openPopup()

                map.value.setView([location.lat, location.lng], 13)
            }

            // Guardar referencia de marcador
            markers.value.push(marker)
            return true
        } catch (error) {
            console.error('Error adding marker:', error)
            return false
        }
    }

    return {
        map,
        markers,
        initMap,
        loadSavedMarkers,
        centerOnLocation,
        addMarkerAndSaveLocation
    }
}
