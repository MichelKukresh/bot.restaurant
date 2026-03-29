import checkBotUsers from "../utils/shared/checkBotUsers.js";
import { Keyboard } from '@maxhub/max-bot-api';

async function menu({ bot, msg }) {

    const chatId = msg.message.sender.user_id;

    const isUser = await checkBotUsers(chatId);

    if (isUser) {
        // const keyboard = {
        //     reply_markup: JSON.stringify({
        //         inline_keyboard: [
        //             [
        //                 {
        //                     text: "Дай список всех ресторанов",
        //                     callback_data: "all_restaurants",
        //                 },
        //             ],
        //         ],
        //     }),
        // };

        // Создаем клавиатуру для Max мессенджера
        const keyboard = {
            attachments: [
                {
                    type: "inline_keyboard",
                    payload: {
                        buttons: [
                            [
                                {
                                    type: "callback",
                                    text: "Дай список всех ресторанов",
                                    payload: "all_restaurants"
                                }
                            ]
                        ]
                    }
                }
            ]
        }
        // Отправляем приветственное сообщение с кнопкой
        bot.api.sendMessageToUser(chatId, "Привет! Нажмите кнопку ниже.", keyboard);
    } else {
        bot.api.sendMessageToUser(
            chatId,
            "Привет! Вы еще не зарегистрированы, передайте этот номер вашему куратору " +
            chatId
        );
    }

}

export default menu;