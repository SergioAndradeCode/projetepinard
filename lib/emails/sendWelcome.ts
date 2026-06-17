import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

interface WelcomeEmailParams {
  to:            string
  firstname:     string
  tempPassword:  string
}

export async function sendWelcome(params: WelcomeEmailParams): Promise<void> {
  const { to, firstname, tempPassword } = params

  const appUrl      = process.env.NEXT_PUBLIC_APP_URL      ?? 'http://localhost:3000'
  const companyName = process.env.TALENTH_COMPANY_NAME ?? 'Talenth'
  const fromEmail   = process.env.TALENTH_EMAIL_FROM   ?? 'onboarding@resend.dev'
  const replyTo     = process.env.TALENTH_EMAIL_CONTACT ?? 'talenthsupport@gmail.com'

  const htmlBody = `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">

        <tr>
          <td style="background:#1E4A8C;padding:24px 32px;">
            <p style="margin:0;color:#ffffff;font-size:22px;font-weight:bold;">${companyName}</p>
            <p style="margin:4px 0 0;color:rgba(255,255,255,0.7);font-size:12px;">Votre accès est activé</p>
          </td>
        </tr>

        <tr>
          <td style="padding:32px;">
            <p style="margin:0 0 8px;font-size:16px;color:#1A1A2E;">Bonjour ${firstname},</p>

            <table width="100%" cellpadding="0" cellspacing="0" style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:8px;margin:20px 0;">
              <tr>
                <td style="padding:16px 20px;">
                  <p style="margin:0;font-size:15px;font-weight:bold;color:#15803D;">
                    Votre accès Talenth est maintenant actif !
                  </p>
                </td>
              </tr>
            </table>

            <p style="font-size:14px;color:#6B7280;line-height:1.6;margin-bottom:24px;">
              Vous pouvez maintenant accéder à votre espace de pilotage OETH.
              Connectez-vous avec les identifiants ci-dessous.
            </p>

            <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;margin-bottom:24px;">
              <tr>
                <td style="padding:16px 20px;">
                  <p style="margin:0 0 8px;font-size:12px;color:#6B7280;font-weight:bold;">IDENTIFIANTS DE CONNEXION</p>
                  <p style="margin:0 0 4px;font-size:13px;color:#1A1A2E;">Email : <strong>${to}</strong></p>
                  <p style="margin:0;font-size:13px;color:#1A1A2E;">Mot de passe temporaire : <strong style="font-family:monospace;background:#E2E8F0;padding:2px 6px;border-radius:4px;">${tempPassword}</strong></p>
                </td>
              </tr>
            </table>

            <p style="font-size:13px;color:#9CA3AF;margin-bottom:20px;">
              Vous serez invité à changer votre mot de passe lors de votre première connexion.
            </p>

            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center">
                  <a href="${appUrl}/login"
                     style="display:inline-block;background:#1E4A8C;color:#ffffff;font-weight:bold;font-size:14px;padding:12px 28px;border-radius:10px;text-decoration:none;">
                    Accéder à mon espace Talenth
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

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
    from:    `${companyName} <${fromEmail}>`,
    to:      [to],
    replyTo: replyTo,
    subject: `Votre accès Talenth est activé — Bienvenue !`,
    html:    htmlBody,
  })
}
