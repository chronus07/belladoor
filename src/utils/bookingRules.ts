import { BookingConfirmationSettings, ClientAppointment, PixKeyType } from '../types/belladoor';
import { formatWhatsappForLink } from './storage';

export const PIX_KEY_LABELS: Record<PixKeyType, string> = {
  PHONE: 'Celular / WhatsApp',
  CPF: 'CPF',
  CNPJ: 'CNPJ',
  EMAIL: 'E-mail',
  RANDOM: 'Chave Aleatória',
};

/**
 * Retorna o template padrão de mensagem para WhatsApp com base no nicho
 */
export function getDefaultMessageTemplate(isBarbershop: boolean = false, requireDeposit: boolean = true): string {
  if (isBarbershop) {
    if (requireDeposit) {
      return (
        `Fala, {cliente}! 💈\n` +
        `Recebemos seu agendamento no *BellaDoor* com sucesso!\n\n` +
        `✂️ *Serviço:* {servico}\n` +
        `📅 *Data:* {data} às *{horario}*\n` +
        `🏢 *Local:* {local}\n` +
        `💰 *Valor Total:* {valor_total}\n\n` +
        `⚠️ *CONFIRMAÇÃO DO HORÁRIO (SINAL DE {porcentagem_sinal}):*\n` +
        `Pra travar a cadeira e garantir seu horário na agenda, solicitamos um sinal de {porcentagem_sinal} no valor de *{valor_sinal}*.\n` +
        `O restante (*{restante}*) você acerta no dia do atendimento.\n\n` +
        `🔑 *Chave PIX:* {chave_pix} ({tipo_chave})\n` +
        `👤 *Titular:* {titular_pix}\n` +
        `⏳ *Prazo:* Envie o comprovante em até {prazo_sinal} para confirmar sua vaga.\n\n` +
        `📌 *REGRAS DO ATENDIMENTO:*\n` +
        `• Tolerância de atraso: {tolerancia}.\n` +
        `• Remarcações com no mínimo {aviso_cancelamento} de antecedência.\n` +
        `{regras}\n\n` +
        `Por favor, envie o comprovante do PIX por aqui para finalizarmos a confirmação! Tamo junto! 👊🔥`
      );
    }
    return (
      `Fala, {cliente}! 💈\n` +
      `Seu agendamento no *BellaDoor* está pré-confirmado!\n\n` +
      `✂️ *Serviço:* {servico}\n` +
      `📅 *Data:* {data} às *{horario}*\n` +
      `🏢 *Local:* {local}\n` +
      `💰 *Valor Total:* {valor_total}\n\n` +
      `📌 *REGRAS DO ATENDIMENTO:*\n` +
      `• Tolerância de atraso: {tolerancia}.\n` +
      `• Remarcações com no mínimo {aviso_cancelamento} de antecedência.\n` +
      `{regras}\n\n` +
      `Pode me confirmar se está tudo certo para nosso horário? Valeu! 👊🔥`
    );
  }

  if (requireDeposit) {
    return (
      `Olá, {cliente}! ✨\n` +
      `Recebemos seu agendamento no *BellaDoor* com sucesso!\n\n` +
      `💅 *Serviço:* {servico}\n` +
      `📅 *Data:* {data} às *{horario}*\n` +
      `📍 *Local:* {local}\n` +
      `💰 *Valor Total:* {valor_total}\n\n` +
      `⚠️ *GARANTIA DO HORÁRIO (SINAL DE {porcentagem_sinal}):*\n` +
      `Para garantir e bloquear seu horário na minha agenda, solicitamos o pagamento do sinal de {porcentagem_sinal} no valor de *{valor_sinal}*.\n` +
      `O restante (*{restante}*) será pago no dia do atendimento.\n\n` +
      `🔑 *Chave PIX:* {chave_pix} ({tipo_chave})\n` +
      `👤 *Titular:* {titular_pix}\n` +
      `⏳ *Prazo de envio do comprovante:* em até {prazo_sinal} após o agendamento.\n\n` +
      `📌 *REGRAS DO ATENDIMENTO:*\n` +
      `• Tolerância máxima de atraso: {tolerancia}.\n` +
      `• Remarcações: com no mínimo {aviso_cancelamento} de antecedência.\n` +
      `{regras}\n\n` +
      `Por favor, envie o comprovante do PIX por aqui para confirmarmos seu horário! Aguardo você! 💕`
    );
  }

  return (
    `Olá, {cliente}! ✨\n` +
    `Seu agendamento no *BellaDoor* está pré-confirmado!\n\n` +
    `💅 *Serviço:* {servico}\n` +
    `📅 *Data:* {data} às *{horario}*\n` +
    `📍 *Local:* {local}\n` +
    `💰 *Valor Total:* {valor_total}\n\n` +
    `📌 *REGRAS DO ATENDIMENTO:*\n` +
    `• Tolerância máxima de atraso: {tolerancia}.\n` +
    `• Remarcações: com no mínimo {aviso_cancelamento} de antecedência.\n` +
    `{regras}\n\n` +
    `Pode me confirmar se está tudo certinho para nosso horário? Aguardo você! 💕`
  );
}

