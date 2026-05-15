// Dev : appels directs vers Spring (le proxy ng serve + SSR renvoyaient du HTML → JSON.parse).
// CORS : SecurityConfig (motifs localhost / 127.0.0.1 / ::1, allowCredentials false).
export const environment = {
  production: false,
  apiUrl: 'http://127.0.0.1:8080',
};
