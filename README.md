# ikuuu 自动签到脚本

基于 Node.js 的 ikuuu 网站自动签到脚本，支持从 CookieCloud 获取加密 Cookie，并调用签到接口完成每日签到。

**特别支持 GitHub Actions 定时自动执行**，无需自建服务器。

## 功能特性

- 🔐 支持从 CookieCloud 获取加密存储的 Cookie
- 🔑 使用 AES 解密 Cookie 数据（密钥基于 UUID + 密码的 MD5 前16位）
- 📅 自动调用 ikuuu 签到接口
- 🧾 输出签到结果（JSON 格式）
- ☁️ **支持 GitHub Actions 定时运行（免费）**

## 环境要求

### 本地运行

- Node.js 18+（支持 `fetch`）
- npm / yarn / pnpm

### GitHub Actions 运行

- 仅需 GitHub 账号，无需任何服务器

## 配置说明

### 方式一：本地运行

在项目根目录创建 `.env` 文件：

```env
# ikuuu API 地址（必填）
IKUUU_API_PATH=https://ikuuu.example.com

# CookieCloud 服务地址（必填）
COOKIE_CLOUD_API_PATH=https://cookiecloud.example.com

# CookieCloud 的 UUID（必填）
COOKIE_CLOUD_UUID=your-uuid-here

# CookieCloud 数据加密密码（必填）
COOKIE_CLOUD_PASSWORD=your-password
```

### 方式二：GitHub Actions 运行

#### 2.1 Fork 本仓库

点击 GitHub 右上角 Fork 按钮，将仓库复制到你的账号下。

#### 2.2 配置 GitHub Secrets

进入你 Fork 后的仓库 → **Settings** → **Secrets and variables** → **Actions** → 点击 **New repository secret**，依次添加以下 4 个 secrets：

| Secret 名称             | 说明                      | 示例值                                 |
| ----------------------- | ------------------------- | -------------------------------------- |
| `IKUUU_API_PATH`        | ikuuu 网站 API 根地址     | `https://ikuuu.earth`                  |
| `COOKIE_CLOUD_API_PATH` | CookieCloud 服务地址      | `https://api.cookiecloud.com`          |
| `COOKIE_CLOUD_UUID`     | CookieCloud 中设备的 UUID | `a1b2c3d4-1234-5678-9abc-def123456789` |
| `COOKIE_CLOUD_PASSWORD` | 加密 Cookie 使用的密码    | `your_password`                        |

**添加步骤**：

1. 进入仓库 → `Settings` → `Secrets and variables` → `Actions`
2. 点击 `New repository secret`
3. Name 填写上述名称（如 `IKUUU_API_PATH`）
4. Secret 填写对应的值
5. 点击 `Add secret` 保存

> ⚠️ **注意**：Secrets 添加后无法查看原文，请确保值填写正确。如需修改，只能删除后重新添加。

#### 2.3 启用 GitHub Actions

仓库会自动启用 Actions（默认已开启）。如未开启：

- 进入 `Actions` 标签页
- 点击 `I understand my workflows, go ahead and enable them`

#### 2.4 手动触发测试

1. 进入 `Actions` 标签页
2. 点击左侧的 `Ikuuu Checkin` workflow
3. 点击 `Run workflow` → `Run workflow` 即可手动执行

## 参数说明

| 变量名                  | 说明                      | 是否必填 | 示例                          |
| ----------------------- | ------------------------- | -------- | ----------------------------- |
| `IKUUU_API_PATH`        | ikuuu 网站 API 根地址     | ✅ 是    | `https://ikuuu.earth`         |
| `COOKIE_CLOUD_API_PATH` | CookieCloud 服务地址      | ✅ 是    | `https://api.cookiecloud.com` |
| `COOKIE_CLOUD_UUID`     | CookieCloud 中设备的 UUID | ✅ 是    | `a1b2c3d4-...`                |
| `COOKIE_CLOUD_PASSWORD` | 加密 Cookie 使用的密码    | ✅ 是    | `your_password`               |

## 使用方法

### 本地运行

```bash
# 安装依赖
npm install crypto-js dotenv

# 运行脚本
node index.js
```

### GitHub Actions 定时执行

Workflow 默认配置为**每天北京时间上午 9：00** 自动运行（使用 UTC+8 时区）。

如需修改执行时间，编辑 `.github/workflows/checkin.yml` 中的 cron 表达式：

```yaml
- cron： '0 1 * * *' # UTC 时间 01：00 = 北京时间 09：00
```

**常用 cron 表达式（北京时间）**：

