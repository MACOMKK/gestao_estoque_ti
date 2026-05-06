export function formatCpf(value) {
  const digits = String(value || '').replace(/\D/g, '');
  if (!digits) return '';

  const base = digits.slice(0, 11);
  if (base.length <= 3) return base;
  if (base.length <= 6) return `${base.slice(0, 3)}.${base.slice(3)}`;
  if (base.length <= 9) return `${base.slice(0, 3)}.${base.slice(3, 6)}.${base.slice(6)}`;
  return `${base.slice(0, 3)}.${base.slice(3, 6)}.${base.slice(6, 9)}-${base.slice(9, 11)}`;
}

export function maskCpf(value) {
  const formatted = formatCpf(value);
  if (!formatted) return '';
  return formatted.replace(/^(\d{3})\.\d{3}\.\d{3}-(\d{2})$/, '$1.***.***-$2');
}