/**
 * Cria a configuração padrão inicial com dados da profissional
 */
export function getDefaultBookingRules(pro?: {
  name?: string;
  whatsapp?: string;
  email?: string;
  businessNiche?: string;
}): BookingConfirmationSettings {
  const isBarbershop = pro?.businessNiche === 'BARBERSHOP';
  const rawPhone = pro?.whatsapp ? pro.whatsapp.replace(/\D/g, '') : '';
  const initialPixKey = rawPhone || pro?.email || '';
  const initialPixType: PixKeyType = rawPhone ? 'PHONE' : pro?.email ? 'EMAIL' : 'PHONE';
  const initialReceiver = pro?.name?.trim() || 'Profissional BellaDoor';
  const templateWithDeposit = getDefaultMessageTemplate(isBarbershop, true);
  const templateWithoutDeposit = getDefaultMessageTemplate(isBarbershop, false);

  return {
    enabled: true,
    requireDeposit: true,
    depositPercentage: 50,
    pixKey: initialPixKey,
    pixKeyType: initialPixType,
    pixReceiverName: initialReceiver,
    depositTimeLimitHours: 2,
    delayToleranceMinutes: 15,
    cancellationNoticeHours: 24,
    customRules:
      '• Comparecer pontualmente no horário agendado.\n' +
      '• Tolerância máxima de 15 minutos de atraso.\n' +
      '• Remarcações com no mínimo 24h de antecedência.\n' +
      '• O sinal garante a reserva e não é reembolsável em cancelamentos de última hora.',
    customMessageTemplate: templateWithDeposit,
    templateWithDeposit,
    templateWithoutDeposit,
  };
}

/**
 * Garante que o objeto de regras esteja preenchido com dados válidos e defaults
 */
export function getEffectiveBookingRules(
  stored?: Partial<BookingConfirmationSettings> | null,
  pro?: { name?: string; whatsapp?: string; email?: string; businessNiche?: string }
): BookingConfirmationSettings {
  const defaults = getDefaultBookingRules(pro);
  if (!stored) return defaults;

  const isBarbershop = pro?.businessNiche === 'BARBERSHOP';
  const reqDeposit =
    typeof stored.requireDeposit === 'boolean' ? stored.requireDeposit : defaults.requireDeposit;
  const templateWithDeposit =
    stored.templateWithDeposit || getDefaultMessageTemplate(isBarbershop, true);
  const templateWithoutDeposit =
    stored.templateWithoutDeposit || getDefaultMessageTemplate(isBarbershop, false);

  let effectiveTemplate = stored.customMessageTemplate;
  if (!effectiveTemplate || !effectiveTemplate.trim()) {
    effectiveTemplate = reqDeposit ? templateWithDeposit : templateWithoutDeposit;
  } else {
    // Se o sinal está desativado mas o template ainda contém tags de sinal de 50%/PIX
    if (
      !reqDeposit &&
      (effectiveTemplate.includes('{valor_sinal}') || effectiveTemplate.includes('{chave_pix}'))
    ) {
      effectiveTemplate = templateWithoutDeposit;
    } else if (
      reqDeposit &&
      !effectiveTemplate.includes('{valor_sinal}')
    ) {
      effectiveTemplate = templateWithDeposit;
    }
  }

  return {
    enabled: typeof stored.enabled === 'boolean' ? stored.enabled : defaults.enabled,
    requireDeposit: reqDeposit,
    depositPercentage:
      typeof stored.depositPercentage === 'number' && stored.depositPercentage > 0
        ? stored.depositPercentage
        : defaults.depositPercentage,
    pixKey: typeof stored.pixKey === 'string' && stored.pixKey.trim() ? stored.pixKey.trim() : defaults.pixKey,
    pixKeyType: stored.pixKeyType || defaults.pixKeyType,
    pixReceiverName:
      typeof stored.pixReceiverName === 'string' && stored.pixReceiverName.trim()
        ? stored.pixReceiverName.trim()
        : defaults.pixReceiverName,
    depositTimeLimitHours:
      typeof stored.depositTimeLimitHours === 'number' && stored.depositTimeLimitHours > 0
        ? stored.depositTimeLimitHours
        : defaults.depositTimeLimitHours,
    delayToleranceMinutes:
      typeof stored.delayToleranceMinutes === 'number' && stored.delayToleranceMinutes >= 0
        ? stored.delayToleranceMinutes
        : defaults.delayToleranceMinutes,
    cancellationNoticeHours:
      typeof stored.cancellationNoticeHours === 'number' && stored.cancellationNoticeHours >= 0
        ? stored.cancellationNoticeHours
        : defaults.cancellationNoticeHours,
    customRules: typeof stored.customRules === 'string' ? stored.customRules : defaults.customRules,
    customMessageTemplate: effectiveTemplate,
    templateWithDeposit,
    templateWithoutDeposit,
  };
}

