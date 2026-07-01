import { sendEmail } from '../lib/mailer.js'

export async function sendMagicLinkEmail(email: string, url: string) {
  await sendEmail({
    to: email,
    subject: 'Your PlopKit sign-in link',
    html: `
      <p>Click the link below to sign in to PlopKit:</p>
      <p><a href="${url}">Sign in to PlopKit</a></p>
      <p>If you didn't request this, you can safely ignore this email.</p>
    `,
  })
}