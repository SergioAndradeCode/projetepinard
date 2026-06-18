import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

interface WelcomeEmailParams {
  to:            string
  firstname:     string
  tempPassword:  string
}

export async function sendWelcome(params: WelcomeEmailParams): Promise<void> {
  const { to, firstname, tempPassword } = params

  const appUrl      = process.env.NEXT_PUBLIC_APP_URL   ?? 'http://localhost:3000'
  const companyName = process.env.TALENTH_COMPANY_NAME  ?? 'Talenth'
  const fromEmail   = process.env.TALENTH_EMAIL_FROM    ?? 'onboarding@resend.dev'
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

        <!-- Header bleu nuit + liseré vert marque -->
        <tr>
          <td style="background:#0F1F3C;padding:24px 32px 20px;">
            <p style="margin:0;color:#ffffff;font-size:22px;font-weight:800;letter-spacing:-0.3px;">${companyName}</p>
            <p style="margin:6px 0 0;color:rgba(255,255,255,0.55);font-size:12px;">Votre accès est activé</p>
          </td>
        </tr>
        <tr>
          <td style="background:#19BF34;height:4px;padding:0;font-size:0;line-height:0;">&nbsp;</td>
        </tr>

        <tr>
          <td style="padding:32px;">
            <p style="margin:0 0 20px;font-size:17px;font-weight:700;color:#1A1A2E;">Bonjour ${firstname},</p>

            <!-- Bandeau de confirmation vert marque -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#F0FDF4;border:1px solid #19BF34;border-radius:8px;margin-bottom:24px;">
              <tr>
                <td style="padding:16px 20px;">
                  <p style="margin:0;font-size:15px;font-weight:700;color:#19BF34;">
                    Votre acces Talenth est maintenant actif !
                  </p>
                  <p style="margin:6px 0 0;font-size:13px;color:#6B7280;">
                    Pilotage OETH simplifie - acces immediat a votre espace.
                  </p>
                </td>
              </tr>
            </table>

            <p style="font-size:14px;color:#6B7280;line-height:1.7;margin-bottom:24px;">
              Connectez-vous avec les identifiants ci-dessous.<br>
              Vous serez invité à changer votre mot de passe lors de votre premiere connexion.
            </p>

            <!-- Identifiants -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;margin-bottom:28px;">
              <tr>
                <td style="padding:18px 22px;">
                  <p style="margin:0 0 12px;font-size:11px;font-weight:800;color:#1E4A8C;letter-spacing:0.08em;text-transform:uppercase;">
                    Identifiants de connexion
                  </p>
                  <p style="margin:0 0 6px;font-size:13px;color:#1A1A2E;">
                    Email : <strong>${to}</strong>
                  </p>
                  <p style="margin:0;font-size:13px;color:#1A1A2E;">
                    Mot de passe temporaire :
                    <strong style="font-family:monospace;background:#E2E8F0;padding:3px 8px;border-radius:5px;font-size:14px;">${tempPassword}</strong>
                  </p>
                </td>
              </tr>
            </table>

            <!-- CTA bleu -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center">
                  <a href="${appUrl}/login"
                     style="display:inline-block;background:#1E4A8C;color:#ffffff;font-weight:700;font-size:14px;padding:13px 32px;border-radius:10px;text-decoration:none;letter-spacing:0.01em;">
                    Acceder a mon espace Talenth
                  </a>
                </td>
              </tr>
            </table>

            <p style="font-size:12px;color:#9CA3AF;margin-top:24px;text-align:center;">
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
    from:    `${companyName} <${fromEmail}>`,
    to:      [to],
    replyTo: replyTo,
    subject: `Votre acces Talenth est active - Bienvenue !`,
    html:    htmlBody,
  })
}
