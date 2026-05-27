// Dev : appels directs vers l’API Spring (CORS configuré dans SecurityConfig).
// proxy.conf.json reste disponible si vous relancez ng serve avec apiUrl: ''.
export const environment = {
  production: false,
  apiUrl: 'http://127.0.0.1:8080',
  googleClientId:
    '133671696747-vm4qm6fmbl8rul31pb42lcbpr089n0m1.apps.googleusercontent.com',
};
