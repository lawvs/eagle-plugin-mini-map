export interface ReadBinaryOptions {
  signal?: AbortSignal;
}

export async function readBinaryFromUrl(
  sourceUrl: string,
  options?: ReadBinaryOptions,
): Promise<ArrayBuffer> {
  const response = await fetch(sourceUrl, {
    cache: "no-store",
    signal: options?.signal,
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch source (${response.status})`);
  }

  return response.arrayBuffer();
}
