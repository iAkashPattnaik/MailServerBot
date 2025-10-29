"use strict";

// Load environment variables first
import dotenv from "dotenv";
dotenv.config();

import chalk, { ChalkInstance } from "chalk";
import fs from "fs/promises";
import { ImapFlow } from "imapflow";
import nodemailer from "nodemailer";
import { dirname } from "path";
import { Context, Markup, Telegraf } from "telegraf";
// @ts-ignore
import { ParsedMail, simpleParser } from "mailparser";

interface BotContext extends Context {
  // Add any custom context properties here
}

// Environment validation
const requiredEnvVars = ["botToken", "userId", "login", "password"] as const;
type RequiredEnvVar = (typeof requiredEnvVars)[number];

const validateEnvironment = (): Record<RequiredEnvVar, string> => {
  const missing: string[] = [];
  const env: Partial<Record<RequiredEnvVar, string>> = {};

  for (const varName of requiredEnvVars) {
    const value = process.env[varName];
    if (!value) {
      missing.push(varName);
    } else {
      env[varName] = value;
    }
  }

  if (missing.length > 0) {
    console.error(
      chalk.redBright(
        `[ ${chalk.greenBright(
          new Date().toLocaleTimeString()
        )} ] Error: Missing required environment variables: ${missing.join(
          ", "
        )}`
      )
    );
    process.exit(1);
  }

  return env as Record<RequiredEnvVar, string>;
};

const env = validateEnvironment();
const bot = new Telegraf<BotContext>(env.botToken);

// SMTP Configuration for sending emails
const smtpConfig = {
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true" || false,
  auth: {
    user: env.login,
    pass: env.password,
  },
};

// IMAP Configuration for reading emails (still needed for monitoring)
const imapConfig = {
  host: process.env.IMAP_HOST || "imap.gmail.com",
  port: parseInt(process.env.IMAP_PORT || "993"),
  secure: true,
  auth: {
    user: env.login,
    pass: env.password,
  },
};

// Create transporter for SMTP
const transporter = nodemailer.createTransport(smtpConfig);

// Utility functions
const formatUptime = (uptime: number): string => {
  const hours = Math.floor(uptime / 3600);
  const minutes = Math.floor((uptime - hours * 3600) / 60);
  const seconds = Math.floor(uptime - hours * 3600 - minutes * 60);
  return (
    (hours > 0 ? `${hours}h ` : "") +
    (minutes > 0 ? `${minutes}m ` : "") +
    `${seconds}s`
  );
};

const truncateText = (
  text: string | undefined,
  maxLength: number = 176
): string => {
  if (!text || text.trim() === "") return "Couldn't Get That!";
  return text.length > maxLength ? `${text.slice(0, maxLength - 4)}...+` : text;
};

const logWithTimestamp = (
  message: string,
  color: ChalkInstance = chalk.magentaBright
): void => {
  console.log(
    color(
      `[ ${chalk.greenBright(new Date().toLocaleTimeString())} ] ${message}`
    )
  );
};

// Email monitoring with IMAP
const startEmailMonitoring = async (): Promise<void> => {
  try {
    const client = new ImapFlow(imapConfig);

    client.on("error", (error: Error) => {
      console.error(chalk.redBright(`[ IMAP Error ]: ${error.message}`));
    });

    await client.connect();
    logWithTimestamp("Connected to IMAP server for email monitoring...");

    // Select INBOX
    await client.mailboxOpen("INBOX");

    // Listen for new messages
    client.on("exists", async (data) => {
      try {
        // Fetch the latest message
        const messages = client.fetch(`${data.count}:${data.count}`, {
          source: true,
          flags: true,
        });

        for await (const message of messages) {
          if (message.source) {
            const parsed: ParsedMail = await simpleParser(message.source);
            await handleNewMail(parsed);
          }
        }
      } catch (error) {
        console.error(
          chalk.redBright(
            `Error processing new email: ${(error as Error).message}`
          )
        );
      }
    });
  } catch (error) {
    console.error(
      chalk.redBright(
        `Failed to connect to IMAP server: ${(error as Error).message}`
      )
    );
    // Retry connection after 30 seconds
    setTimeout(startEmailMonitoring, 30000);
  }
};

