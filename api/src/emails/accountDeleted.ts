import resend from '../lib/resend.js'

export async function sendAccountDeletedEmail(email: string, name: string) {
  await resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to: email,
    subject: 'Your PlopKit account has been deleted',
    html: `
      <p>Hi ${name},</p>
      <p>Your PlopKit account has been deleted. Sorry to see you go.</p>
    `,
  })
}