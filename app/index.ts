'use-strict';

// @ts-ignore
import notifier from 'mail-notifier';
import { Markup, Telegraf } from 'telegraf';
import fs from 'fs';
import chalk from 'chalk';
import { dirname } from 'path';

if (
  process.env.botToken == undefined ||
  process.env.userId == undefined ||
  process.env.login == undefined ||
  process.env.password == undefined
) {
  console.error(
    chalk.redBright(
      `[ ${chalk.greenBright(new Date().toLocaleTimeString())} ] Error: Required Environmental Variables Not Present...`
    ),
  );
  process.exit(0);
}

const bot = new Telegraf(process.env.botToken);

const imap = {
  user: process.env.login,
  password: process.env.password,
  host: "imap.gmail.com",
  port: 993,
  tls: true,
  tlsOptions: { rejectUnauthorized: false }
};

// The Mail Server Object
const mailServer = notifier(imap);

// @ts-ignore
mailServer.on('mail', (mail) => {
  bot.telegram.sendMessage(
    String(process.env.userId),
    `📮 New Mail Recieved\n` +
    `*🙍‍♂️From Name* • \`${mail.from[0].name}\`\n` +
    `*From Mail* • \`${mail.from[0].address}\`\n` +
    `*Subject* • \`${mail.subject}\`\n` +
    `*📅Date* • \`${mail.date}\`\n` +
    `*Priority* • \`${mail.priority}\`\n` +
    `*💬Text* • \`${(mail.text != undefined || mail.text != '') ? mail.text?.length >= 176 ? mail.text.slice(0, 175) + '...+' : mail.text : "\`Couldn't Get That!\`"}\``,
    {
      parse_mode: 'Markdown',
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.url('Open In Gmail 📧', `https://mail.google.com/mail/u/0/#search/rfc822msgid:${mail.messageId}`),],
      ]).reply_markup,
    }
  ).catch((err) => {
    console.error(
      chalk.magentaBright(
        `[ ${chalk.greenBright(new Date().toLocaleTimeString())} ] Error: Couldn't Send Message\nErrorMessage: ${err.message}`
      ),
    );
  });
});

bot.command('start', async (ctx) => {
  const masterUser = await bot.telegram.getChatMember(String(process.env.userId), Number(process.env.userId));
  ctx.reply(
    'Hi 👋\nI am *[MailServerBot](https://github.com/BLUE-DEVIL1134/MailServerBot)*\n' +
    'I am designed by *[Akash](https://github.com/BLUE-DEVIL1134)* to send your emails directly to telegram.\n' +
    `I am deployed by • ${masterUser.user.first_name}\n` +
    'Currently, I only work for `Gmail`.\n\n' +
    '*Trust me, we all are too lazy to open mail...*',
    {
      parse_mode: 'Markdown',
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.url('🚀 Deploy Your Own Bot', 'https://github.com/BLUE-DEVIL1134/MailServerBot'),],
      ]).reply_markup,
    }
  );
});

bot.command('license', async (ctx) => {
  ctx.replyWithDocument(
    {
      source: fs.createReadStream(dirname(__dirname) + '/LICENSE'),
      filename: 'LICENSE',
    },
    {
      parse_mode: 'Markdown',
      caption: '*License* • `GPL-3.0-only`\n*Author • Akash Pattnaik* <`akashpattnak.github@gmail.com`>',
    }
  );
});

bot.command(['help', 'commands'], async (ctx) => {
  ctx.reply(
    '*These Are My Following Commands ->*\n\n' +
    '/start • Start The Bot\n' +
    '/commands • See This Message\n' +
    '/uptime • To See My Uptime\n' +
    '/license • Get My License',
    {
      parse_mode: 'Markdown',
    }
  );
});

bot.command('uptime', async (ctx) => {
  const masterUser = await bot.telegram.getChatMember(String(process.env.userId), Number(process.env.userId));
  const hours = Math.floor(process.uptime() / 3600);
  const minutes = Math.floor((process.uptime() - hours * 3600) / 60);
  const seconds = Math.floor(process.uptime() - hours * 3600 - minutes * 60);
  const upTime = (hours > 0 ? hours + "h " : "") + (minutes > 0 ? minutes + "m " : "") + seconds + "s";
  ctx.reply(`👋Hi ${masterUser.user.first_name}\n\nI am running for almost \`${upTime}\``, {parse_mode: 'Markdown'});
});

mailServer.on('connected', () => {
  console.log(chalk.magentaBright(`[ ${chalk.greenBright(new Date().toLocaleTimeString())} ] Connected To The Mail Server...`));
});

mailServer.on('error', (error: Error) => {
  console.error(chalk.redBright(`[ Error ]: ${chalk.red(error.message)}`));
});

mailServer.start();
bot.launch().then(() => {
  console.log(chalk.magentaBright(`[ ${chalk.greenBright(new Date().toLocaleTimeString())} ] Telegram Bot Started...`));
}).catch((error: Error) => {
  console.error(chalk.redBright(`[ ${chalk.greenBright('Error')} ]: ${chalk.yellowBright(error.message)}`));
});
