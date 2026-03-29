import checkBotUsers from "../utils/shared/checkBotUsers.js";

import { MENU } from "../utils/shared/constData.js"

async function start({ bot, msg }) {

  const chatId = msg.message.sender.user_id;

  const isUser = await checkBotUsers(chatId);

  // Преобразуем объект MENU в массив команд
  const commands = Object.entries(MENU).map(([key, value]) => ({
    name: value.text,
    description: value.description
  }));

  bot.api.setMyCommands(commands);

  if (!isUser) {
    bot.api.sendMessageToUser(
      chatId,
      "Привет! Вы еще не зарегистрированы, передайте этот номер вашему куратору " +
      chatId
    );
  } else {
    bot.api.sendMessageToUser(
      chatId,
      "Привет! Для начала работы нажмите /menu"

    );
  }

}

export default start;