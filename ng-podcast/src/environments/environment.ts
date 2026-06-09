// Aligné dev — voir environment.development.ts ; prod : environment.prod.ts.
export const environment = {
  production: false,
  apiUrl: 'http://127.0.0.1:8080',
  googleClientId: '',
  /** Freesound API token — https://freesound.org/apiv2/apply */
  freesoundApiKey: '',
  /** Dev proxy path; prod uses the public Freesound API. */
  freesoundApiBaseUrl: '/freesound-api',
};
