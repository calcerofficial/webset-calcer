document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const usernameInput = document.getElementById('username').value;
    const passwordInput = document.getElementById('password').value;

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                username: usernameInput, 
                password: passwordInput 
            })
        });

        const data = await response.json();

        if (data.success) {
            alert(`Login Berhasil! Selamat datang, ${data.user.nama_lengkap}`);
            window.location.href = "dashboard_admin.html"; 
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Gagal terhubung ke server backend! Pastikan server.js sudah dijalankan.');
    }
});