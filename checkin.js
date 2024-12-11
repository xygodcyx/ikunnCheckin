async function login(email, password) {
  try {
    const formData = new URLSearchParams({
      host: 'ikuuu.one',
      email: email,
      passwd: password,
      remember_me: 'on',
      code: ''
    });

    const response = await fetch("https://ikuuu.one/auth/login", {
      method: "POST",
      headers: {
        "accept": "application/json, text/javascript, */*; q=0.01",
        "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
        "x-requested-with": "XMLHttpRequest",
      },
      body: formData.toString()
    });

    const cookies = response.headers.get('set-cookie');
    const data = await response.json();

    if (!data.ret) {
      throw new Error(data.msg || 'Login failed');
    }

    return cookies;
  } catch (error) {
    console.error(`Login failed for ${email}:`, error.message);
    return null;
  }
}

async function checkin(cookies) {
  try {
    const response = await fetch("https://ikuuu.one/user/checkin", {
      headers: {
        "accept": "application/json, text/javascript, */*; q=0.01",
        "x-requested-with": "XMLHttpRequest",
        "cookie": cookies,
      },
      method: "POST"
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Checkin failed:', error);
    return null;
  }
}

async function processAccount(account) {
  console.log(`Processing account: ${account.email}`);

  const cookies = await login(account.email, account.password);
  if (!cookies) {
    console.log(`Failed to login for account: ${account.email}`);
    return;
  }

  const checkinResult = await checkin(cookies);
  if (checkinResult) {
    console.log(`Checkin result for ${account.email}:`, checkinResult);
  }
}

async function main() {
  const accountsJson = process.env.IKUUU_ACCOUNTS;
  if (!accountsJson) {
    console.error('No accounts found in environment variable');
    return;
  }

  let accounts;
  try {
    accounts = JSON.parse(accountsJson);
  } catch (error) {
    console.error('Failed to parse accounts JSON:', error);
    return;
  }

  for (const account of accounts) {
    await processAccount(account);
    // Add a small delay between accounts
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}

main().catch(console.error);
