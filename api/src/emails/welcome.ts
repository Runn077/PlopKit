import { sendEmail } from '../lib/mailer.js'

export async function sendWelcomeEmail(email: string, name: string) {
  await sendEmail({
    to: email,
    subject: 'Welcome to PlopKit',
    html: `
      <p>Hi ${name},</p>
      <p>Welcome to PlopKit!</p>
      <p><a href="https://plopkit.com/login">Go to your account</a></p>
    `,
  })
}