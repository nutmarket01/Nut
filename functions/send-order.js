// Используем нативный fetch (доступен в Node.js 18+, который использует Netlify)
// Нет необходимости подключать node-fetch
exports.handler = async (event) => {
  // 1. Проверяем метод запроса
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*' // Добавляем CORS-заголовки
      },
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    // 2. URL вашего Google Apps Script
    const scriptUrl = 'https://script.google.com/macros/s/AKfycbzJTMBaDnMTExgUCD-bJp86J1riGimyh169pyglCAlX9wDD9K5AX7wORbec0YdJA6yBFA/exec';

    // 3. Проверяем наличие тела запроса
    if (!event.body) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'Empty request body' })
      };
    }

    // 4. Отправляем данные в Google Apps Script
    const response = await fetch(scriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: event.body
    });

    // 5. Проверяем ответ от Google Apps Script
    const responseData = await response.json();
    
    // 6. Возвращаем ответ
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(responseData)
    };

  } catch (error) {
    // 7. Обработка ошибок
    console.error('Error:', error); // Логируем ошибку для отладки
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        error: 'Internal Server Error',
        details: error.message 
      })
    };
  }
};