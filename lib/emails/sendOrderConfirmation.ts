import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

interface OrderConfirmationParams {
  to:             string
  firstname:      string
  invoiceNumber:  string
  planName:       string
  amountTtc:      number
  dueDate:        Date
  invoicePdf:     Uint8Array
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function fmt(n: number): string {
  return n.toFixed(2).replace('.', ',') + ' €'
}

export async function sendOrderConfirmation(params: OrderConfirmationParams): Promise<void> {
  const { to, firstname, invoiceNumber, planName, amountTtc, dueDate, invoicePdf } = params

  const iban        = process.env.TALENTH_IBAN        ?? 'À renseigner'
  const companyName = process.env.TALENTH_COMPANY_NAME ?? 'Talenth'
  // Resend requiert un domaine vérifié pour le FROM — utilise onboarding@resend.dev si pas encore configuré
  const fromEmail   = process.env.TALENTH_EMAIL_FROM ?? 'onboarding@resend.dev'
  const replyTo     = process.env.TALENTH_EMAIL_CONTACT ?? 'talenthsupport@gmail.com'

  const htmlBody = `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">

        <!-- Header -->
        <tr>
          <td style="background:#1E4A8C;padding:24px 32px;">
            <p style="margin:0;color:#ffffff;font-size:22px;font-weight:bold;">${companyName}</p>
            <p style="margin:4px 0 0;color:rgba(255,255,255,0.7);font-size:12px;">Pilotage OETH simplifié</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            <p style="margin:0 0 16px;font-size:16px;color:#1A1A2E;">Bonjour ${firstname},</p>
            <p style="margin:0 0 24px;font-size:14px;color:#6B7280;line-height:1.6;">
              Merci pour votre commande <strong>Talenth — Plan ${planName}</strong>.<br>
              Votre facture est jointe à cet email. Pour finaliser votre accès, effectuez votre virement
              en indiquant la référence ci-dessous.
            </p>

            <!-- Info Box -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#EBF2FA;border-radius:8px;margin-bottom:24px;">
              <tr>
                <td style="padding:20px 24px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding:4px 0;">
                        <span style="font-size:13px;color:#6B7280;">Référence à indiquer</span><br>
                        <strong style="font-size:15px;color:#1E4A8C;">${invoiceNumber}</strong>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:4px 0;">
                        <span style="font-size:13px;color:#6B7280;">IBAN</span><br>
                        <strong style="font-size:13px;color:#1A1A2E;">${iban}</strong>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:4px 0;">
                        <span style="font-size:13px;color:#6B7280;">Montant TTC</span><br>
                        <strong style="font-size:15px;color:#1A1A2E;">${fmt(amountTtc)}</strong>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:4px 0;">
                        <span style="font-size:13px;color:#6B7280;">Échéance</span><br>
                        <strong style="font-size:13px;color:#1A1A2E;">${fmtDate(dueDate)}</strong>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <p style="font-size:14px;color:#6B7280;line-height:1.6;">
              Votre accès sera activé <strong>sous 24h ouvrées</strong> après réception de votre virement.<br>
              Vous recevrez un email de confirmation avec vos identifiants de connexion.
            </p>

            <p style="font-size:13px;color:#9CA3AF;margin-top:24px;">
              Une question ? Répondez directement à cet email, nous vous répondrons rapidement.
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#F8FAFC;padding:16px 32px;border-top:1px solid #E2E8F0;">
            <p style="margin:0;font-size:11px;color:#9CA3AF;text-align:center;">
              ${companyName} · ${replyTo}
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

  await resend.emails.send({
    from:        `${companyName} <${fromEmail}>`,
    to:          [to],
    replyTo:     replyTo,
    subject:     `Votre commande Talenth — Facture ${invoiceNumber}`,
    html:        htmlBody,
    attachments: [{
      filename:    `Facture-${invoiceNumber}.pdf`,
      content:     Buffer.from(invoicePdf),
    }],
  })
}
