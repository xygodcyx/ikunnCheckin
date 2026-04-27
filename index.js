import CryptoJS from 'crypto-js'
import env from 'dotenv'
env.config()
const baseURL = process.env.IKUUU_API_PATH
const cookiecloudUrl = process.env.COOKIE_CLOUD_API_PATH
const cookiecloudUUID = process.env.COOKIE_CLOUD_UUID
const cookiecloudPassword =
  process.env.COOKIE_CLOUD_PASSWORD

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
  console.log(url)
  const res = await fetch(url, {
    method: 'get',
  })
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
    return null
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

  const checkinResult = await checkin(cookies)

  if (checkinResult) {
    console.log(`Checkin result :`, checkinResult)
  }
}

main().catch(console.error)
