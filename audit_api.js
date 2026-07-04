async function run() {
    try {
        console.log("Logging in...");
        const loginRes = await fetch('http://localhost:3001/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@admin.com', password: 'password123' })
        });
        const loginData = await loginRes.json();
        if (!loginData.success) {
            console.log("Login failed: " + JSON.stringify(loginData));
            return;
        }
        const token = loginData.data.tokens.accessToken;
        const headers = { 'Authorization': `Bearer ${token}` };

        const endpoints = [
            '/api/dashboard/stats',
            '/api/users',
            '/api/users/1',
            '/api/chats',
            '/api/roles',
            '/api/expenses',
            '/api/audit-logs'
        ];

        console.log("=== API AUDIT ===");
        for (const ep of endpoints) {
            try {
                const res = await fetch(`http://localhost:3001${ep}`, { headers });
                const data = await res.json();
                let count = 0;
                
                if (data.data && Array.isArray(data.data)) count = data.data.length;
                else if (data.data && Array.isArray(data.data.users)) count = data.data.users.length;
                else if (data.data && Array.isArray(data.data.chats)) count = data.data.chats.length;
                else if (data.data && Array.isArray(data.data.roles)) count = data.data.roles.length;
                else if (data.data && Array.isArray(data.data.expenses)) count = data.data.expenses.length;
                else if (data.data && Array.isArray(data.data.logs)) count = data.data.logs.length;
                else if (data.data) count = 1; // single object
                
                console.log(`[OK] ${ep} - Status: ${res.status} - Data count: ${count}`);
            } catch (err) {
                console.log(`[ERROR] ${ep} - Message: ${err.message}`);
            }
        }
    } catch(err) {
        console.error("Fatal error during audit:", err.message);
    }
}
run();
