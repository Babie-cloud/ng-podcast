// Production — remplacez apiUrl par l’URL publique du backend Spring Boot (sans slash final).
// Exemple : https://api.votredomaine.com  ou  https://votredomaine.com si l’API est derrière le même host.
export const environment = {
  production: true,
  // Remplacez par l'URL publique de votre API Render (sans slash final).
  apiUrl: 'https://CHANGE_ME_BACKEND_PUBLIC_URL',
  // Le Google Client ID n'est PAS secret : il est public cote navigateur.
  googleClientId:
    '133671696747-vm4qm6fmbl8rul31pb42lcbpr089n0m1.apps.googleusercontent.com',
};
