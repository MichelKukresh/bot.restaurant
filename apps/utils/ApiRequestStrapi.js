import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();
const { URL_STRAPI } = process.env;

class ApiRequestStrapi {
    handleError(err) {
        console.error(`Ошибка: ${err.message}`);
        throw err;
    }

    fetchRestaurantsById = async (documentId) => {
        try {
            const response = await axios.get(`${URL_STRAPI}/api/restaurants/${documentId}?populate[0]=image&populate[1]=itemImage.image`);
            return response.data;
        } catch (err) {
            this.handleError(err);
        }
    };

    fetchRestaurantsSearch = async (search) => {
        const baseUrl = `${URL_STRAPI}/api/restaurants`;

        // Формирование параметров вручную
        const params = `filters[$or][0][idOpera][$containsi]=${search}&filters[$or][1][name][$containsi]=${search}&filters[$and][2][isVorking][$eq]=true`;

        console.log(`${baseUrl}?${params}`)

        try {
            const response = await axios.get(`${baseUrl}?${params}`);
            return response.data;
        } catch (err) {
            console.error("Ошибка при поиске ресторанов:", err.message);
            throw err;
        }
    };

    fetchRestaurants = async (page = 1) => {

        try {
            const response = await axios.get(`${URL_STRAPI}/api/restaurants?populate[0]=image&pagination[page]=${page}&pagination[pageSize]=5&filters[$and][1][isVorking][$eq]=true`);
            return response.data;
        } catch (err) {
            this.handleError(err);
        }
    };

    fetchBotUsers = async (chatId) => {
        try {
            const response = await axios.get(`${URL_STRAPI}/api/bot-users?filters[chatId][$eq]=${chatId}`);
            return response.data;
        } catch (err) {
            this.handleError(err);
        }
    };
}

export default new ApiRequestStrapi();