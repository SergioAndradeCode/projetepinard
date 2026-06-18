import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

interface AdminNotificationParams {
  invoiceNumber:     string
  companyName:       string
  siret:             string
  contactName:       string
  contactEmail:      string
  contactFunction?:  string
  planName:          string
  billingCycleLabel: string
  amountTtc:         number
  dueDate:           Date
  activationToken:   string
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function fmt(n: number): string {
  return n.toFixed(2).replace('.', ',') + ' €'
}

export async function sendAdminNotification(params: AdminNotificationParams): Promise<void> {
  const adminEmail  = process.env.TALENTH_ADMIN_EMAIL  ?? 'talenthsupport@gmail.com'
  const appUrl      = process.env.NEXT_PUBLIC_APP_URL  ?? 'http://localhost:3000'
  const fromEmail   = process.env.TALENTH_EMAIL_FROM   ?? 'onboarding@resend.dev'
  const companyName = process.env.TALENTH_COMPANY_NAME ?? 'Talenth'

  const activationUrl = `${appUrl}/admin/activer?token=${params.activationToken}`

  const contactLabel = params.contactFunction
    ? `${params.contactName} (${params.contactFunction})`
    : params.contactName

  const rows: [string, string][] = [
    ['Entreprise',  params.companyName],
    ['SIRET',       params.siret],
    ['Contact',     contactLabel],
    ['Email',       params.contactEmail],
    ['Plan',        `${params.planName} - ${params.billingCycleLabel}`],
    ['Montant TTC', fmt(params.amountTtc)],
    ['Facture',     params.invoiceNumber],
    ['Echeance',    fmtDate(params.dueDate)],
  ]

  const htmlBody = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
</head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:Inter,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(30,74,140,0.08);">

        <!-- Header bleu nuit + liseré vert -->
        <tr>
          <td style="background:#0F1F3C;padding:20px 32px;">
            <p style="margin:0;color:#ffffff;font-size:16px;font-weight:800;">
              Nouvelle commande ${companyName}
            </p>
            <p style="margin:5px 0 0;color:rgba(255,255,255,0.55);font-size:12px;">
              Notification administrateur
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#19BF34;height:4px;padding:0;font-size:0;line-height:0;">&nbsp;</td>
        </tr>

        <tr>
          <td style="padding:28px 32px;">
            <p style="margin:0 0 20px;font-size:14px;color:#1A1A2E;">
              Une nouvelle commande vient d'etre passee. Verifiez les informations et activez le compte.
            </p>

            <!-- Tableau recap -->
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E2E8F0;border-radius:8px;overflow:hidden;margin-bottom:28px;">
              ${rows.map(([label, value], i) => `
              <tr style="background:${i % 2 === 0 ? '#F8FAFC' : '#ffffff'}">
                <td style="padding:10px 16px;font-size:11px;color:#6B7280;font-weight:700;width:35%;text-transform:uppercase;letter-spacing:0.05em;">${label}</td>
                <td style="padding:10px 16px;font-size:13px;font-weight:600;color:#1A1A2E;">${value}</td>
              </tr>`).join('')}
            </table>

            <!-- CTA bleu -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center">
                  <a href="${activationUrl}"
                     style="display:inline-block;background:#1E4A8C;color:#ffffff;font-weight:700;font-size:15px;padding:14px 36px;border-radius:10px;text-decoration:none;letter-spacing:0.01em;">
                    Activer ce compte
                  </a>
                </td>
              </tr>
            </table>

            <p style="font-size:11px;color:#9CA3AF;margin-top:16px;text-align:center;">
              Ce lien est a usage unique et securise.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

  await resend.emails.send({
    from:    `${companyName} <${fromEmail}>`,
    to:      [adminEmail],
    subject: `Nouvelle commande - ${params.companyName} - Plan ${params.planName}`,
    html:    htmlBody,
  })
}
