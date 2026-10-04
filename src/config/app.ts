/** Shared app configuration. */

export const APP_NAME = 'TAWAGKO';
export const APP_TAGLINE = 'Your Barangay Connection';

/**
 * The personnel token is intentionally NOT bundled in the app. It lives in
 * Supabase `app_settings` and is validated by the `claim_personnel_token`
 * function, so the code ships without the secret.
 */
