export interface GeocodingResult {
    id: number;
    name: string;
    latitude: number;
    longitude: number;
    elevation: number;
    country: string;
    admin1: string;
    admin2: string;
    population: number;
}
export declare function getLocationDetails(placeName: string): Promise<GeocodingResult | null>;
