/** Même clé que dans AuthService — évite une dépendance AuthService ↔ interceptor (cycle HttpClient). */
export const AUTH_JWT_STORAGE_KEY = 'np_jwt';
