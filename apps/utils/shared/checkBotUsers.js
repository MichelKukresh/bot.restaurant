import ApiRequestStrapi from '../ApiRequestStrapi.js';

async function checkBotUsers(chatId) {

    const user = await ApiRequestStrapi.fetchBotUsers(chatId);

    if (user.data[0] && user.data[0].isApproved) {
        return true;
    } else {
        return false;
    }
}
export default checkBotUsers;