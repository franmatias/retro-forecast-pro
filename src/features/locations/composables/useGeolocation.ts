import { ref } from 'vue'
import axios from 'axios'
import type { NominatimReverseResponse, StoredLocation } from '../models'
import { API_ENDPOINTS, API_HEADERS } from '../config/constants'

export function useGeolocation() {
    const geolocating = ref(false)

    /**
     * Obtiene la ubicación actual del usuario
     */
    const getCurrentLocation = async (retryCount = 0): Promise<StoredLocation | null> => {
        if (!navigator.geolocation) {
            alert('Tu navegador no soporta la geolocalización')
            return null
        }

        geolocating.value = true

        try {
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                const options = {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0,
                }

                navigator.geolocation.getCurrentPosition(resolve, reject, options)
            })

            const { latitude, longitude } = position.coords

            // Hacer geocodificación inversa para obtener la dirección
            try {
                const response = await axios.get<NominatimReverseResponse>(
                    API_ENDPOINTS.NOMINATIM_REVERSE,
                    {
                        params: {
                            lat: latitude,
                            lon: longitude,
                            format: 'json',
                        },
                        headers: API_HEADERS,
                    }
                )

                if (response.data && response.data.display_name) {
                    // Log para depuración
                    console.log('Datos de ubicación:', response.data.address);
                    
                    // Extraer un nombre significativo de la ubicación
                    let locationName = 'Mi ubicación';
                    
                    if (response.data.address) {
                        // Acceder directamente al objeto para buscar campos como 'town', 'village', etc.
                        const addressObj = response.data.address as Record<string, string>;
                        
                        // Buscar la localidad en varios campos posibles
                        locationName = addressObj.city || 
                                      addressObj.town || 
                                      addressObj.village || 
                                      addressObj.municipality ||
                                      addressObj.locality ||
                                      addressObj.hamlet ||
                                      // Si no encontramos ninguna localidad, usar otros campos
                                      addressObj.state ||
                                      addressObj.country ||
                                      addressObj.road ||
                                      'Mi ubicación';
                    }
                    
                    return {
                        name: locationName,
                        address: response.data.display_name || `${latitude}, ${longitude}`,
                        lat: latitude,
                        lng: longitude,
                    }
                } else {
                    // Si no hay resultados de geocodificación, guardar con coordenadas brutas
                    return {
                        name: 'Mi ubicación',
                        address: `Latitud: ${latitude}, Longitud: ${longitude}`,
                        lat: latitude,
                        lng: longitude,
                    }
                }
            } catch {
                // Si falla la geocodificación inversa, guardar con coordenadas brutas
                return {
                    name: 'Mi ubicación',
                    address: `Latitud: ${latitude}, Longitud: ${longitude}`,
                    lat: latitude,
                    lng: longitude,
                }
            }
        } catch (error) {
            console.error('Error obteniendo la ubicación:', error)

            if (retryCount < 2) {
                console.log(`Reintentando (${retryCount + 1}/2)...`)
                await new Promise((resolve) => setTimeout(resolve, 1000))
                return getCurrentLocation(retryCount + 1)
            } else {
                alert('No se pudo obtener tu ubicación. Por favor, comprueba los permisos de tu navegador.')
                return null
            }
        } finally {
            geolocating.value = false
        }
    }

    return { geolocating, getCurrentLocation }
}
