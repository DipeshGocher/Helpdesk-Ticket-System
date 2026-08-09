// Normalizes an axios error into a consistent shape the UI can rely on,
// regardless of whether it's a validation (400), conflict (409), or network error.
export function parseApiError(err) {
  const response = err?.response;
  const data = response?.data;

  return {
    status: response?.status ?? null,
    message: data?.message || err?.message || 'Something went wrong. Please try again.',
    fieldErrors: Array.isArray(data?.errors) ? data.errors : [],
    currentTicket: data?.currentTicket ?? null,
    isConflict: response?.status === 409,
    isNetworkError: !response,
  };
}
