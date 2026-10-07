/**
 * Carrega dados com segurança do localStorage do navegador (Passo 1: Persistência Real)
 */
export function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/**
 * Normaliza o número de WhatsApp para links wa.me (adicionando DDI 55 se necessário)
 */
export function formatWhatsappForLink(rawPhone: string, fallbackPhone: string): string {
  const digits = rawPhone.replace(/\D/g, '');
  if (!digits) return fallbackPhone;
  if (digits.length <= 11 && !digits.startsWith('55')) {
    return `55${digits}`;
  }
  return digits;
}

/**
 * Calcula e expande um intervalo de datas YYYY-MM-DD para bloqueios de agenda
 */
export function getDatesInRange(startStr: string, endStr: string): string[] {
  if (!startStr) return [];
  const validEnd = !endStr || endStr < startStr ? startStr : endStr;
  const dates: string[] = [];
  const [sY, sM, sD] = startStr.split('-').map(Number);
  const [eY, eM, eD] = validEnd.split('-').map(Number);
  const current = new Date(sY, sM - 1, sD);
  const end = new Date(eY, eM - 1, eD);
  while (current <= end) {
    const y = current.getFullYear();
    const m = String(current.getMonth() + 1).padStart(2, '0');
    const d = String(current.getDate()).padStart(2, '0');
    dates.push(`${y}-${m}-${d}`);
    current.setDate(current.getDate() + 1);
  }
  return dates;
}
