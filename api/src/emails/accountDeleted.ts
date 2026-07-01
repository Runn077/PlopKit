import { sendEmail } from '../lib/mailer.js'

export async function sendAccountDeletedEmail(email: string, name: string) {
  await sendEmail({
    to: email,
    subject: 'Your PlopKit account has been deleted',
    html: `
      <p>Hi ${name},</p>
      <p>Your PlopKit account has been deleted. Sorry to see you go.</p>
    `,
  })
}