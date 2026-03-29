import dotenv from 'dotenv';
dotenv.config();
import TelegramBot from 'node-telegram-bot-api';

const { TELEGRAM_BOT_TOKEN} = process.env;

const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });


bot.onText(/(.+)/, async (msg, match) => {
 const chatId = msg.chat.id;

bot.sendMessage(chatId, `Переходите в MAX - https://max.ru/id7727443551_1_bot`);
})


