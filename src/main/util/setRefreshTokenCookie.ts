import type { Response } from 'express';

type CookieSameSite = 'lax' | 'strict' | 'none';

function resolveCookieSameSite(): CookieSameSite {
  const raw = process.env.COOKIE_SAME_SITE?.trim().toLowerCase();

  if (raw === undefined || raw.length === 0) {
    return process.env.NODE_ENV === 'production' ? 'none' : 'lax';
  }

  if (raw === 'lax' || raw === 'strict' || raw === 'none') {
    return raw;
  }

  throw new Error('Invalid COOKIE_SAME_SITE. Use lax | strict | none.');
}

function resolveCookieSecure(sameSite: CookieSameSite): boolean {
  const raw = process.env.COOKIE_SECURE?.trim().toLowerCase();

  if (raw === undefined || raw.length === 0) {
    return process.env.NODE_ENV === 'production' || sameSite === 'none';
  }

  if (raw === 'true') {
    return true;
  }

  if (raw === 'false') {
    if (sameSite === 'none') {
      throw new Error('COOKIE_SECURE=false is invalid when COOKIE_SAME_SITE=none.');
    }

    return false;
  }

  throw new Error('Invalid COOKIE_SECURE. Use true | false.');
}

function resolveCookieDomain(): string | undefined {
  const raw = process.env.COOKIE_DOMAIN?.trim();

  if (raw === undefined || raw.length === 0) {
    return undefined;
  }

  return raw;
}

export default function setRefreshTokenCookie(res: Response, refreshToken: string): void {
  const cookieSameSite = resolveCookieSameSite();
  const cookieSecure = resolveCookieSecure(cookieSameSite);
  const cookieDomain = resolveCookieDomain();

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: cookieSecure,
    sameSite: cookieSameSite,
    ...(cookieDomain !== undefined ? { domain: cookieDomain } : {}),
    path: '/'
  });
}
