const money = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 2 });
export const formatNGN = (kobo: number) => money.format(kobo / 100);
export const formatDate = (timestamp: string) => new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'Africa/Lagos' }).format(new Date(timestamp));
export const formatTimestamp = (timestamp: string) => new Intl.DateTimeFormat('en-GB', {
  day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Lagos',
}).format(new Date(timestamp)) + ' WAT';
export const formatFullDate = (timestamp: string) => new Intl.DateTimeFormat('en-GB', {
  day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Africa/Lagos',
}).format(new Date(timestamp));
