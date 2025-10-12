require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");
const { TELEGRAM_BOT_TOKEN, URL_STRAPI } = process.env;

const token = TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });
const fs = require('fs');
const request = require('request');


async function fetchRestaurantsById(documentId) {
  return await axios
    .get(URL_STRAPI + "/api/restaurants/" + documentId + "?populate[0]=image")
    .then((res) => res.data);
}

// Функция фильтра
async function fetchRestaurantsSaerch(search) {
  return await axios
    .get(URL_STRAPI + "/api/restaurants?filters[$or][0][idOpera][$containsi]=" + search + "&filters[$or][1][name][$containsi]=" + search)
    .then((res) => res.data);
}

// Функция для получения списка всех ресторанов
async function fetchRestaurants(page = 1) {
  return await axios
    .get(URL_STRAPI + "/api/restaurants?populate*&pagination[page]=" + page + "&pagination[pageSize]=5")
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

// Обработчик всех входящих текстовых сообщений
bot.onText(/(.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const receivedText = match[1];

  const restaurants = await fetchRestaurantsSaerch(receivedText);

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
  } else {
    bot.sendMessage(
      chatId,
      "Привет! Для начала работы нажмите /menu"

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

async function listingRestaraunts(query, bot, thisPage, chatId) {

  const restaurants = await fetchRestaurants(thisPage);

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

  let page = restaurants.meta.pagination.page;
  let total = restaurants.meta.pagination.total
  let pageNext = page + 1;

  let pagePrev = page - 1;

  const keyboard = {
    reply_markup: JSON.stringify({
      inline_keyboard: [
        [
          {
            text: "<<",
            callback_data: "page_" + pagePrev,
          },
          {
            text: ">>",
            callback_data: "page_" + pageNext,
          },
        ],
      ],
    }),
  };

  bot.sendMessage(chatId, "Текущая страница " + page + " всего ресторанов " + total, keyboard);

  bot.answerCallbackQuery(query.id); // Убираем уведомление ожидания
}

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

    await listingRestaraunts(query, bot, thisPage = 1, chatId);

  }

  if (query.data.includes("get-restaurants")) {

    const result = query.data.split("_")[1];

    const restaurant = await fetchRestaurantsById(result);
    // Готовим картинку для отправки
    const dataImgUrl = restaurant.data.image;

    bot.sendMessage(chatId, restaurant.data.name + " " + restaurant.data.idOpera);

    dataImgUrl.map((i) => {

      const imgUrl = URL_STRAPI + i.url;

      downloadAndSendImage(bot, chatId, imgUrl)
    })
  }

  if (query.data.includes("page_")) {
    const thisPage = query.data.split("_")[1];
    await listingRestaraunts(query, bot, thisPage, chatId);
  }

});

// Загружаем изображение в буфер памяти
function downloadAndSendImage(bot, chatId, url) {
  return new Promise((resolve, reject) => {
    request.head(url, (err, res, body) => {
      if (err) return reject(err);

      // Временный файл для хранения изображения
      const tempFilePath = Date.now().toString() + ".png"; // Уникальное имя временного файла

      request({ url: url, encoding: null }).pipe(fs.createWriteStream(tempFilePath))
        .on('close', () => {
          // Отправляем изображение
          bot.sendPhoto(chatId, tempFilePath)
            .then(() => {
              // Удаляем временный файл после отправки
              fs.unlink(tempFilePath, (unlinkErr) => {
                if (unlinkErr) console.error(unlinkErr);
                else console.log("Temporary file deleted successfully.");
              });
              resolve();
            })
            .catch(reject);
        });
    });
  });
}