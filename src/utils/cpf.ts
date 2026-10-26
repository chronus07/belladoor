// ==============================================================================
// BELLADOOR - UTILITÁRIO DE VALIDAÇÃO E FORMATAÇÃO DE CPF (BRASIL)
// ==============================================================================

/**
 * Remove caracteres não numéricos e limita a 11 dígitos
 */
export function cleanCPF(val: string): string {
  return (val || '').replace(/\D/g, '').slice(0, 11);
}

/**
 * Aplica máscara progressiva de CPF: 000.000.000-00
 */
export function formatCPF(val: string): string {
  const digits = cleanCPF(val);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
}

/**
 * Validação algorítmica completa de CPF (módulo 11 da Receita Federal)
 * Retorna null se for válido, ou mensagem de erro explicativa.
 */
export function validateCPF(cpfInput: string): string | null {
  const digits = cleanCPF(cpfInput);

  if (!digits) {
    return 'Por favor, informe seu CPF (campo obrigatório).';
  }

  if (digits.length !== 11) {
    return 'O CPF deve conter exatamente 11 dígitos (formato 000.000.000-00).';
  }

  // Rejeita sequências com todos os dígitos iguais (ex: 111.111.111-11)
  if (/^(\d)\1{10}$/.test(digits)) {
    return 'CPF inválido. Verifique os números digitados.';
  }

  // Validação do 1º Dígito Verificador
  let sum1 = 0;
  for (let i = 0; i < 9; i++) {
    sum1 += parseInt(digits.charAt(i), 10) * (10 - i);
  }
  let rem1 = (sum1 * 10) % 11;
  if (rem1 === 10 || rem1 === 11) rem1 = 0;
  if (rem1 !== parseInt(digits.charAt(9), 10)) {
    return 'CPF inválido. Verifique o número digitado.';
  }

  // Validação do 2º Dígito Verificador
  let sum2 = 0;
  for (let i = 0; i < 10; i++) {
    sum2 += parseInt(digits.charAt(i), 10) * (11 - i);
  }
  let rem2 = (sum2 * 10) % 11;
  if (rem2 === 10 || rem2 === 11) rem2 = 0;
  if (rem2 !== parseInt(digits.charAt(10), 10)) {
    return 'CPF inválido. Verifique o número digitado.';
  }

  return null;
}
