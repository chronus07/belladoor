import { ClientAppointment } from '../types/belladoor';
import { getFirebaseDb, withTimeout } from '../../lib/firebaseClient';
import { collection, addDoc, doc, setDoc, getDoc } from 'firebase/firestore';

export interface BookingEmailPayload {
  to: string;
  proName?: string;
  appointment: ClientAppointment;
}

/**
 * Envia notificação por e-mail para a profissional quando um novo agendamento é realizado
 */
export async function sendBookingEmailNotification(
  proEmail: string,
  proName: string,
  appointment: ClientAppointment
): Promise<boolean> {
  const cleanEmail = (proEmail || '').trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    console.warn('[BellaDoor Email] E-mail da profissional inválido ou não informado:', proEmail);
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
Você recebeu um novo agendamento na sua plataforma BellaDoor:

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
Equipe BellaDoor
contato@belladoor.app`;

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

  // 1. Grava na fila do Firebase Firestore (coleção 'mail' da extensão oficial Trigger Email)
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

  // 2. Grava histórico na coleção belladoor_prod/email_notifications
  try {
    const db = getFirebaseDb();
    if (db) {
      const notifRef = doc(db, 'belladoor_prod', 'email_notifications');
      const snap = await withTimeout(getDoc(notifRef), 2000, null as any);
      const existing = snap && snap.exists() ? snap.data()?.items || [] : [];
      const newEntry = {
        id: `email-${Date.now()}`,
        to: cleanEmail,
        proName,
        subject,
        appointmentId: appointment.id,
        sentAt: new Date().toISOString(),
        clientName: appointment.clientName,
        serviceName: appointment.serviceName,
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
