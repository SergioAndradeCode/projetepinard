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

  const iban        = process.env.TALENTH_IBAN         ?? 'À renseigner'
  const bic         = process.env.TALENTH_BIC          ?? 'À renseigner'
  const bankHolder  = process.env.TALENTH_BANK_HOLDER  ?? 'Talenth'
  const companyName = process.env.TALENTH_COMPANY_NAME ?? 'Talenth'
  const fromEmail   = process.env.TALENTH_EMAIL_FROM   ?? 'onboarding@resend.dev'
  const replyTo     = process.env.TALENTH_EMAIL_CONTACT ?? 'talenthsupport@gmail.com'
  const website     = 'https://talenth.fr'

  const htmlBody = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:Inter,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(30,74,140,0.08);">

        <!-- Header bleu nuit + liseré vert -->
        <tr>
          <td style="background:#0F1F3C;padding:24px 32px 20px;">
            <p style="margin:0;color:#ffffff;font-size:22px;font-weight:800;letter-spacing:-0.3px;">${companyName}</p>
            <p style="margin:6px 0 0;color:rgba(255,255,255,0.55);font-size:12px;">Pilotage OETH simplifié</p>
          </td>
        </tr>
        <tr>
          <td style="background:#19BF34;height:4px;padding:0;font-size:0;line-height:0;">&nbsp;</td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            <p style="margin:0 0 6px;font-size:17px;font-weight:700;color:#1A1A2E;">Bonjour ${firstname},</p>
            <p style="margin:0 0 24px;font-size:14px;color:#6B7280;line-height:1.7;">
              Merci pour votre commande <strong style="color:#1A1A2E;">Talenth, Plan ${planName}</strong>.<br>
              Votre facture est jointe. Pour finaliser votre accès, effectuez votre virement
              en indiquant la référence ci-dessous.
            </p>

            <!-- Encadré virement -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#EBF2FA;border-radius:10px;margin-bottom:28px;border:1px solid #d0dff5;">
              <tr>
                <td style="padding:22px 26px;">
                  <p style="margin:0 0 14px;font-size:11px;font-weight:800;color:#1E4A8C;letter-spacing:0.08em;text-transform:uppercase;">
                    Informations de virement
                  </p>
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding:5px 0;font-size:12px;color:#6B7280;width:40%;">Référence obligatoire</td>
                      <td style="padding:5px 0;font-size:14px;font-weight:800;color:#1E4A8C;">${invoiceNumber}</td>
                    </tr>
                    <tr>
                      <td style="padding:5px 0;font-size:12px;color:#6B7280;">Titulaire</td>
                      <td style="padding:5px 0;font-size:13px;font-weight:600;color:#1A1A2E;">${bankHolder}</td>
                    </tr>
                    <tr>
                      <td style="padding:5px 0;font-size:12px;color:#6B7280;">IBAN</td>
                      <td style="padding:5px 0;font-size:13px;font-weight:600;color:#1A1A2E;font-family:monospace;">${iban}</td>
                    </tr>
                    <tr>
                      <td style="padding:5px 0;font-size:12px;color:#6B7280;">BIC / SWIFT</td>
                      <td style="padding:5px 0;font-size:13px;font-weight:600;color:#1A1A2E;font-family:monospace;">${bic}</td>
                    </tr>
                    <tr>
                      <td style="padding:5px 0;font-size:12px;color:#6B7280;">Montant TTC</td>
                      <td style="padding:5px 0;font-size:16px;font-weight:800;color:#1A1A2E;">${fmt(amountTtc)}</td>
                    </tr>
                    <tr>
                      <td style="padding:5px 0;font-size:12px;color:#6B7280;">Echéance</td>
                      <td style="padding:5px 0;font-size:13px;color:#1A1A2E;">${fmtDate(dueDate)}</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <!-- Etape suivante -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#F0FDF4;border:1px solid #bbf7d0;border-radius:8px;margin-bottom:24px;">
              <tr>
                <td style="padding:14px 18px;">
                  <p style="margin:0;font-size:13px;color:#1A1A2E;line-height:1.6;">
                    Votre accès sera activé <strong>sous 24h ouvrées</strong> apres reception de votre virement.<br>
                    Vous recevrez un email avec vos identifiants de connexion.
                  </p>
                </td>
              </tr>
            </table>

            <p style="font-size:12px;color:#9CA3AF;margin:0;">
              Une question ? Répondez directement à cet email.
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#F8FAFC;padding:14px 32px;border-top:1px solid #E2E8F0;">
            <p style="margin:0;font-size:11px;color:#9CA3AF;text-align:center;">
              ${companyName} · <a href="${website}" style="color:#1E4A8C;text-decoration:none;">${website}</a> · ${replyTo}
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
    subject:     `Votre commande Talenth - Facture ${invoiceNumber}`,
    html:        htmlBody,
    attachments: [{
      filename: `Facture-${invoiceNumber}.pdf`,
      content:  Buffer.from(invoicePdf),
    }],
  })
}
