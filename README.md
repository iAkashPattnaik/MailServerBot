# <h1 align="center">🚀MailServerBot📩</h1>
# <p align="center"><a href="https://github.com/iAkashPattnaik/MailServerBot"><img src="https://github-readme-stats.vercel.app/api/pin?username=iAkashPattnaik&show_icons=true&theme=dracula&hide_border=true&repo=MailServerBot"></a></p>
<p align="center">
<a href="https://github.com/iAkashPattnaik/MailSenderBot"><img src="https://hits.seeyoufarm.com/api/count/incr/badge.svg?url=https%3A%2F%2Fgithub.com%2FiAkashPattnaik%2FMailSenderBot%2F&count_bg=%232100FF&title_bg=%2300BBFF&icon=github.svg&icon_color=%23000000&title=Views&edge_flat=false" /></a>
<img src="https://img.shields.io/badge/Version-2.0.0-blueviolet?&logo=github&style=flat" />
</p>

A modern Telegram bot that monitors your emails and provides SMTP functionality for sending emails directly through Telegram commands.

## ✨ Features

- 📧 **Email Monitoring**: Real-time email notifications via Telegram
- 📤 **SMTP Support**: Send emails directly through Telegram commands
- 🔒 **Secure**: Modern authentication and secure connections
- 🌐 **Multi-Provider**: Works with Gmail, Outlook, and other SMTP/IMAP providers
- 🚀 **Modern TypeScript**: Fully typed with latest Node.js features
- 📊 **Status Monitoring**: Check connection status and uptime
- 🛡️ **Error Handling**: Comprehensive error handling and graceful shutdown

## 🔧 Setup

### Gmail Setup (App Passwords Required)

Since Google discontinued "less secure apps", you now need to use App Passwords:

<kbd>Step 1</kbd> • Enable 2-Factor Authentication on your Google Account

<kbd>Step 2</kbd> • Go to [Google Account Settings](https://myaccount.google.com/security)

<kbd>Step 3</kbd> • Navigate to "2-Step Verification" → "App passwords"

<kbd>Step 4</kbd> • Generate an App Password for "Mail"

<kbd>Step 5</kbd> • Use this App Password as your `password` environment variable

<kbd>Step 6</kbd> • Enable IMAP in Gmail Settings → Forwarding and POP/IMAP

### Other Email Providers

For other providers (Outlook, Yahoo, etc.), configure the SMTP/IMAP settings accordingly using the optional environment variables.

## 🚀 Deploy

### 📱 Bot Commands

- `/start` - Initialize the bot
- `/help` or `/commands` - Show available commands
- `/uptime` - Display bot uptime
- `/license` - Get license information
- `/send <email> <subject> <message>` - Send email via SMTP
- `/status` - Check SMTP connection status

### 💻 Local Server

```bash
# Install dependencies
npm install

# Development mode
npm run dev

# Build and start
npm run build
npm start
```

### ☁️ Cloud Deployment

The bot can be deployed on various platforms like Heroku, Railway, Render, or any Node.js hosting service.

## 🔐 Environment Variables

### Required Variables
- `botToken` - Bot token from [@BotFather](https://telegram.dog/BotFather)
- `userId` - Your Telegram user ID
- `login` - Your email address
- `password` - Your email password (App Password for Gmail)

### Optional SMTP Configuration
- `SMTP_HOST` - SMTP server host (default: smtp.gmail.com)
- `SMTP_PORT` - SMTP server port (default: 587)
- `SMTP_SECURE` - Use secure connection (default: false)

### Optional IMAP Configuration
- `IMAP_HOST` - IMAP server host (default: imap.gmail.com)
- `IMAP_PORT` - IMAP server port (default: 993)

## 📋 Example Environment Configuration

```env
botToken=your_bot_token_here
userId=your_telegram_user_id
login=your_email@gmail.com
password=your_app_password_here

# Optional: Custom SMTP settings
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false

# Optional: Custom IMAP settings
IMAP_HOST=imap.gmail.com
IMAP_PORT=993
```

## 🔄 Migration from v1.x

If you're upgrading from the previous version:

1. Update your `password` to use App Password (for Gmail)
2. Install new dependencies: `npm install`
3. Update environment variables as needed
4. The bot now supports sending emails via `/send` command

## 🛠️ Technical Details

- **Runtime**: Node.js 18+
- **Language**: TypeScript
- **Email Libraries**: nodemailer (SMTP), imapflow (IMAP), mailparser
- **Bot Framework**: Telegraf
- **Deployment**: Docker support included

## 📦 Dependencies

### Production
- `telegraf` - Telegram Bot API framework
- `nodemailer` - SMTP email sending
- `imapflow` - Modern IMAP client
- `mailparser` - Email parsing
- `chalk` - Terminal styling

### Development
- `typescript` - TypeScript compiler
- `ts-node` - TypeScript execution
- `@types/node` - Node.js type definitions
- `@types/nodemailer` - Nodemailer type definitions

## 🤝 Credits

- [`Anony`](https://github.com/anonyindian) - Original bot idea
- [`Akash`](https://github.com/iAkashPattnaik) - Bot development and maintenance

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
