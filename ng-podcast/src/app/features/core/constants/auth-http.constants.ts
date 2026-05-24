/** Chemins backend : ne pas déclencher logout global sur 401 attendu / formulaires auth */
export const SKIP_UNAUTHORIZED_LOGOUT_SEGMENTS = [
  '/auth/login',
  '/auth/register',
  '/auth/reset-password',
];
