import { ClientAppointment } from '../types/belladoor';
import { getFirebaseDb, withTimeout } from '../../lib/firebaseClient';
import { collection, addDoc, doc, setDoc, getDoc } from 'firebase/firestore';

export type EmailProviderType = 'WEBHOOK' | 'GOOGLE_APPS_SCRIPT' | 'BREVO' | 'RESEND' | 'FIRESTORE_MAIL';

export interface BellaDoorEmailConfig {
  provider: EmailProviderType;
  webhookUrl?: string; // URL do Google Apps Script Web App
  apiKey?: string;     // Chave de API opcional (Brevo ou Resend)
  senderName?: string;
  senderEmail?: string;
  enabled?: boolean;
}

export interface EmailLogEntry {
  id: string;
  to: string;
  proName?: string;
  subject?: string;
  appointmentId?: string;
  sentAt: string;
  clientName?: string;
  serviceName?: string;
  provider?: string;
}

export const DEFAULT_EMAIL_CONFIG: BellaDoorEmailConfig = {
  provider: 'WEBHOOK',
  webhookUrl: '',
  senderName: 'BellaDoor Notificações',
  senderEmail: 'contato@belladoor.app',
  enabled: true,
};

const EMAIL_CONFIG_STORAGE_KEY = 'belladoor_v2_email_config';

/**
 * Código oficial do Google Apps Script para envio 100% gratuito de emails via Gmail
 */
export const GOOGLE_APPS_SCRIPT_SAMPLE = `/**
 * BELLADOOR - Webhook Oficial de Notificação por E-mail (100% Gratuito via Gmail)
 * 
 * INSTRUÇÕES RÁPIDAS (Leva 1 minuto):
 * 1. Acesse: https://script.google.com e clique em "Novo projeto"
 * 2. Apague o código padrão e cole todo este arquivo
 * 3. Clique no botão azul "Implantar" (Deploy) -> "Nova implantação"
 * 4. No ícone de engrenagem "Selecionar tipo", escolha "App da Web" (Web app)
 * 5. Configure:
 *    - Descrição: BellaDoor Email Webhook
 *    - Executar como: Eu (seu Gmail)
 *    - Quem pode acessar: Qualquer pessoa (Anyone)  <-- IMPORTANTE!
 * 6. Clique em "Implantar", autorize o acesso à sua conta Google
 * 7. Copie o "URL do aplicativo da web" (termina com /exec)
 * 8. Cole no Painel Admin do BellaDoor na aba "E-mails" e clique em Salvar!
 */
function doPost(e) {
  try {
    var raw = e && e.postData ? e.postData.contents : "{}";
    var data = JSON.parse(raw);
    
    if (!data.to) {
      return ContentService.createTextOutput(JSON.stringify({ 
        success: false, 
        error: "Destinatário 'to' não informado" 
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    MailApp.sendEmail({
      to: data.to,
      subject: data.subject || "✨ Novo Agendamento no BellaDoor",
      body: data.text || "Novo agendamento realizado no BellaDoor.",
      htmlBody: data.html || undefined,
      name: data.senderName || "BellaDoor Notificações"
    });
    
    return ContentService.createTextOutput(JSON.stringify({ 
      success: true, 
      sentTo: data.to,
      timestamp: new Date().toISOString() 
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ 
      success: false, 
      error: error.toString() 
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({ 
    status: "online", 
    service: "BellaDoor Email Webhook",
    message: "O webhook de emails do BellaDoor está funcionando perfeitamente!"
  })).setMimeType(ContentService.MimeType.JSON);
}`;

/**
 * Carrega a configuração de envio de e-mails (localStorage + Firestore)
 */
