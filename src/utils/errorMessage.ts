function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function formatSupabaseError(error: unknown): string {
  if (isRecord(error)) {
    const status = typeof error.status === 'number' ? error.status : undefined;
    const message = typeof error.message === 'string' ? error.message : undefined;

    if (status || message) {
      return [status ? `status ${status}` : null, message ?? null]
        .filter(Boolean)
        .join(' - ');
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'Unknown template error';
}
