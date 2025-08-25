// Centraliza a URL base da API para facilitar manutenção
export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export function apiFetch(path, options = {}) {
  return fetch(`${API_BASE_URL}${path}`, options);
}
