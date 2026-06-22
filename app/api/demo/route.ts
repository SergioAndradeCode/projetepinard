import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { z } from 'zod'

const resend = new Resend(process.env.RESEND_API_KEY)

const schema = z.object({
  nom:     z.string().min(2).max(80),
  email:   z.string().email(),
  message: z.string().min(10).max(2000),
})

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Corps de requête invalide' }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Données invalides' }, { status: 422 })
  }

  const { nom, email, message } = parsed.data
  const contactEmail = process.env.TALENTH_EMAIL_CONTACT ?? 'contact@talenth.fr'
  const fromEmail    = process.env.TALENTH_EMAIL_FROM    ?? 'onboarding@resend.dev'

  try {
    await resend.emails.send({
      from:    `Talenth <${fromEmail}>`,
      to:      [contactEmail],
      replyTo: email,
      subject: `Demande de démonstration - ${nom}`,
      html: `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:Inter,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(30,74,140,0.08);">
        <tr>
          <td style="background:#0F1F3C;padding:24px 32px 20px;">
            <p style="margin:0;color:#ffffff;font-size:22px;font-weight:800;">Talenth</p>
            <p style="margin:6px 0 0;color:rgba(255,255,255,0.55);font-size:12px;">Nouvelle demande de démonstration</p>
          </td>
        </tr>
        <tr><td style="background:#19BF34;height:4px;padding:0;font-size:0;line-height:0;">&nbsp;</td></tr>
        <tr>
          <td style="padding:32px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;margin-bottom:24px;">
              <tr><td style="padding:18px 22px;">
                <p style="margin:0 0 10px;font-size:13px;color:#1A1A2E;"><strong>Nom :</strong> ${nom}</p>
                <p style="margin:0;font-size:13px;color:#1A1A2E;"><strong>Email :</strong> <a href="mailto:${email}" style="color:#1E4A8C;">${email}</a></p>
              </td></tr>
            </table>
            <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:#6B7280;text-transform:uppercase;letter-spacing:0.05em;">Message</p>
            <p style="margin:0;font-size:14px;color:#1A1A2E;line-height:1.7;white-space:pre-wrap;">${message.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
            <p style="margin:24px 0 0;font-size:12px;color:#9CA3AF;">Répondez directement à cet email pour contacter ${nom}.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Erreur envoi email' }, { status: 500 })
  }
}