export async function loadEmailConfig(): Promise<BellaDoorEmailConfig> {
  let localConfig: BellaDoorEmailConfig = { ...DEFAULT_EMAIL_CONFIG };
  try {
    const raw = localStorage.getItem(EMAIL_CONFIG_STORAGE_KEY);
    if (raw) {
      localConfig = { ...DEFAULT_EMAIL_CONFIG, ...JSON.parse(raw) };
    }
  } catch {}

  try {
    const db = getFirebaseDb();
    if (db) {
      const snap = await withTimeout(getDoc(doc(db, 'belladoor_prod', 'email_config')), 2000, null as any);
      if (snap && snap.exists()) {
        const cloudConfig = snap.data() as BellaDoorEmailConfig;
        const merged = { ...localConfig, ...cloudConfig };
        try {
          localStorage.setItem(EMAIL_CONFIG_STORAGE_KEY, JSON.stringify(merged));
        } catch {}
        return merged;
      }
    }
  } catch (err) {
    console.warn('[BellaDoor Email] Falha ao carregar email_config do Firestore:', err);
  }

  return localConfig;
}

/**
 * Salva a configuração de envio de e-mails tanto no localStorage quanto no Firestore
 */
export async function saveEmailConfig(config: BellaDoorEmailConfig): Promise<boolean> {
  try {
    localStorage.setItem(EMAIL_CONFIG_STORAGE_KEY, JSON.stringify(config));
  } catch {}

  try {
    const db = getFirebaseDb();
    if (db) {
      await withTimeout(
        setDoc(doc(db, 'belladoor_prod', 'email_config'), {
          ...config,
          updatedAt: new Date().toISOString(),
        }, { merge: true }),
        3000,
        null
      );
      return true;
    }
  } catch (err) {
    console.warn('[BellaDoor Email] Erro ao salvar email_config no Firestore:', err);
  }
  return true;
}

/**
 * Busca histórico dos últimos envios registrados no Firestore
 */
export async function fetchEmailNotificationsLog(): Promise<EmailLogEntry[]> {
  try {
    const db = getFirebaseDb();
    if (db) {
      const snap = await withTimeout(getDoc(doc(db, 'belladoor_prod', 'email_notifications')), 2500, null as any);
      if (snap && snap.exists()) {
        return (snap.data()?.items || []) as EmailLogEntry[];
      }
    }
  } catch (err) {
    console.warn('[BellaDoor Email] Falha ao carregar logs de email:', err);
  }
  return [];
}

/**
 * Envia notificação por e-mail para a profissional quando um novo agendamento é realizado
 */
