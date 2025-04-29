/**
 * Utilidades para manejo de textos
 */

/**
 * Normaliza una cadena eliminando acentos y ajustando mayúsculas/minúsculas
 */
export function normalizeString(str: string): string {
    return str.trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/^(la|el|los|las) /i, '')
        .split(' ').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
}
