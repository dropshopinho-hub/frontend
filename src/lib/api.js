// Centraliza a URL base da API para facilitar manutenção
export const API_BASE_URL = "https://backend-k4fk.onrender.com";

export function apiFetch(path, options = {}) {
  return fetch(`${API_BASE_URL}${path}`, options);
}
