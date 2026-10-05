// LocalStorage me Initial Tokens save karein
if (!localStorage.getItem('pw_refresh_token')) {
    localStorage.setItem('pw_refresh_token', '4d1e489e76b89b8816a51691ba76430bd68258948ff67cc4bb870df26f73c781');
}

if (!localStorage.getItem('pw_token')) {
    localStorage.setItem('pw_token', 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpYXQiOjE3OTEyMDUyMjAsImV4cCI6MTc5MTgxMDAyMC45OTEsImRhdGEiOnsiX2lkIjoiNjhiODA3MjgyYzQxMTYxNTI5N2ZjMWM1IiwidXNlcm5hbWUiOiI5OTc3NDY3MjA1IiwiZmlyc3ROYW1lIjoiSGFyaW9tIiwibGFzdE5hbWUiOiIiLCJvcmdhbml6YXRpb24iOnsiX2lkIjoiNWViMzkzZWU5NWZhYjc0NjhhNzlkMTg5Iiwid2Vic2l0ZSI6InBoeXNpY3N3YWxsYWguY29tIiwibmFtZSI6IlBoeXNpY3N3YWxsYWgifSwicm9sZXMiOlsiNWIyN2JkOTY1ODQyZjk1MGE3NzhjNmVmIl0sImNvdW50cnlHcm91cCI6IklOIiwib25lUm9sZXMiOltdLCJ0eXBlIjoiVVNFUiJ9LCJqdGkiOiJocUZWeUVkVFNYZWM5U3cyUWlfSG5RXzY4YjgwNzI4MmM0MTE2MTUyOTdmYzFjNSJ9.1ZS7INCOFbeibR6XraqC1fu9DwSwBdUA37cQhdazljE');
}

// Token Expire hone par Refresh karne ka function
async function refreshPWToken() {
    const refreshToken = localStorage.getItem('pw_refresh_token');
    try {
        const response = await fetch('https://api.penpencil.xyz/v3/oauth/refresh-token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'client-type': 'WEB'
            },
            body: JSON.stringify({ refreshToken: refreshToken })
        });
        
        const resData = await response.json();
        if (resData.data && resData.data.token) {
            localStorage.setItem('pw_token', resData.data.token);
            if (resData.data.refreshToken) {
                localStorage.setItem('pw_refresh_token', resData.data.refreshToken);
            }
            return resData.data.token;
        }
    } catch (err) {
        console.error("Token refresh fail hua:", err);
    }
    return null;
}

// Headers Generate karne ka function
function getPWHeaders() {
    return {
        "Content-Type": "application/json",
        "client-type": "WEB",
        "X-SDK-Version": "0.0.28",
        "Authorization": "Bearer " + localStorage.getItem('pw_token'),
        "randomId": "333cf088-6db1-4f7a-ab1f-591908038725",
        "client-id": "5eb393ee95fab7468a79d189",
        "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Mobile Safari/537.36",
        "Referer": "https://www.pw.live/study-v2/profile"
    };
}

// Global PW Fetcher (Jisme Auto-Retry / Auto-Refresh logic h)
async function pw(url) {
    let response = await fetch(url, { headers: getPWHeaders() });
    
    // Agar Response Unauthorized (401) aaye ya success false ho
    if (response.status === 401) {
        const newToken = await refreshPWToken();
        if (newToken) {
            // Naye token ke saath wapas try karein
            response = await fetch(url, { headers: getPWHeaders() });
        }
    }
    return response.json();
}
