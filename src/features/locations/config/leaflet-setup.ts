/**
 * Configuración global para Leaflet
 * Este archivo contiene la configuración necesaria para que los iconos de los marcadores
 * funcionen correctamente tanto en desarrollo como en producción.
 */

import L from 'leaflet'
import iconUrl from 'leaflet/dist/images/marker-icon.png'
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png'
import shadowUrl from 'leaflet/dist/images/marker-shadow.png'

// En entorno de pruebas, L.Icon.Default puede no estar definido
// Solo aplicamos la configuración en entorno de producción
if (process.env.NODE_ENV !== 'test' && L.Icon && L.Icon.Default) {
  // Sobrescribir la propiedad _getIconUrl para evitar errores en los patrones de URL
  if ((L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl) {
    delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl
  }

  // Configurar los iconos por defecto de Leaflet con las rutas correctas
  L.Icon.Default.mergeOptions({
    iconUrl,
    iconRetinaUrl,
    shadowUrl,
  })
}

// Exportar la referencia a L para asegurar que la configuración se ha aplicado
export default L