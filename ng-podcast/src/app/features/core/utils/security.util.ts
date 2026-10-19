/** Ajoute le JWT aux URLs /files/ pour lecture media authentifiée (audio, img). */
export function authMediaUrl(
  url: string | null | undefined,
  token: string | null | undefined,
): string {
  if (!url?.trim()) return '';
  const trimmed = url.trim();
  if (!token?.trim()) return trimmed;
  try {
    const parsed = new URL(trimmed, 'http://local.invalid');
    const path = parsed.pathname;
    if (!path.startsWith('/files/')) {
      return trimmed;
    }
    const sep = trimmed.includes('?') ? '&' : '?';
    return `${trimmed}${sep}access_token=${encodeURIComponent(token.trim())}`;
  } catch {
    if (!trimmed.includes('/files/')) return trimmed;
    const sep = trimmed.includes('?') ? '&' : '?';
    return `${trimmed}${sep}access_token=${encodeURIComponent(token.trim())}`;
  }
}

/** Autorise uniquement les redirections internes relatives. */
export function safeReturnUrl(value: string | null | undefined, fallback = '/dashboard'): string {
  if (!value?.trim()) return fallback;
  const url = value.trim();
  if (!url.startsWith('/') || url.startsWith('//')) return fallback;
  if (url.includes('://') || url.includes('\\')) return fallback;
  return url;
}

const STRIPE_HOSTS = new Set(['checkout.stripe.com', 'billing.stripe.com']);

/** Valide une URL de redirection Stripe avant navigation. */
export function assertStripeRedirectUrl(url: string): string {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error('URL Stripe invalide.');
  }
  if (parsed.protocol !== 'https:' || !STRIPE_HOSTS.has(parsed.hostname)) {
    throw new Error('Redirection Stripe non autorisee.');
  }
  return url;
}
