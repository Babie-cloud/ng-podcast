// Dev : 127.0.0.1 évite souvent les soucis ::1 ↔ IPv4 avec curl / le navigateur.
export const environment = {
  production: false,
  apiUrl: 'http://127.0.0.1:8080',
};