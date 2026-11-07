// API amounts are canonical decimal strings. Never round financial values through Number.
export function moneyCents(value: unknown): bigint {
  if (typeof value !== 'string' || !/^(0|[1-9]\d*)\.\d{2}$/.test(value)) throw new Error('Invalid monetary amount.');
  return BigInt(value.replace('.', ''));
}

export function normalizePaymentAmount(value: string): string {
  if (!/^\d{1,8}(?:\.\d{1,2})?$/.test(value)) throw new Error('Enter a positive payment amount with at most two decimals.');
  const [whole, fraction = ''] = value.split('.');
  const result = `${BigInt(whole)}.${fraction.padEnd(2, '0')}`;
  if (moneyCents(result) === 0n) throw new Error('Enter a positive payment amount with at most two decimals.');
  return result;
}
