// Dev : appelle Spring directement (évite le proxy + SSR qui renvoient du HTML → JSON.parse error).
export const environment = {
  production: false,
  apiUrl: 'http://127.0.0.1:8080',
};