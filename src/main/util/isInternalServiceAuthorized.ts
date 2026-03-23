import { timingSafeEqual } from 'node:crypto';

type EnvInput = Record<string, string | undefined>;

function readConfiguredInternalServiceToken(input: EnvInput = process.env): string | null {
  const value = input.AUTH_INTERNAL_SERVICE_TOKEN?.trim() ?? '';
  return value.length > 0 ? value : null;
}

function isInternalServiceAuthorized(
  providedToken: string,
  input: EnvInput = process.env,
): boolean {
  const expectedToken = readConfiguredInternalServiceToken(input);
  const normalizedProvidedToken = providedToken.trim();

  if (expectedToken === null || normalizedProvidedToken.length === 0) {
    return false;
  }

  const expectedBuffer = Buffer.from(expectedToken);
  const providedBuffer = Buffer.from(normalizedProvidedToken);

  if (expectedBuffer.length !== providedBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, providedBuffer);
}

export { isInternalServiceAuthorized, readConfiguredInternalServiceToken };
