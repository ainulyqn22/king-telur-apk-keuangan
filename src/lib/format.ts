export function money(value: number, currency = 'Rp') {
  return `${currency} ${Math.round(value).toLocaleString('id-ID')}`;
}

export function quantity(value: number) {
  return `${value.toLocaleString('id-ID')} btr`;
}

export function percent(value: number) {
  return `${value.toLocaleString('id-ID', { maximumFractionDigits: 1 })}%`;
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
