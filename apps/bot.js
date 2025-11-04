import dotenv from 'dotenv';
dotenv.config();
import TelegramBot from 'node-telegram-bot-api';
import ApiRequestStrapi from './utils/ApiRequestStrapi.js';
import startCommand from './commands/start.js';
import menuCommand from './commands/menu.js';
import checkBotUsers from './utils/shared/checkBotUsers.js';
import callbackQuery from './commands/callbackQuery/callbackQuery.js';

import { MENU } from "./utils/shared/constData.js"

const { TELEGRAM_BOT_TOKEN, URL_STRAPI } = process.env;


const token = TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

// Обработчик всех входящих текстовых сообщений
bot.onText(/(.+)/, async (msg, match) => {

  // Ищем не содержет ли из меню команду
  const blockedCommands = Object.values(MENU).map(item => item.text);

  // Если введённая команда содержится среди меню — пропускаем обработку
  if (blockedCommands.includes(msg.text)) {
    return;
  }

  const chatId = msg.chat.id;

  // проверка на зарегистрированного пользователя
  const isUser = await checkBotUsers(chatId);

  if (!isUser) {
    return;
  }

  const receivedText = match[1];

  const restaurants = await ApiRequestStrapi.fetchRestaurantsSearch(receivedText);

  for (let i = 0; i < restaurants.data.length; i++) {

    const keyboard = {
      reply_markup: JSON.stringify({
        inline_keyboard: [
          [
            {
              text: "Показать фото и описание",
              callback_data: "get-restaurants_" + restaurants.data[i].documentId,
            },
          ],
        ],
      }),
    };
    bot.sendMessage(chatId, restaurants.data[i].name + " " + restaurants.data[i].idOpera, keyboard);

  }

});

// Обработчик команд /start
bot.onText(/\/start/, async (msg) => {
  await startCommand({ bot, msg });
});

//Обработчик команд /menu
bot.onText(/\/menu/, async (msg) => {
  await menuCommand({ bot, msg })
});

//Обработка нажатия кнопки
bot.on("callback_query", async (query) => {
  await callbackQuery({ bot, query });
});

