import checkBotUsers from "../utils/shared/checkBotUsers.js";

import { MENU } from "../utils/shared/constData.js"

async function start({ bot, msg }) {

  const chatId = msg.chat.id;

  const isUser = await checkBotUsers(chatId);

  // Преобразуем объект MENU в массив команд
  const commands = Object.entries(MENU).map(([key, value]) => ({
    command: value.text,
    description: value.description
  }));

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

}

export default start;