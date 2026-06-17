import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

interface AdminNotificationParams {
  invoiceNumber:  string
  companyName:    string
  siret:          string
  contactName:    string
  contactEmail:   string
  contactFunction?: string
  planName:       string
  billingCycleLabel: string
  amountTtc:      number
  dueDate:        Date
  activationToken: string
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

  const htmlBody = `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">

        <tr>
          <td style="background:#1E4A8C;padding:20px 32px;">
            <p style="margin:0;color:#ffffff;font-size:16px;font-weight:bold;">
              Nouvelle commande Talenth
            </p>
          </td>
        </tr>

        <tr>
          <td style="padding:28px 32px;">
            <p style="margin:0 0 20px;font-size:15px;color:#1A1A2E;">
              Bonjour Sergio, une nouvelle commande vient d'être passée.
            </p>

            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E2E8F0;border-radius:8px;overflow:hidden;margin-bottom:24px;">
              ${[
                ['Entreprise',  params.companyName],
                ['SIRET',       params.siret],
                ['Contact',     `${params.contactName}${params.contactFunction ? ' — ' + params.contactFunction : ''}`],
                ['Email',       params.contactEmail],
                ['Plan',        `${params.planName} (${params.billingCycleLabel})`],
                ['Montant TTC', fmt(params.amountTtc)],
                ['Facture',     params.invoiceNumber],
                ['Échéance',    fmtDate(params.dueDate)],
              ].map(([label, value], i) => `
              <tr style="background:${i % 2 === 0 ? '#F8FAFC' : '#ffffff'}">
                <td style="padding:10px 16px;font-size:12px;color:#6B7280;font-weight:bold;width:35%;">${label}</td>
                <td style="padding:10px 16px;font-size:13px;color:#1A1A2E;">${value}</td>
              </tr>`).join('')}
            </table>

            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center">
                  <a href="${activationUrl}"
                     style="display:inline-block;background:#16A34A;color:#ffffff;font-weight:bold;font-size:15px;padding:14px 32px;border-radius:10px;text-decoration:none;">
                    Activer ce compte
                  </a>
                </td>
              </tr>
            </table>

            <p style="font-size:11px;color:#9CA3AF;margin-top:16px;text-align:center;">
              Ce lien est à usage unique et sécurisé.
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
    subject: `Nouvelle commande — ${params.companyName} — Plan ${params.planName}`,
    html:    htmlBody,
  })
}