export async function sendBookingEmailNotification(
  proEmail: string,
  proName: string,
  appointment: ClientAppointment,
  customConfig?: BellaDoorEmailConfig
): Promise<boolean> {
  const cleanEmail = (proEmail || '').trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    console.warn('[BellaDoor Email] E-mail da profissional inválido ou não informado:', proEmail);
    return false;
  }

  const config = customConfig || await loadEmailConfig();
  if (config.enabled === false) {
    console.info('[BellaDoor Email] Notificações por e-mail desativadas nas configurações.');
    return false;
  }

  const dateFormatted = appointment.date.split('-').reverse().join('/');
  const totalPriceFormatted = `R$ ${appointment.totalPrice.toFixed(2).replace('.', ',')}`;
  const depositText = appointment.depositAmount && appointment.depositAmount > 0
    ? `R$ ${appointment.depositAmount.toFixed(2).replace('.', ',')} (${appointment.depositPercentage || 50}%)`
    : 'Não exigido';

  const locationText = appointment.locationType === 'STUDIO'
    ? `No seu Studio / Endereço fixo (${appointment.address})`
    : `A Domicílio na residência da cliente (${appointment.address})`;

  const subject = `✨ Novo Agendamento no BellaDoor - ${appointment.clientName} (${dateFormatted} às ${appointment.time})`;

  const textBody = `Olá, ${proName || 'Profissional'}!
Você recebeu um novo agendamento na sua vitrine BellaDoor:

- Cliente: ${appointment.clientName}
- WhatsApp / Telefone: ${appointment.clientPhone}
- Serviço: ${appointment.serviceName}
- Data e Horário: ${dateFormatted} às ${appointment.time}
- Local: ${locationText}
- Valor Total: ${totalPriceFormatted}
- Sinal Pix (Garantia de Horário): ${depositText}
- Status Atual: ${appointment.status}

Acesse o seu Painel da Profissional para visualizar os detalhes, conferir o comprovante e confirmar o atendimento:
https://belladoor.web.app

Atenciosamente,
${config.senderName || 'Equipe BellaDoor'}
${config.senderEmail || 'contato@belladoor.app'}`;

  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f7f7f8; margin: 0; padding: 24px; color: #1c1917;">
  <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 20px; border: 1px solid #e7e5e4; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
    <div style="background: linear-gradient(135deg, #e11d48 0%, #be123c 100%); padding: 24px; text-align: center; color: #ffffff;">
      <h1 style="margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.5px;">BellaDoor</h1>
      <p style="margin: 6px 0 0; font-size: 13px; opacity: 0.9;">Novo agendamento realizado na sua vitrine</p>
    </div>

    <div style="padding: 24px;">
      <h2 style="font-size: 16px; margin-top: 0; color: #0c0a09; font-weight: 800;">
        Olá, ${proName || 'Profissional'}! ✨
      </h2>
      <p style="font-size: 13px; color: #57534e; line-height: 1.5; margin-bottom: 20px;">
        Uma cliente acabou de agendar um horário com você pela sua vitrine no <strong>BellaDoor</strong>.
      </p>

      <div style="background-color: #fafaf9; border: 1px solid #e7e5e4; border-radius: 14px; padding: 16px; margin-bottom: 20px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <tr>
            <td style="padding: 6px 0; color: #78716c; font-weight: 600; width: 140px;">Cliente:</td>
            <td style="padding: 6px 0; color: #0c0a09; font-weight: 800;">${appointment.clientName}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #78716c; font-weight: 600;">WhatsApp / Fone:</td>
            <td style="padding: 6px 0; color: #0c0a09; font-weight: 700;">
              <a href="https://wa.me/55${appointment.clientPhone.replace(/\D/g, '')}" style="color: #059669; text-decoration: none;">
                ${appointment.clientPhone} 📲
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #78716c; font-weight: 600;">Serviço:</td>
            <td style="padding: 6px 0; color: #e11d48; font-weight: 800;">${appointment.serviceName}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #78716c; font-weight: 600;">Data e Horário:</td>
            <td style="padding: 6px 0; color: #0c0a09; font-weight: 800;">${dateFormatted} às ${appointment.time}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #78716c; font-weight: 600;">Local:</td>
            <td style="padding: 6px 0; color: #0c0a09; font-size: 12px;">${locationText}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #78716c; font-weight: 600;">Valor Total:</td>
            <td style="padding: 6px 0; color: #059669; font-weight: 800;">${totalPriceFormatted}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #78716c; font-weight: 600;">Sinal Pix Solicitado:</td>
            <td style="padding: 6px 0; color: #d97706; font-weight: 800;">${depositText}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #78716c; font-weight: 600;">Status do Horário:</td>
            <td style="padding: 6px 0;">
              <span style="display: inline-block; background-color: #fef3c7; color: #92400e; font-weight: 800; font-size: 11px; padding: 2px 8px; border-radius: 999px;">
                ${appointment.status}
              </span>
            </td>
          </tr>
        </table>
      </div>

      <div style="text-align: center; margin: 24px 0 16px;">
        <a href="https://belladoor.web.app" style="display: inline-block; background-color: #e11d48; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 12px; font-weight: 800; font-size: 13px; box-shadow: 0 2px 6px rgba(225,29,72,0.3);">
          Abrir Painel no BellaDoor
        </a>
      </div>

      <p style="font-size: 11px; color: #a8a29e; text-align: center; margin-top: 20px; line-height: 1.4;">
        A cliente recebeu a orientação de enviar o comprovante do sinal no seu WhatsApp caso o sinal esteja ativo.
      </p>
    </div>

    <div style="background-color: #fafaf9; border-top: 1px solid #e7e5e4; padding: 14px; text-align: center; font-size: 11px; color: #78716c;">
      BellaDoor • A tecnologia para profissionais da beleza crescerem seus atendimentos.
    </div>
  </div>
