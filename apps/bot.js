require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");
const { TELEGRAM_BOT_TOKEN, URL_STRAPI } = process.env;
// Токен вашего Telegram-бота
const token = TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

// Функция для получения списка всех ресторанов
async function fetchRestaurants() {
  return await axios
    .get(URL_STRAPI + "/api/restaurants?populate[0]=image")
    .then((res) => res.data);
}

async function fetchBotUsers(chatId) {
  return await axios
    .get(URL_STRAPI + "/api/bot-users?filters[chatId][$eq]=" + chatId)
    .then((res) => res.data);
}

async function checkBotUsers(chatId) {
  const user = await fetchBotUsers(chatId);

  if (user.data[0] && user.data[0].isApproved) {
    return true;
  } else {
    return false;
  }
}

// Обработчик команд /start
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;

  const isUser = await checkBotUsers(chatId);

  const commands = [
    { command: "/start", description: "Начало работы" },
    { command: "/menu", description: "Показать меню ресторана" },
  ];

  bot.setMyCommands(commands);

  if (!isUser) {
    bot.sendMessage(
      chatId,
      "Привет! Вы еще не зарегистрированы, передайте этот номер вашему куратору " +
        chatId
    );
  }
});

// Обработчик команд /menu
bot.onText(/\/menu/, async (msg) => {
  const chatId = msg.chat.id;

  const isUser = await checkBotUsers(chatId);

  if (isUser) {
    const keyboard = {
      reply_markup: JSON.stringify({
        inline_keyboard: [
          [
            {
              text: "Дай список всех ресторанов",
              callback_data: "all_restaurants",
            },
          ],
        ],
      }),
    };

    // Отправляем приветственное сообщение с кнопкой
    bot.sendMessage(chatId, "Привет! Нажмите кнопку ниже.", keyboard);
  } else {
    bot.sendMessage(
      chatId,
      "Привет! Вы еще не зарегистрированы, передайте этот номер вашему куратору " +
        chatId
    );
  }
});

// Обработка нажатия кнопки
bot.on("callback_query", async (query) => {
  const chatId = query.message.chat.id;
  const isUser = await checkBotUsers(chatId);

  if (!isUser) {
    bot.sendMessage(
      chatId,
      "Привет! Вы еще не зарегистрированы, передайте этот номер вашему куратору " +
        chatId
    );
    return;
  }

  if (query.data === "all_restaurants") {
    const restaurants = await fetchRestaurants();

    for (let i = 0; i < restaurants.data.length; i++) {
      // Готовим картинка для отправки
      const dataImgUrl = restaurants.data[i].image;

      dataImgUrl.map((i) => {
        // Готовим картинка для отправки
        const imgUrl = URL_STRAPI + i.url;

        bot.sendPhoto(chatId, imgUrl);

        console.log(imgUrl);
      });
      

      bot.sendMessage(chatId, restaurants.data[i].name);
    }

    bot.answerCallbackQuery(query.id); // Убираем уведомление ожидания
  }
});
