import dotenv from 'dotenv';
dotenv.config();
import TelegramBot from 'node-telegram-bot-api';
import ApiRequestStrapi from './utils/ApiRequestStrapi.js';
import startCommand from './commands/start.js';
import menuCommand from './commands/menu.js';
import checkBotUsers from './utils/shared/checkBotUsers.js';
import callbackQuery from './commands/callbackQuery/callbackQuery.js';
import { Bot } from '@maxhub/max-bot-api';
// const bot = new Bot(process.env.BOT_TOKEN);
import { MENU } from "./utils/shared/constData.js"

const { TELEGRAM_BOT_TOKEN, URL_STRAPI } = process.env;


const token = TELEGRAM_BOT_TOKEN;
//const bot = new TelegramBot(token, { polling: true });
const bot = new Bot(token);

// Устанавливает список команд, который пользователь будет видеть в чате с ботом
bot.api.setMyCommands([
  {
    name: 'start',
    description: 'Начало работы',
  },
  {
    name: 'menu',
    description: 'Показать меню',
  },
]);

// Обработчик команд /start
bot.command("start", async (msg) => {
  try {
    await menuCommand({ bot, msg })
  } catch (e) {
    console.log(e)
  }
});

//Обработчик команд /menu
bot.command("menu", async (msg) => {
  try {
    await menuCommand({ bot, msg })
  } catch (e) {
    console.log(e)
  }

});

bot.action('all_restaurants', async (query) => {
  console.log(query.callback.payload)
  await callbackQuery({ bot, query });
});

// Для кнопок с ресторанами (get-restaurants_ + documentId)
bot.action(/^get-restaurants_.+$/, async (query) => {
  await callbackQuery({ bot, query });
});

bot.action(/^page_.+$/, async (query) => {
  await callbackQuery({ bot, query });
});

// Обработчик всех входящих текстовых сообщений
bot.on('message_created', async (msg) => {

  console.log("message_created", msg.message.body.text)

  // Ищем не содержет ли из меню команду
  const blockedCommands = Object.values(MENU).map(item => item.name);

  // Если введённая команда содержится среди меню — пропускаем обработку
  if (blockedCommands.includes(msg.message.body.text)) {
    return;
  }

  const chatId = msg.message.sender.user_id;

  // проверка на зарегистрированного пользователя
  const isUser = await checkBotUsers(chatId);

  if (!isUser) {
    return;
  }

  const receivedText = msg.message.body.text;

  const restaurants = await ApiRequestStrapi.fetchRestaurantsSearch(receivedText);

  for (let i = 0; i < restaurants.data.length; i++) {

    const keyboard = {
      attachments: [
        {
          type: "inline_keyboard",
          payload: {
            buttons: [
              [
                {
                  type: "callback",
                  text: "Показать фото и описание",
                  payload: "get-restaurants_" + restaurants.data[i].documentId
                }
              ]
            ]
          }
        }
      ]
    };
    bot.api.sendMessageToUser(chatId, restaurants.data[i].name + " " + restaurants.data[i].idOpera, keyboard);

  }

});




bot.start();