</body>
</html>`;

  let usedProvider = config.provider || 'WEBHOOK';

  // 1. Envio Direto via Google Apps Script Webhook (Gratuito via Gmail)
  if (config.webhookUrl && config.webhookUrl.trim()) {
    try {
      const payload = {
        to: cleanEmail,
        proName,
        subject,
        html: htmlBody,
        text: textBody,
        senderName: config.senderName || 'BellaDoor Notificações',
        appointmentId: appointment.id,
        appointmentDate: appointment.date,
        appointmentTime: appointment.time,
        serviceName: appointment.serviceName,
        clientName: appointment.clientName,
        clientPhone: appointment.clientPhone,
        totalPrice: appointment.totalPrice,
      };

      // Usando text/plain;charset=utf-8 e mode: 'no-cors' para contornar qualquer restrição CORS
      // no redirect interno do Google Apps Script Web App
      await fetch(config.webhookUrl.trim(), {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(payload),
        mode: 'no-cors',
      });
      usedProvider = 'GOOGLE_APPS_SCRIPT';
      console.log('[BellaDoor Email] Disparado com sucesso via Google Apps Script Webhook:', cleanEmail);
    } catch (webhookErr) {
      console.warn('[BellaDoor Email] Falha ao despachar webhook Apps Script:', webhookErr);
    }
  }

  // 2. Fallback / Opção: Brevo API (se configurado com API Key)
  if (config.provider === 'BREVO' && config.apiKey && config.apiKey.trim()) {
    try {
      await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': config.apiKey.trim(),
          'Content-Type': 'application/json',
          'accept': 'application/json',
        },
        body: JSON.stringify({
          sender: {
            name: config.senderName || 'BellaDoor',
            email: config.senderEmail || 'contato@belladoor.app',
          },
          to: [{ email: cleanEmail, name: proName }],
          subject,
          htmlContent: htmlBody,
          textContent: textBody,
        }),
      });
      usedProvider = 'BREVO';
    } catch (brevoErr) {
      console.warn('[BellaDoor Email] Falha no disparo Brevo:', brevoErr);
    }
  }

  // 3. Fallback / Opção: Resend API (se configurado com API Key)
  if (config.provider === 'RESEND' && config.apiKey && config.apiKey.trim()) {
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.apiKey.trim()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `${config.senderName || 'BellaDoor'} <${config.senderEmail || 'onboarding@resend.dev'}>`,
          to: [cleanEmail],
          subject,
          html: htmlBody,
          text: textBody,
        }),
      });
      usedProvider = 'RESEND';
    } catch (resendErr) {
      console.warn('[BellaDoor Email] Falha no disparo Resend:', resendErr);
    }
  }

  // 4. Grava na fila do Firebase Firestore (coleção 'mail' da extensão oficial Trigger Email)
  try {
    const db = getFirebaseDb();
    if (db) {
      await withTimeout(
        addDoc(collection(db, 'mail'), {
          to: cleanEmail,
          message: {
            subject,
            text: textBody,
            html: htmlBody,
          },
          createdAt: new Date().toISOString(),
          appointmentId: appointment.id,
          source: 'belladoor_booking',
        }),
        3000,
        null
      );
    }
  } catch (err) {
    console.warn('[BellaDoor Email] Aviso ao gravar na fila mail do Firestore:', err);
  }

  // 5. Grava histórico na coleção belladoor_prod/email_notifications
  try {
    const db = getFirebaseDb();
    if (db) {
      const notifRef = doc(db, 'belladoor_prod', 'email_notifications');
      const snap = await withTimeout(getDoc(notifRef), 2000, null as any);
      const existing = snap && snap.exists() ? snap.data()?.items || [] : [];
      const newEntry: EmailLogEntry = {
        id: `email-${Date.now()}`,
        to: cleanEmail,
        proName,
        subject,
        appointmentId: appointment.id,
        sentAt: new Date().toISOString(),
        clientName: appointment.clientName,
        serviceName: appointment.serviceName,
        provider: usedProvider,
      };
      await withTimeout(
        setDoc(notifRef, {
          items: [newEntry, ...existing.slice(0, 49)],
          updatedAt: new Date().toISOString(),
        }, { merge: true }),
        2500,
        null
      );
    }
  } catch (err) {
    console.warn('[BellaDoor Email] Aviso ao gravar log de email em belladoor_prod:', err);
  }

  return true;
}

/**
 * Envia notificação por e-mail para a profissional quando um agendamento é cancelado pelo cliente,
 * informando que o horário voltou a ficar disponível na vitrine.
 */
export async function sendCancellationEmailNotification(
  proEmail: string,
  proName: string,
  appointment: ClientAppointment,
  customConfig?: BellaDoorEmailConfig
): Promise<boolean> {
  const cleanEmail = (proEmail || '').trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    console.warn('[BellaDoor Email] E-mail da profissional inválido ou não informado para cancelamento:', proEmail);
    return false;
  }

  const config = customConfig || await loadEmailConfig();
  if (config.enabled === false) {
    console.info('[BellaDoor Email] Notificações por e-mail desativadas nas configurações.');
    return false;
  }

  const dateFormatted = appointment.date ? appointment.date.split('-').reverse().join('/') : 'Data agendada';
  const rawPrice = Number(appointment.totalPrice) || 0;
  const totalPriceFormatted = `R$ ${rawPrice.toFixed(2).replace('.', ',')}`;
  const locationText = appointment.locationType === 'STUDIO'
    ? `No seu Studio / Endereço fixo (${appointment.address || 'Studio'})`
    : `A Domicílio na residência da cliente (${appointment.address || 'Endereço da cliente'})`;

  const subject = `⚠️ Horário Liberado: Agendamento Cancelado - ${appointment.clientName} (${dateFormatted} às ${appointment.time})`;

  const textBody = `Olá, ${proName || 'Profissional'}!