/**
 * Calcula os valores de sinal e restante
 */
export function calculateDeposit(
  totalPrice: number,
  settings: BookingConfirmationSettings
): { depositAmount: number; remainingAmount: number; depositPercentage: number } {
  if (!settings.requireDeposit || settings.depositPercentage <= 0) {
    return {
      depositAmount: 0,
      remainingAmount: totalPrice,
      depositPercentage: 0,
    };
  }

  const pct = Math.min(Math.max(settings.depositPercentage, 1), 100);
  const depositAmount = Number(((totalPrice * pct) / 100).toFixed(2));
  const remainingAmount = Number((totalPrice - depositAmount).toFixed(2));

  return {
    depositAmount,
    remainingAmount,
    depositPercentage: pct,
  };
}

/**
 * Formata a mensagem completa substituindo todas as tags dinâmicas
 */
export function formatConfirmationMessage(params: {
  settings: BookingConfirmationSettings;
  booking: Partial<ClientAppointment>;
  proName: string;
  proWhatsapp?: string;
  isBarbershop?: boolean;
}): string {
  const { settings, booking, proName, isBarbershop } = params;
  const totalPrice = booking.totalPrice || 0;
  const { depositAmount, remainingAmount, depositPercentage } = calculateDeposit(totalPrice, settings);

  const formattedDate = booking.date ? booking.date.split('-').reverse().join('/') : 'Data a combinar';
  const formattedTime = booking.time || 'Horário a combinar';
  const clientName = booking.clientName || 'Cliente';
  const serviceName = booking.serviceName || 'Atendimento';

  let locationStr = 'No Studio / Domicílio';
  if (booking.locationType === 'STUDIO') {
    locationStr = isBarbershop
      ? `Na Barbearia (${booking.address || 'Endereço da Barbearia'})`
      : `No Studio / Atelier (${booking.address || 'Endereço do Studio'})`;
  } else if (booking.address) {
    locationStr = `${booking.address}${booking.neighborhood ? ` (${booking.neighborhood})` : ''}`;
  }

  const pixKeyLabel = PIX_KEY_LABELS[settings.pixKeyType] || 'PIX';
  const pixKeyVal = settings.pixKey || (params.proWhatsapp ? params.proWhatsapp.replace(/\D/g, '') : 'A informar');
  const receiverVal = settings.pixReceiverName || proName;

  let rawTemplate = settings.customMessageTemplate;
  if (!settings.requireDeposit) {
    if (
      !rawTemplate ||
      rawTemplate.includes('{valor_sinal}') ||
      rawTemplate.includes('{chave_pix}')
    ) {
      rawTemplate =
        settings.templateWithoutDeposit && !settings.templateWithoutDeposit.includes('{valor_sinal}')
          ? settings.templateWithoutDeposit
          : getDefaultMessageTemplate(isBarbershop, false);
    }
  } else {
    if (!rawTemplate || !rawTemplate.includes('{valor_sinal}')) {
      rawTemplate =
        settings.templateWithDeposit && settings.templateWithDeposit.includes('{valor_sinal}')
          ? settings.templateWithDeposit
          : getDefaultMessageTemplate(isBarbershop, true);
    }
  }

  // Formata as regras em tópicos se houver
  const rulesLines = (settings.customRules || '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => (l.startsWith('•') || l.startsWith('-') ? l : `• ${l}`))
    .join('\n');

  let message = rawTemplate
    .replace(/{cliente}/g, clientName)
    .replace(/{servico}/g, serviceName)
    .replace(/{data}/g, formattedDate)
    .replace(/{horario}/g, formattedTime)
    .replace(/{local}/g, locationStr)
    .replace(/{valor_total}/g, `R$ ${totalPrice.toFixed(2).replace('.', ',')}`)
    .replace(/{valor_sinal}/g, `R$ ${depositAmount.toFixed(2).replace('.', ',')}`)
    .replace(/{porcentagem_sinal}/g, `${depositPercentage}%`)
    .replace(/{restante}/g, `R$ ${remainingAmount.toFixed(2).replace('.', ',')}`)
    .replace(/{chave_pix}/g, pixKeyVal)
    .replace(/{tipo_chave}/g, pixKeyLabel)
    .replace(/{titular_pix}/g, receiverVal)
    .replace(/{prazo_sinal}/g, `${settings.depositTimeLimitHours}h`)
    .replace(/{tolerancia}/g, `${settings.delayToleranceMinutes} minutos`)
    .replace(/{aviso_cancelamento}/g, `${settings.cancellationNoticeHours}h`)
    .replace(/{regras}/g, rulesLines ? `${rulesLines}` : '');

  return message;
}

/**
 * Gera o link direto do WhatsApp wa.me com a mensagem encodada
 */
export function buildWhatsAppLink(phone: string, text: string): string {
  const normalizedPhone = formatWhatsappForLink(phone, '5511999999999');
  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(text)}`;
}
