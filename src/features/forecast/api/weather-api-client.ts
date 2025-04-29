import axios from 'axios';
import type { AxiosInstance } from 'axios';

/**
 * Cliente API para servicios meteorológicos de Open-Meteo
 */
class WeatherApiClient {
    private client: AxiosInstance;

    constructor() {
        this.client = axios.create({
            baseURL: 'https://api.open-meteo.com/v1',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
    }

    /**
     * Realiza una petición GET
     */
    async get<T>(endpoint: string, params: Record<string, string | number | boolean> = {}): Promise<T> {
        try {
            const response = await this.client.get<T>(endpoint, { params });
            return response.data;
        } catch (error) {
            console.error(`Error en petición GET a ${endpoint}:`, error);
            throw error;
        }
    }
}

export const weatherApiClient = new WeatherApiClient();