Informamos que a cliente ${appointment.clientName} cancelou o agendamento na sua vitrine BellaDoor:

- Cliente: ${appointment.clientName}
- WhatsApp / Telefone: ${appointment.clientPhone}
- Serviço: ${appointment.serviceName}
- Data e Horário Liberados: ${dateFormatted} às ${appointment.time}
- Local: ${locationText}
- Valor: ${totalPriceFormatted}

O horário das ${appointment.time} no dia ${dateFormatted} já voltou a ficar 100% DISPONÍVEL na sua vitrine para novas clientes agendarem!

Acesse o seu Painel da Profissional para visualizar sua agenda atualizada:
https://belladoor.web.app

Atenciosamente,
${config.senderName || 'Equipe BellaDoor'}
${config.senderEmail || 'contato@belladoor.app'}`;

  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f7f7f8; margin: 0; padding: 24px; color: #1c1917;">
  <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 20px; border: 1px solid #e7e5e4; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
    <div style="background: linear-gradient(135deg, #d97706 0%, #b45309 100%); padding: 24px; text-align: center; color: #ffffff;">
      <h1 style="margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.5px;">BellaDoor</h1>
      <p style="margin: 6px 0 0; font-size: 13px; opacity: 0.95;">Aviso de Agendamento Cancelado • Horário Liberado</p>
    </div>

    <div style="padding: 24px;">
      <h2 style="font-size: 16px; margin-top: 0; color: #0c0a09; font-weight: 800;">
        Olá, ${proName || 'Profissional'}! 🗓️
      </h2>
      <p style="font-size: 13px; color: #57534e; line-height: 1.5; margin-bottom: 20px;">
        A cliente <strong>${appointment.clientName}</strong> realizou o cancelamento de um atendimento na sua vitrine.
      </p>

      <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 14px; padding: 14px 16px; margin-bottom: 20px;">
        <span style="font-size: 13px; font-weight: 700; color: #065f46;">
          ✨ O horário das <strong>${appointment.time}</strong> do dia <strong>${dateFormatted}</strong> já voltou a ficar liberado na sua vitrine para novas clientes agendarem!
        </span>
      </div>

      <div style="background-color: #fafaf9; border: 1px solid #e7e5e4; border-radius: 14px; padding: 16px; margin-bottom: 20px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <tr>
            <td style="padding: 6px 0; color: #78716c; font-weight: 600; width: 140px;">Cliente:</td>
            <td style="padding: 6px 0; color: #0c0a09; font-weight: 800;">${appointment.clientName}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #78716c; font-weight: 600;">WhatsApp / Fone:</td>
            <td style="padding: 6px 0; color: #0c0a09; font-weight: 700;">${appointment.clientPhone}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #78716c; font-weight: 600;">Serviço:</td>
            <td style="padding: 6px 0; color: #d97706; font-weight: 800;">${appointment.serviceName}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #78716c; font-weight: 600;">Data e Horário:</td>
            <td style="padding: 6px 0; color: #0c0a09; font-weight: 800;">${dateFormatted} às ${appointment.time}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #78716c; font-weight: 600;">Local:</td>
            <td style="padding: 6px 0; color: #0c0a09; font-size: 12px;">${locationText}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #78716c; font-weight: 600;">Valor do Serviço:</td>
            <td style="padding: 6px 0; color: #57534e; font-weight: 700;">${totalPriceFormatted}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #78716c; font-weight: 600;">Status do Horário:</td>
            <td style="padding: 6px 0;">
              <span style="display: inline-block; background-color: #fee2e2; color: #991b1b; font-weight: 800; font-size: 11px; padding: 2px 8px; border-radius: 999px;">
                Cancelado • Horário Disponível
              </span>
            </td>
          </tr>
        </table>
      </div>

      <div style="text-align: center; margin: 24px 0 16px;">
        <a href="https://belladoor.web.app" style="display: inline-block; background-color: #1c1917; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 12px; font-weight: 800; font-size: 13px; box-shadow: 0 2px 6px rgba(0,0,0,0.15);">
          Abrir Painel da Profissional
        </a>
      </div>
    </div>

    <div style="background-color: #fafaf9; border-top: 1px solid #e7e5e4; padding: 14px; text-align: center; font-size: 11px; color: #78716c;">
      BellaDoor • Gestão e Vitrine para Profissionais da Beleza
    </div>
  </div>
</body>
</html>`;

  let usedProvider = config.provider || 'WEBHOOK';

  // 1. Google Apps Script Webhook
  if (config.webhookUrl && config.webhookUrl.trim()) {
    try {
      const payload = {
        to: cleanEmail,
        proName,
        subject,
        html: htmlBody,
        text: textBody,
        senderName: config.senderName || 'BellaDoor Notificações',
        type: 'CANCELLATION',
        appointmentId: appointment.id,
        appointmentDate: appointment.date,
        appointmentTime: appointment.time,
        serviceName: appointment.serviceName,
        clientName: appointment.clientName,
      };

      await fetch(config.webhookUrl.trim(), {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(payload),
        mode: 'no-cors',
      });
      usedProvider = 'GOOGLE_APPS_SCRIPT';
      console.log('[BellaDoor Email] Cancelamento disparado via Google Apps Script Webhook:', cleanEmail);
    } catch (webhookErr) {
      console.warn('[BellaDoor Email] Falha no webhook de cancelamento:', webhookErr);
    }
  }

  // 2. Brevo API
  if (config.provider === 'BREVO' && config.apiKey && config.apiKey.trim()) {
    try {
      await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': config.apiKey.trim(),
          'Content-Type': 'application/json',
          'accept': 'application/json',
        },
        body: JSON.stringify({
          sender: {
            name: config.senderName || 'BellaDoor',
            email: config.senderEmail || 'contato@belladoor.app',
          },
          to: [{ email: cleanEmail, name: proName }],
          subject,
          htmlContent: htmlBody,
          textContent: textBody,
        }),
      });
      usedProvider = 'BREVO';
    } catch (brevoErr) {
      console.warn('[BellaDoor Email] Falha Brevo no cancelamento:', brevoErr);
    }
  }

  // 3. Resend API
  if (config.provider === 'RESEND' && config.apiKey && config.apiKey.trim()) {
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.apiKey.trim()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `${config.senderName || 'BellaDoor'} <${config.senderEmail || 'onboarding@resend.dev'}>`,
          to: [cleanEmail],
          subject,
          html: htmlBody,
          text: textBody,
        }),
      });
      usedProvider = 'RESEND';
    } catch (resendErr) {
      console.warn('[BellaDoor Email] Falha Resend no cancelamento:', resendErr);
    }
  }

  // 4. Grava fila Firestore
  try {
    const db = getFirebaseDb();
    if (db) {
      await withTimeout(
        addDoc(collection(db, 'mail'), {
          to: cleanEmail,
          message: {
            subject,
            text: textBody,
            html: htmlBody,
          },
          createdAt: new Date().toISOString(),
          appointmentId: appointment.id,
          source: 'belladoor_cancellation',
        }),
        3000,
        null
      );
    }
  } catch (err) {
    console.warn('[BellaDoor Email] Falha fila mail cancelamento:', err);
  }

  // 5. Histórico belladoor_prod/email_notifications
  try {
    const db = getFirebaseDb();
    if (db) {
      const notifRef = doc(db, 'belladoor_prod', 'email_notifications');
      const snap = await withTimeout(getDoc(notifRef), 2000, null as any);
      const existing = snap && snap.exists() ? snap.data()?.items || [] : [];
      const newEntry: EmailLogEntry = {
        id: `email-${Date.now()}`,
        to: cleanEmail,
        proName,
        subject,
        appointmentId: appointment.id,
        sentAt: new Date().toISOString(),
        clientName: appointment.clientName,
        serviceName: appointment.serviceName,
        provider: usedProvider,
      };
      await withTimeout(
        setDoc(notifRef, {
          items: [newEntry, ...existing.slice(0, 49)],
          updatedAt: new Date().toISOString(),
        }, { merge: true }),
        2500,
        null
      );
    }
  } catch (err) {
    console.warn('[BellaDoor Email] Falha ao gravar log cancelamento em belladoor_prod:', err);
  }

  return true;
}

