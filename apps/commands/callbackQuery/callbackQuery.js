import ApiRequestStrapi from "../../utils/ApiRequestStrapi.js";
import checkBotUsers from "../../utils/shared/checkBotUsers.js";

import axios from 'axios';

import dotenv from 'dotenv';
dotenv.config();
const { URL_STRAPI, TELEGRAM_BOT_TOKEN } = process.env;


async function listingRestaraunts(query, bot, thisPage, chatId) {

  const isUser = await checkBotUsers(chatId);

  if(!isUser) {
    return;
  }

  const restaurants = await ApiRequestStrapi.fetchRestaurants(thisPage);
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
  await  bot.sendMessage(chatId, restaurants.data[i].name + " " + restaurants.data[i].idOpera, keyboard);
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

 await bot.sendMessage(chatId, "Текущий список " + page + " всего ресторанов " + total, keyboard);

  bot.answerCallbackQuery(query.id); // Убираем уведомление ожидания
}

async function callbackQuery({ bot, query }) {
  const chatId = query.message.chat.id;
  const isUser = await checkBotUsers(chatId);
  let thisPage = 1;

  if (!isUser) {
    bot.sendMessage(
      chatId,
      "Привет! Вы еще не зарегистрированы, передайте этот номер вашему куратору " +
      chatId
    );
    return;
  }



  if (query.data === "all_restaurants") {

    await listingRestaraunts(query, bot, thisPage, chatId);

  }

  if (query.data.includes("get-restaurants")) {

    const result = query.data.split("_")[1];

    const restaurant = await ApiRequestStrapi.fetchRestaurantsById(result);

    // Подготовленные данные изображений
    const dataImgUrl = restaurant.data.itemImage;

    // Дополнительно отправляем основную информацию о ресторане
    bot.sendMessage(chatId, restaurant.data.name + " - " + restaurant.data.idOpera);
    bot.sendMessage(chatId, restaurant.data.description);
    bot.sendMessage(chatId, restaurant.data.address);
   
    // Формируем массив медиафайлов
    const mediaArray = dataImgUrl.map(i => {
      if (i.image.mime === 'video/mp4') {
        return {
          type: 'video',
          media: URL_STRAPI + i.image.url,
          supports_streaming: true, // разрешаем стриминг
          caption: i.name || '', // описание видеоклипа
          duration: i.duration || 0, // длительность (секунды)
          width: i.width || 640, // ширина кадра
          height: i.height || 480 // высота кадра
        };
      } else {
        return {
          type: 'photo',
          media: URL_STRAPI + i.image.url,
          caption: i.name || '' // описание изображения
        };
      }
    });

    // Создаем запрос к Telegram API
    const response = await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMediaGroup`, {
      chat_id: chatId,
      media: mediaArray
    });

  }

  if (query.data.includes("page_")) {
    thisPage = query.data.split("_")[1];
    await listingRestaraunts(query, bot, thisPage, chatId);
  }

}

export default callbackQuery;