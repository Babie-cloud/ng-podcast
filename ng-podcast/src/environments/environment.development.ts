// Dev : appels directs vers l’API Spring (CORS configuré dans SecurityConfig).
// proxy.conf.json reste disponible si vous relancez ng serve avec apiUrl: ''.
export const environment = {
  production: false,
  apiUrl: 'http://127.0.0.1:8080',
  // Public (pas un secret). Doit correspondre à GOOGLE_CLIENT_ID de l’API locale.
  googleClientId:
    '807753832705-57n1g1i827j5gn0s650lbhi8ikl9ac8t.apps.googleusercontent.com',
  /** Freesound API token — https://freesound.org/apiv2/apply */
  freesoundApiKey: '',
  /** Proxied by proxy.conf.json to avoid browser CORS in dev. */
  freesoundApiBaseUrl: '/freesound-api',
};