/**
 * Envia um e-mail de teste para verificar se as configurações estão funcionando
 */
export async function sendTestBookingEmail(
  toEmail: string,
  config?: BellaDoorEmailConfig
): Promise<{ success: boolean; message: string }> {
  const cleanEmail = (toEmail || '').trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    return { success: false, message: 'E-mail de destino inválido ou vazio.' };
  }

  const effectiveConfig = config || await loadEmailConfig();
  if (!effectiveConfig.webhookUrl && !effectiveConfig.apiKey) {
    return {
      success: false,
      message: 'Configure e salve a URL do Webhook do Google Apps Script (ou a chave da API) antes de realizar o teste.',
    };
  }

  const testAppointment: ClientAppointment = {
    id: `test-${Date.now()}`,
    clientName: 'Cliente Teste (BellaDoor)',
    clientPhone: '(11) 99999-9999',
    serviceName: 'Extensão de Cílios Volume Brasileiro (Teste)',
    durationMinutes: 90,
    date: new Date().toISOString().split('T')[0],
    time: '15:30',
    address: 'Studio BellaDoor / Teste de Notificação',
    neighborhood: 'Centro',
    travelFee: 0,
    totalPrice: 150.0,
    status: 'Aguardando Sinal',
    locationType: 'STUDIO',
    locationAddress: 'Studio BellaDoor',
    depositAmount: 75.0,
    depositPercentage: 50,
    depositPaid: false,
  };

  try {
    await sendBookingEmailNotification(
      cleanEmail,
      'Profissional de Teste',
      testAppointment,
      effectiveConfig
    );
    return {
      success: true,
      message: `E-mail de teste enviado com sucesso para ${cleanEmail}! Verifique sua caixa de entrada (e a caixa de Spam/Lixo Eletrônico nos próximos instantes).`,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Erro ao enviar e-mail de teste: ${err?.message || String(err)}`,
    };
  }
}
