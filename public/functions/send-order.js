const fetch = require('node-fetch');

exports.handler = async (event) => {
  // 1. Проверяем метод запроса
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    // 2. URL вашего Google Apps Script (замените на реальный)
    const scriptUrl = 'https://script.google.com/macros/s/AKfycbygQvHLhdgwHaAEGBHAbh6xIeXUTf0BcP2mHDRTv8UjwJh3_JE68wfGMdfR28jgxffTlA/exec';

    // 3. Отправляем данные в Google Apps Script
    const response = await fetch(scriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: event.body
    });

    // 4. Возвращаем ответ
    return {
      statusCode: 200,
      body: JSON.stringify(await response.json())
    };

  } catch (error) {
    // 5. Обработка ошибок
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Internal Server Error',
        details: error.message 
      })
    };
  }
};