// Handle new mail notification
const handleNewMail = async (mail: ParsedMail): Promise<void> => {
  try {
    const fromAddress = mail.from?.[0];
    const messageText = mail.text || mail.html?.replace(/<[^>]*>/g, "") || "";

    const message =
      `📮 New Mail Received\n` +
      `*🙍‍♂️From Name* • \`${fromAddress?.name || "Unknown"}\`\n` +
      `*From Mail* • \`${fromAddress?.address || "Unknown"}\`\n` +
      `*Subject* • \`${mail.subject || "No Subject"}\`\n` +
      `*📅Date* • \`${mail.date?.toLocaleString() || "Unknown"}\`\n` +
      `*Priority* • \`${
        (mail.headers.get("x-priority") as string) || "Normal"
      }\`\n` +
      `*💬Text* • \`${truncateText(messageText)}\``;

    await bot.telegram.sendMessage(env.userId, message, {
      parse_mode: "Markdown",
      reply_markup: Markup.inlineKeyboard([
        [
          Markup.button.url(
            "Open In Gmail 📧",
            `https://mail.google.com/mail/u/0/#search/rfc822msgid:${
              mail.messageId || ""
            }`
          ),
        ],
      ]).reply_markup,
    });

    logWithTimestamp(`Email notification sent for: ${mail.subject}`);
  } catch (error) {
    console.error(
      chalk.magentaBright(
        `[ ${chalk.greenBright(
          new Date().toLocaleTimeString()
        )} ] Error: Couldn't send message\nError: ${(error as Error).message}`
      )
    );
  }
};

// Bot command handlers
bot.command("start", async (ctx) => {
  try {
    const masterUser = await bot.telegram.getChatMember(
      env.userId,
      Number(env.userId)
    );
    await ctx.reply(
      "Hi 👋\nI am [MailServerBot](https://github.com/iAkashPattnaik/MailServerBot/)\n" +
        "I am designed by [Akash](https://github.com/iAkashPattnaik/) to send your emails directly to telegram.\n" +
        `I am deployed by • ${masterUser.user.first_name}\n` +
        "Currently, I work with `Gmail` and other SMTP/IMAP providers.\n\n" +
        "*Trust me, we all are too lazy to open mail...*",
      {
        parse_mode: "Markdown",
        reply_markup: Markup.inlineKeyboard([
          [
            Markup.button.url(
              "🚀 Deploy Your Own Bot",
              "https://github.com/iAkashPattnaik/MailServerBot"
            ),
          ],
        ]).reply_markup,
      }
    );
  } catch (error) {
    console.error(
      chalk.redBright(`Error in start command: ${(error as Error).message}`)
    );
    await ctx.reply("Sorry, there was an error processing your request.");
  }
});

bot.command("license", async (ctx) => {
  try {
    const licenseBuffer = await fs.readFile(dirname(__dirname) + "/LICENSE");
    await ctx.replyWithDocument(
      {
        source: licenseBuffer,
        filename: "LICENSE",
      },
      {
        parse_mode: "Markdown",
        caption:
          "*License* • `MIT`\n*Author • Akash Pattnaik* <`akashpattnak.github@gmail.com`>",
      }
    );
  } catch (error) {
    console.error(
      chalk.redBright(`Error in license command: ${(error as Error).message}`)
    );
    await ctx.reply("Sorry, could not retrieve the license file.");
  }
});

bot.command(["help", "commands"], async (ctx) => {
  await ctx.reply(
    "*These Are My Following Commands ->*\n\n" +
      "/start • Start The Bot\n" +
      "/commands • See This Message\n" +
      "/uptime • To See My Uptime\n" +
      "/license • Get My License\n" +
      "/send • Send an email via SMTP\n" +
      "/status • Check SMTP connection status",
    {
      parse_mode: "Markdown",
    }
  );
});

