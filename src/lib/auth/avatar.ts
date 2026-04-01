export function buildAvatarImageUrl(version?: string | number | Date | null) {
  if (!version) {
    return '/api/account/avatar';
  }

  const normalizedVersion =
    version instanceof Date ? version.getTime().toString() : String(version);

  return `/api/account/avatar?v=${encodeURIComponent(normalizedVersion)}`;
}

export function parseAvatarDataUrl(dataUrl: string) {
  const match = dataUrl.match(
    /^data:(image\/(?:png|jpeg|jpg|webp));base64,([A-Za-z0-9+/=]+)$/
  );

  if (!match) {
    return null;
  }

  return {
    mimeType: match[1].toLowerCase(),
    buffer: Buffer.from(match[2], 'base64'),
  };
}
