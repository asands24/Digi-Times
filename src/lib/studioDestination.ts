/** Only a local studio destination may survive the email sign-in round trip. */
export function studioDestination(value: string | null): string {
  return value && /^\/create(?:\?|$)/.test(value) && !/[\\\r\n]/.test(value) ? value : '/create';
}