| 执行时间    | UTC cron    | 说明                         |
| ----------- | ----------- | ---------------------------- |
| 每天 09：00 | `0 1 * * *` | UTC 01：00 = 北京时间 09：00 |
| 每天 08：00 | `0 0 * * *` | UTC 00：00 = 北京时间 08：00 |
| 每天 12：00 | `0 4 * * *` | UTC 04：00 = 北京时间 12：00 |

## 脚本逻辑说明

1. **获取 Cookie**  
   从 CookieCloud 请求加密数据 → 解密 → 提取 `ikuuu.org` 和 `.ikuuu.org` 下的所有 Cookie → 拼接成标准 Cookie 字符串。

2. **执行签到**  
   向 `${IKUUU_API_PATH}/user/checkin` 发送 POST 请求，携带 Cookie 和必要的请求头。

3. **输出结果**  
   打印签到接口返回的 JSON 数据（例如积分、签到状态等）。

## 示例输出

### GitHub Actions 运行日志

```
Run node index.js
https：//api.cookiecloud.com/cookiecloud/get/abc-123...
Checkin result ： { code： 1, msg： '签到成功', data： { points： 50 } }
```

### 签到成功响应

```json
{
  "code": 1,
  "msg": "签到成功",
  "data": {
    "points": 50
  }
}
```

### 今日已签到

```json
{
  "code": 2,
  "msg": "今日已签到，请勿重复签到"
}
```

## GitHub Actions 文件结构

```
.github/
└── workflows/
    └── checkin.yml    # GitHub Actions 配置文件
```

`.github/workflows/checkin.yml` 示例内容：

```yaml
name： Ikuuu Checkin

on：
  schedule：
    - cron： '0 1 * * *'  # UTC 01：00 = 北京时间 09：00
  workflow_dispatch：     # 支持手动触发

jobs：
  checkin：
    runs-on： ubuntu-latest
    steps：
      - uses： actions/checkout@v4
      - uses： actions/setup-node@v4
        with：
          node-version： '20'
      - run： npm install crypto-js dotenv
      - run： node index.js
        env：
          IKUUU_API_PATH： ${{ secrets.IKUUU_API_PATH }}
          COOKIE_CLOUD_API_PATH： ${{ secrets.COOKIE_CLOUD_API_PATH }}
          COOKIE_CLOUD_UUID： ${{ secrets.COOKIE_CLOUD_UUID }}
          COOKIE_CLOUD_PASSWORD： ${{ secrets.COOKIE_CLOUD_PASSWORD }}
```

## 常见问题

### Q：提示「没有 ikuuu.org cookie」

- 请检查 CookieCloud 中是否已正确保存 ikuuu 的登录 Cookie
- 确保 CookieCloud 中至少包含 `ikuuu.org` 或 `.ikuuu.org` 域名下的 Cookie

### Q：解密失败或返回空数据

- 检查 `COOKIE_CLOUD_UUID` 和 `COOKIE_CLOUD_PASSWORD` 是否正确
- 确认 CookieCloud 服务地址可访问且数据未过期
- 在 GitHub Actions 中检查 Secret 是否正确配置（名称和值）

### Q：GitHub Actions 没有自动运行

- 确认仓库中 `.github/workflows/checkin.yml` 文件存在
- 检查 workflow 文件语法是否正确
- 查看 `Actions` 标签页是否已启用
- cron 任务只在默认分支（通常是 main/master）生效

### Q：如何查看签到历史

- 进入 Actions 标签页
- 点击每次运行的 workflow
- 查看 `checkin` job 的输出日志

### Q：`fetch is not defined`

- Node.js 版本过低（需 >=18），GitHub Actions 中已配置 node-version='20' 可避免此问题
- 本地运行时请升级 Node.js 或使用 `node-fetch`

## 注意事项

- ⚠️ **请勿频繁调用签到接口**，一般每日一次即可
- 🔄 Cookie 有效期可能有限，建议定期更新 CookieCloud 中的 Cookie
- 🔒 脚本本身不存储任何敏感信息，所有配置从环境变量或 Secrets 读取
- ☁️ GitHub Actions 免费版每月有 2000 分钟的执行时长，本脚本只需几秒，完全够用

## 文件结构

```
.
├── .github/
│   └── workflows/
│       └── checkin.yml    # GitHub Actions 配置
├── index.js               # 签到主脚本
├── .env                   # 本地配置文件（不提交到仓库）
├── package.json           # 依赖管理
└── README.md              # 本文档
```

## License

MIT
