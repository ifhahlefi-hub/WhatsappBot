const jwt = require('jsonwebtoken');
const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function testApi() {
    // Generate token for admin user id 3 (Super Admin)
    const payload = { id: 3, role: 'Super Admin' };
    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
    
    console.log('Generated Token:', accessToken);
    
    const api = axios.create({
        baseURL: 'http://localhost:3001/api',
        headers: {
            Authorization: `Bearer ${accessToken}`
        }
    });

    try {
        console.log('\n=== TESTING /dashboard/stats ===');
        const statsRes = await api.get('/dashboard/stats');
        console.log('Status:', statsRes.status);
        console.log('Response Data:', JSON.stringify(statsRes.data, null, 2));

        console.log('\n=== TESTING /users ===');
        const usersRes = await api.get('/users');
        console.log('Status:', usersRes.status);
        console.log('Response Data:', JSON.stringify(usersRes.data, null, 2));

        console.log('\n=== TESTING /chats ===');
        const chatsRes = await api.get('/chats');
        console.log('Status:', chatsRes.status);
        console.log('Response Data:', JSON.stringify(chatsRes.data, null, 2));
    } catch (err) {
        console.error('API Error:', err.response ? err.response.data : err.message);
    }
}

testApi();
