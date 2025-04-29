/**
 * Cliente API base para realizar peticiones HTTP
 * Aplica Principio de Responsabilidad Única: solo maneja comunicación HTTP
 */
export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /**
   * Realizar una petición GET
   */
  async get<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    
    // Añadir parámetros a la URL
    Object.keys(params).forEach(key => {
      url.searchParams.append(key, params[key]);
    });

    try {
      const response = await fetch(url.toString());
      
      if (!response.ok) {
        throw new Error(`Error API: ${response.status} ${response.statusText}`);
      }
      
      return await response.json() as T;
    } catch (error) {
      console.error('Error en la petición API:', error);
      throw error;
    }
  }
  
  // Otros métodos como post(), put(), delete() pueden implementarse aquí
}

// Instancia por defecto para la API de Open-Meteo
export const weatherApiClient = new ApiClient('https://api.open-meteo.com/v1');

// Instancia para geocodificación
export const geoApiClient = new ApiClient('https://geocoding-api.open-meteo.com/v1');
