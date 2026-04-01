export const apiRequest = async (
  method: string,
  url: string,
  data?: unknown | undefined
): Promise<Response> => {
  // Normalise: strip a leading "/api" if already present so callers can pass
  // either "/auth/me" or "/api/auth/me" and we always get exactly one "/api".
  const normalisedUrl = url.startsWith("/api/") ? url.slice(4) : url;
  const res = await fetch(`/api${normalisedUrl}`, {
    method,
    headers: data ? { "Content-Type": "application/json" } : undefined,
    body: data ? JSON.stringify(data) : undefined,
  });

  if (!res.ok) {
    let message = "An error occurred";
    try {
      const errorData = await res.json();
      message = errorData.message || message;
    } catch {
      // Ignored
    }
    throw new Error(message);
  }

  return res;
};
