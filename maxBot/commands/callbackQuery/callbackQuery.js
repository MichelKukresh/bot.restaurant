import ApiRequestStrapi from "../../utils/ApiRequestStrapi.js";
import checkBotUsers from "../../utils/shared/checkBotUsers.js";

import axios from 'axios';
import FormData from 'form-data';
import dotenv from 'dotenv';
dotenv.config();
const { URL_STRAPI, MAX_BOT_TOKEN } = process.env;

async function listingRestaraunts(query, bot, thisPage, chatId) {



  const isUser = await checkBotUsers(chatId);

  if (!isUser) {
    return;
  }

  const restaurants = await ApiRequestStrapi.fetchRestaurants(thisPage);
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
    await bot.api.sendMessageToUser(chatId, restaurants.data[i].name + " " + restaurants.data[i].idOpera, keyboard);
  }

  let page = restaurants.meta.pagination.page;
  let total = restaurants.meta.pagination.total
  let pageNext = page + 1;

  let pagePrev = page - 1;

  const keyboard = {
    attachments: [
      {
        type: "inline_keyboard",
        payload: {
          buttons: [
            [
              {
                type: "callback",
                text: "<<",
                payload: "page_" + pagePrev
              },
              {
                type: "callback",
                text: ">>",
                payload: "page_" + pageNext
              }
            ]
          ]
        }
      }
    ]
  };

  await bot.api.sendMessageToUser(chatId, "Текущий список " + page + " всего ресторанов " + total, keyboard);


}



async function callbackQuery({ bot, query }) {


  const chatId = query.message.recipient.user_id;
  const isUser = await checkBotUsers(chatId);
  let thisPage = 1;

  if (!isUser) {
    bot.api.sendMessageToUser(
      chatId,
      "Привет! Вы еще не зарегистрированы, передайте этот номер вашему куратору " +
      chatId
    );
    return;
  }



  if (query.callback.payload === "all_restaurants") {

    await listingRestaraunts(query, bot, thisPage, chatId);

  }

  if (query.callback.payload.includes("get-restaurants")) {

    const result = query.callback.payload.split("_")[1];

    const restaurant = await ApiRequestStrapi.fetchRestaurantsById(result);

    // Подготовленные данные изображений
    const dataImgUrl = restaurant.data.itemImage;

    // Дополнительно отправляем основную информацию о ресторане
    bot.api.sendMessageToUser(chatId, restaurant.data.name + " - " + restaurant.data.idOpera);
    bot.api.sendMessageToUser(chatId, restaurant.data.description);
    bot.api.sendMessageToUser(chatId, restaurant.data.address);


    // Отправляем медиафайлы по одному


    // for (const item of dataImgUrl) {

    //   const fileUrl = URL_STRAPI + item.image.url;
    //   // Временное решение - отправляем ссылку текстом
    //   await bot.api.sendMessageToUser(
    //     chatId,
    //     `${item.name || 'Файл'}: ${fileUrl}`
    //   );

    // }


    for (const item of dataImgUrl) {
      const fileUrl = URL_STRAPI + item.image.url;
      const fileType = item.image.mime === 'video/mp4' ? 'video' : 'image';

      try {
        // 1. Получаем URL для загрузки файла в Max
        const uploadResponse = await axios.post(
          'https://platform-api.max.ru/uploads',
          null,
          {
            params: { type: fileType },
            headers: {
              'Authorization': `${MAX_BOT_TOKEN}`
            }
          }
        );

        const uploadUrl = uploadResponse.data.url;

        // 2. Скачиваем файл из Strapi
        const fileResponse = await axios.get(fileUrl, {
          responseType: 'arraybuffer'
        });

        // 3. Загружаем файл в Max
        const formData = new FormData();
        const fileName = item.image.name || `file.${item.image.mime.split('/')[1]}`;
        formData.append('data', Buffer.from(fileResponse.data), {
          filename: fileName,
          contentType: item.image.mime
        });

        const uploadFileResponse = await axios.post(uploadUrl, formData, {
          headers: {
            ...formData.getHeaders()
          }
        });


        // 4. ИЗВЛЕКАЕМ ТОКЕН из  объекта
        let token = null;

        // Пробуем получить token из разных вариантов ответа
        if (uploadFileResponse.data.photos.token) {
          token = uploadFileResponse.data.photos.token;
        } else {
          // Ищем token в первом свойстве объекта
          const firstKey = Object.keys(uploadFileResponse.data.photos)[0];
          if (firstKey && uploadFileResponse.data.photos[firstKey]?.token) {
            token = uploadFileResponse.data.photos[firstKey].token;
          }
        }


        //  return;

        if (!token) {
          throw new Error("Token not found in response");
        }

        // 5. Формируем правильное вложение
        const attachment = {
          type: fileType,
          payload: {
            token: token  // ТОЛЬКО token, не весь объект!
          }
        };

        // Вместо bot.api.sendMessage используем прямой fetch
        const messageResponse = await fetch(`https://platform-api.max.ru/messages?user_id=${chatId}`, {
          method: "POST",
          headers: {
            "Authorization": `${MAX_BOT_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: item.name || '',
            attachments: [
              {
                type: fileType,
                payload: {
                  token: token
                }
              }
            ]
          })
        });

        const messageResult = await messageResponse.json();
        

      } catch (error) {
        console.error('Ошибка:', error.message);
        if (error.response) {
          console.error('Response data:', error.response.data);
        }
      }
    }

  }

  if (query.callback.payload.includes("page_")) {
    thisPage = query.callback.payload.split("_")[1];
    await listingRestaraunts(query, bot, thisPage, chatId);
  }

}

export default callbackQuery;