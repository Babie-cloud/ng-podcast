// Production — remplacez apiUrl par l’URL publique du backend Spring Boot (sans slash final).
// Exemple : https://api.votredomaine.com  ou  https://votredomaine.com si l’API est derrière le même host.
export const environment = {
  production: true,
  // Remplacez par l'URL publique de votre API Render (sans slash final).
  apiUrl: 'https://ngpodcast-api.onrender.com',
  // Le Google Client ID n'est PAS secret : il est public cote navigateur.
  // Rempli par GET /auth/config si vide (GOOGLE_CLIENT_ID sur Render).
  googleClientId: '',
  /** Freesound API token — https://freesound.org/apiv2/apply */
  freesoundApiKey: '',
  freesoundApiBaseUrl: 'https://freesound.org/apiv2',
};
