import nodemailer from 'nodemailer'
import env from 'dotenv'
env.config()
const SMTP_PORT = process.env.SMTP_PORT
const SMTP_HOST = process.env.SMTP_HOST
const SMTP_USER = process.env.SMTP_USER
const SMTP_PASS = process.env.SMTP_PASS
const TO_EMAIL = process.env.TO_EMAIL

export let EMAIL_ENABLE = true

if (!SMTP_USER || !SMTP_PASS || !TO_EMAIL) {
  console.log(
    '⚠️ 邮件发送配置不完整，邮件功能已禁用。请设置 SMTP_USER, SMTP_PASS, TO_EMAIL 环境变量以启用邮件功能。',
  )
  EMAIL_ENABLE = false
}

export function createMailSender() {
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: parseInt(SMTP_PORT || '465'),
    secure: true,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  })
  return transporter
}

// interface Result {
//     Data: string,
//     Description: string
// }

export async function sendCheckinResult(result) {
  if (!EMAIL_ENABLE) {
    return
  }
  try {
    console.log('📧 正在发送签到结果邮件...')
    const transporter = createMailSender()
    const info = await transporter.sendMail({
      from: `"Ikuuu" <${SMTP_USER}>`,
      to: TO_EMAIL,
      subject: `签到结果 - ${result.Data}`,
      text: `${result.Description || JSON.stringify(result)}`,
    })
    console.log('✅ 邮件已发送:', info.messageId)
  } catch (err) {
    console.warn(
      '⚠️ 发送签到结果邮件失败:',
      err?.message || err,
    )
  }
}
