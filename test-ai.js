require('dotenv').config();
const { isAIAvailable } = require('./src/ai');
console.log('GROQ_API_KEY truthy in process.env?', !!process.env.GROQ_API_KEY);
console.log('isAIAvailable()?', isAIAvailable());
