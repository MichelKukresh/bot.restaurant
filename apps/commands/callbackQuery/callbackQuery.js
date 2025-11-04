import ApiRequestStrapi from "../../utils/ApiRequestStrapi.js";
import checkBotUsers from "../../utils/shared/checkBotUsers.js";



import dotenv from 'dotenv';
dotenv.config();
const { URL_STRAPI } = process.env;


async function listingRestaraunts(query, bot, thisPage, chatId) {

const isUser = await checkBotUsers(chatId);


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



async function callbackQuery({bot, query}) {


  
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
    // Готовим картинку для отправки
    const dataImgUrl = restaurant.data.image;



    bot.sendMessage(chatId, restaurant.data.name + " - " + restaurant.data.idOpera);

    dataImgUrl.map((i) => {

      const imgUrl = URL_STRAPI + i.url;

      console.log(imgUrl);

      bot.sendPhoto(chatId, imgUrl);


    })
  }

  if (query.data.includes("page_")) {
    thisPage = query.data.split("_")[1];
    await listingRestaraunts(query, bot, thisPage, chatId);
  }


}

export default  callbackQuery ;