bot.command("uptime", async (ctx) => {
  try {
    const masterUser = await bot.telegram.getChatMember(
      env.userId,
      Number(env.userId)
    );
    const upTime = formatUptime(process.uptime());
    await ctx.reply(
      `👋Hi ${masterUser.user.first_name}\n\nI am running for almost \`${upTime}\``,
      { parse_mode: "Markdown" }
    );
  } catch (error) {
    console.error(
      chalk.redBright(`Error in uptime command: ${(error as Error).message}`)
    );
    await ctx.reply("Sorry, there was an error getting uptime information.");
  }
});

// New SMTP commands
bot.command("send", async (ctx) => {
  const args = ctx.message.text.split(" ").slice(1);
  if (args.length < 3) {
    await ctx.reply(
      "Usage: `/send <to_email> <subject> <message>`\n\n" +
        'Example: `/send user@example.com "Test Subject" "Hello World!"`',
      { parse_mode: "Markdown" }
    );
    return;
  }

  const [toEmail, subject, ...messageParts] = args;
  const message = messageParts.join(" ");

  try {
    const info = await transporter.sendMail({
      from: env.login,
      to: toEmail,
      subject: subject?.replace(/"/g, ""),
      text: message.replace(/"/g, ""),
    });

    await ctx.reply(
      `✅ Email sent successfully!\n` +
        `*To:* \`${toEmail}\`\n` +
        `*Subject:* \`${subject?.replace(/"/g, "") || "No Subject"}\`\n` +
        `*Message ID:* \`${info.messageId}\``,
      { parse_mode: "Markdown" }
    );

    logWithTimestamp(`Email sent to ${toEmail} with subject: ${subject}`);
  } catch (error) {
    console.error(
      chalk.redBright(`Error sending email: ${(error as Error).message}`)
    );
    await ctx.reply(`❌ Failed to send email: ${(error as Error).message}`);
  }
});

bot.command("status", async (ctx) => {
  try {
    // Test SMTP connection
    await transporter.verify();
    await ctx.reply(
      "✅ *SMTP Status: Connected*\n" +
        `*Host:* \`${smtpConfig.host}\`\n` +
        `*Port:* \`${smtpConfig.port}\`\n` +
        `*Secure:* \`${smtpConfig.secure}\`\n` +
        `*User:* \`${smtpConfig.auth.user}\``,
      { parse_mode: "Markdown" }
    );
  } catch (error) {
    await ctx.reply(
      "❌ *SMTP Status: Disconnected*\n" +
        `*Error:* \`${(error as Error).message}\``,
      { parse_mode: "Markdown" }
    );
  }
});

// Error handling
bot.catch((err, ctx) => {
  console.error(chalk.redBright(`Bot error for ${ctx.updateType}: ${err}`));
});

// Graceful shutdown
const gracefulShutdown = async (signal: string): Promise<void> => {
  logWithTimestamp(`Received ${signal}, shutting down gracefully...`);
  try {
    await bot.stop(signal);
    process.exit(0);
  } catch (error) {
    console.error(
      chalk.redBright(`Error during shutdown: ${(error as Error).message}`)
    );
    process.exit(1);
  }
};

process.once("SIGINT", () => gracefulShutdown("SIGINT"));
process.once("SIGTERM", () => gracefulShutdown("SIGTERM"));

// Initialize the application
const initializeApp = async (): Promise<void> => {
  try {
    // Verify SMTP connection
    await transporter.verify();
    logWithTimestamp("SMTP connection verified successfully");

    // Start email monitoring
    await startEmailMonitoring();

    // Launch bot
    await bot.launch();
    logWithTimestamp("Telegram Bot started successfully");

    // Enable graceful stop
    process.once("SIGINT", () => bot.stop("SIGINT"));
    process.once("SIGTERM", () => bot.stop("SIGTERM"));
  } catch (error) {
    console.error(
      chalk.redBright(
        `Failed to initialize application: ${(error as Error).message}`
      )
    );
    process.exit(1);
  }
};

// Start the application
initializeApp().catch((error) => {
  console.error(chalk.redBright(`Unhandled error: ${error.message}`));
  process.exit(1);
});
