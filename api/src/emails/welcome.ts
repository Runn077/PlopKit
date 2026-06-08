import resend from '../lib/resend.js'

export async function sendWelcomeEmail(email: string, name: string) {
  await resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to: email,
    subject: 'Welcome to PlopKit',
    html: `
      <p>Hi ${name},</p>
      <p>Welcome to PlopKit!</p>
      <p><a href="https://plopkit.com/login">Go to your account</a></p>
    `,
  })
}