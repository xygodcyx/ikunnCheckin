import CryptoJS from 'crypto-js'
import env from 'dotenv'
import { sendCheckinResult } from './lib/email-utils.js'
env.config()
const baseURL = process.env.IKUUU_API_PATH
const cookiecloudUrl = process.env.COOKIE_CLOUD_API_PATH
const cookiecloudUUID = process.env.COOKIE_CLOUD_UUID
const cookiecloudPassword =
  process.env.COOKIE_CLOUD_PASSWORD

let retryId = 0
let retryCounter = 0

function cookie_decrypt(uuid, encrypted, password) {
  const the_key = CryptoJS.MD5(uuid + '-' + password)
    .toString()
    .substring(0, 16)
  const decrypted = CryptoJS.AES.decrypt(
    encrypted,
    the_key,
  ).toString(CryptoJS.enc.Utf8)
  const parsed = JSON.parse(decrypted)
  return parsed
}

async function get_cookie() {
  const url = new URL(
    `/cookiecloud/get/${cookiecloudUUID}`,
    cookiecloudUrl,
  ).toString()
  const res = await fetch(url, {
    method: 'get',
  })
  if (!cookiecloudUUID) {
    console.warn('没有cookiecloudUUID')
    return
  }
  if (!cookiecloudPassword) {
    console.warn('没有cookiecloudPassword')
    return
  }
  const data = await res.json()
  const allCookie = cookie_decrypt(
    cookiecloudUUID,
    data.encrypted,
    cookiecloudPassword,
  )
  let cookie = ''
  const ikuuuCookie1 = allCookie['cookie_data']['ikuuu.org']
  const ikuuuCookie2 =
    allCookie['cookie_data']['.ikuuu.org']
  if (!ikuuuCookie1 || !ikuuuCookie2) {
    console.warn(
      '没有 ikuuu.org cookie, 请正确配置cookiecloud',
    )
    return
  }

  ;[...ikuuuCookie1, ...ikuuuCookie2].forEach(
    (cookieObj, i, arr) => {
      cookie +=
        `${cookieObj['name']}=${cookieObj['value']}` +
        (i < arr.length - 1 ? '; ' : '')
    },
  )

  return cookie
}
async function checkin(cookies) {
  try {
    const response = await fetch(
      `${baseURL}/user/checkin`,
      {
        headers: {
          accept:
            'application/json, text/javascript, */*; q=0.01',
          'x-requested-with': 'XMLHttpRequest',
          cookie: cookies,
        },
        method: 'POST',
      },
    )

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Checkin failed:', error)
    return {
      msg: `签到失败, 脚本报错 :${error.message}`,
      ret: -1,
    }
  }
}

async function main() {
  if (!baseURL) {
    console.error(
      'No IKUUU_API_PATH found in environment variable',
    )
    return
  }
  if (!cookiecloudUrl) {
    console.error(
      'No COOKIE_CLOUD_API_PATH found in environment variable',
    )
    return
  }

  const cookies = await get_cookie()

  if (!cookies) {
    console.warn('没有cookies')
    return
  }

  const checkinResult = await checkin(cookies)

  const msg = `签到失败, 将在 ${new Date(Date.now() + 1000 * 60 * 30).toLocaleTimeString()} 时进行重试 (${'retryCounter'} / 10)`

  if (checkinResult) {
    console.log(`Checkin result :`, checkinResult)
  }

  if (checkinResult.ret === -1) {
    console.warn(msg.replace('retryCounter', retryCounter))
  }

  await sendCheckinResult({
    Data: checkinResult.ret
      ? '签到成功'
      : checkinResult.ret === -1
        ? msg.replace('retryCounter', retryCounter)
        : '签到失败',
    Description: checkinResult.msg,
  })

  if (checkinResult.ret === -1) {
    console.log('Retry in 30min...')
    retryId = setInterval(
      async () => {
        const checkinResult = await checkin(cookies)

        if (checkinResult) {
          console.log(
            `Retry Checkin result :`,
            checkinResult,
          )
        }

        if (checkinResult.ret === -1 && retryCounter < 10) {
          retryCounter++
          console.warn(
            msg.replace('retryCounter', retryCounter),
          )
        }

        await sendCheckinResult({
          Data: checkinResult.ret
            ? '重试成功'
            : checkinResult.ret === -1
              ? msg.replace('retryCounter', retryCounter)
              : '签到失败',
          Description: checkinResult.msg,
        })

        if (retryCounter >= 10) {
          clearInterval(retryId)
        }
      },
      1000 * 60 * 30,
    )
  }
}

main().catch(console.error)
