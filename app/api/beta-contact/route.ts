import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { z } from 'zod'

const resend = new Resend(process.env.RESEND_API_KEY)

const schema = z.object({
  email: z.string().email(),
})

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Corps invalide' }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Email invalide' }, { status: 422 })
  }

  const { email } = parsed.data
  const fromEmail    = process.env.TALENTH_EMAIL_FROM    ?? 'onboarding@resend.dev'
  const contactEmail = process.env.TALENTH_EMAIL_CONTACT ?? 'contact@talenth.fr'

  await resend.emails.send({
    from:    `Talenth <${fromEmail}>`,
    to:      [contactEmail],
    replyTo: email,
    subject: 'Nouvelle candidature bêta testeur',
    html: `
      <p>Nouvelle candidature bêta reçue depuis <strong>talenth.fr/beta</strong></p>
      <p><strong>Email :</strong> <a href="mailto:${email}">${email}</a></p>
    `,
  })

  await resend.emails.send({
    from:    `Sergio — Talenth <${fromEmail}>`,
    to:      [email],
    subject: 'On a bien reçu votre candidature',
    html: `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:Inter,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;padding:32px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(8,80,65,0.10);">
        <tr>
          <td style="background:#085041;padding:24px 32px 20px;">
            <p style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">Talenth</p>
            <p style="margin:6px 0 0;color:rgba(255,255,255,0.55);font-size:12px;">Programme bêta testeur</p>
          </td>
        </tr>
        <tr><td style="background:#5DCAA5;height:3px;padding:0;font-size:0;line-height:0;">&nbsp;</td></tr>
        <tr>
          <td style="padding:32px;">
            <p style="margin:0 0 16px;font-size:16px;font-weight:600;color:#1A1A2E;">Bonjour,</p>
            <p style="margin:0 0 16px;font-size:14px;color:#6B7280;line-height:1.7;">
              Merci pour votre intérêt pour le programme bêta de Talenth.fr.
            </p>
            <p style="margin:0 0 24px;font-size:14px;color:#6B7280;line-height:1.7;">
              Je reviens vers vous très prochainement pour la suite. En attendant, n'hésitez pas à répondre à cet email si vous avez des questions.
            </p>
            <p style="margin:0;font-size:14px;color:#1A1A2E;">
              Sergio<br/>
              <a href="mailto:contact@talenth.fr" style="color:#085041;">contact@talenth.fr</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  })

  return NextResponse.json({ success: true })
}
