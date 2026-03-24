const DEFAULT_REFRESH_ROTATION_GRACE_MS = 3_000;

function resolveRefreshRotationGraceMs(rawValue: string | undefined = process.env.REFRESH_ROTATION_GRACE_MS): number {
  const trimmed = rawValue?.trim();

  if (trimmed === undefined || trimmed.length === 0) {
    return DEFAULT_REFRESH_ROTATION_GRACE_MS;
  }

  const parsed = Number.parseInt(trimmed, 10);

  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error('Invalid REFRESH_ROTATION_GRACE_MS. Use a non-negative integer.');
  }

  return parsed;
}

export { DEFAULT_REFRESH_ROTATION_GRACE_MS, resolveRefreshRotationGraceMs };
