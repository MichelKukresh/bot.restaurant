import checkBotUsers from "../utils/shared/checkBotUsers.js";

async function menu({ bot, msg }) {

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

}

export default menu;