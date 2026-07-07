import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'
import nodemailer from 'nodemailer'

let sendEmail: typeof import('../mailer.js').sendEmail
let fakeSendMail: ReturnType<typeof vi.fn>

beforeAll(async () => {
  process.env.SMTP_HOST = 'smtp.test.com'
  process.env.SMTP_PORT = '587'
  process.env.SMTP_SECURE = 'false'
  process.env.SMTP_USER = 'test_user'
  process.env.SMTP_PASS = 'test_pass'
  process.env.EMAIL_FROM = 'noreply@plopkit.com'

  fakeSendMail = vi.fn()
  vi.spyOn(nodemailer as any, 'createTransport').mockReturnValue({ sendMail: fakeSendMail })

  // mailer.ts calls createTransport() once at module load — importing it
  // here, after the spy is set up, is what makes the spy take effect.
  const mailer = await import('../mailer.js')
  sendEmail = mailer.sendEmail
})

beforeEach(() => {
  fakeSendMail.mockClear()
})

describe('mailer — transporter configuration', () => {
  it('configures the transporter with the correct host, port, and auth from env vars', () => {
    expect(nodemailer.createTransport).toHaveBeenCalledWith({
      host: 'smtp.test.com',
      port: 587,
      secure: false,
      auth: {
        user: 'test_user',
        pass: 'test_pass',
      },
    })
  })
})

describe('sendEmail', () => {
  it('calls transporter.sendMail with the from address, to, subject, and html', async () => {
    await sendEmail({ to: 'user@example.com', subject: 'Welcome', html: '<p>Hi</p>' })

    expect(fakeSendMail).toHaveBeenCalledWith({
      from: 'noreply@plopkit.com',
      to: 'user@example.com',
      subject: 'Welcome',
      html: '<p>Hi</p>',
    })
  })
})