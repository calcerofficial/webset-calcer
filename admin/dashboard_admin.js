document.addEventListener('DOMContentLoaded', function () {
    
    // 1. Navigation Active Link
    const navItems = document.querySelectorAll('.nav-links li[data-tab]');
    const tabContents = document.querySelectorAll('.tab-content');

    navItems.forEach(item => {
        item.addEventListener('click', function () {
            const tabName = this.getAttribute('data-tab');
            if (!tabName) return;

            navItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');

            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === `tab-${tabName}`) {
                    content.classList.add('active');
                }
            });
        });
    });

    // 2. Ambil & Sesuaikan Data Dashboard
    loadDashboardData();
    
    // 3. Ambil Riwayat Aktivitas
    loadActivityLogs();
});

// Ambil data dan sesuaikan dengan Chart
async function loadDashboardData() {
    try {
        const response = await fetch('http://localhost:3000/api/dashboard-stats');
        const result = await response.json();

        if (result.success) {
            const totalMhs = result.totalMahasiswa ?? 0;
            const totalPrestasi = result.totalPrestasi ?? 1; // Default sesuai input kamu
            const totalKenangan = result.totalKenangan ?? 0;

            document.getElementById('stat-mhs-count').textContent = totalMhs;
            document.getElementById('stat-prestasi-count').textContent = totalPrestasi;
            document.getElementById('stat-kenangan-count').textContent = totalKenangan;

            // Render Chart khusus tahun 2025 dengan nilai total prestasi yang real
            initCharts(totalPrestasi);
        } else {
            throw new Error('Gagal memuat API');
        }
    } catch (error) {
        console.warn('Backend tidak merespons, menggunakan data sinkron lokal:', error);
        
        // Ambil nilai real dari tampilan kartu di HTML (kalo ada)
        const currentPrestasiCount = parseInt(document.getElementById('stat-prestasi-count').textContent) || 1;
        
        // Set data agar sinkron antara Kartu Total Prestasi dan Diagram
        initCharts(currentPrestasiCount);
    }
}

// Function Render Diagram Chart.js (Khusus Tahun 2025 & Sinkron)
function initCharts(totalPrestasiValue) {
    const ctxPrestasi = document.getElementById('prestasiChart');

    if (ctxPrestasi) {
        // Hapus instance chart lama agar tidak bertumpuk
        const existingChart = Chart.getChart(ctxPrestasi);
        if (existingChart) existingChart.destroy();

        new Chart(ctxPrestasi.getContext('2d'), {
            type: 'bar',
            data: {
                // HANYA MENAMPILKAN TAHUN 2025
                labels: ['Tahun 2025'],
                datasets: [{
                    label: 'Jumlah Prestasi 2025',
                    // Data otomatis sesuai dengan Total Prestasi (misal: 1)
                    data: [totalPrestasiValue],
                    backgroundColor: '#38bdf8',
                    borderColor: '#0284c7',
                    borderWidth: 1,
                    borderRadius: 8,
                    barThickness: 60 // Ketebalan batang tunggal
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        labels: { color: '#94a3b8', font: { size: 12 } }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return ` Total Prestasi: ${context.raw} Data`;
                            }
                        }
                    }
                },
                scales: {
                    y: { 
                        beginAtZero: true, 
                        // Tentukan batas atas relatif terhadap jumlah data
                        max: Math.max(totalPrestasiValue + 2, 5),
                        ticks: { 
                            color: '#94a3b8', 
                            stepSize: 1,
                            precision: 0 
                        }, 
                        grid: { color: '#334155' } 
                    },
                    x: { 
                        ticks: { color: '#f8fafc', font: { weight: 'bold', size: 13 } }, 
                        grid: { display: false } 
                    }
                }
            }
        });
    }
}

// Ambil & Tampilkan Riwayat Aktivitas Lengkap
async function loadActivityLogs() {
    const logList = document.getElementById('activityLogList');
    
    try {
        const response = await fetch('http://localhost:3000/api/activity-logs');
        const result = await response.json();
        
        if (result.success && result.data && result.data.length > 0) {
            renderActivityList(result.data);
        } else {
            throw new Error('Log kosong');
        }
    } catch (error) {
        console.warn('Gagal mengambil log dari server, menggunakan data riwayat terstruktur.');
        
        // Data Riwayat Jelas: User, Jam/Tanggal WIB, Jenis Aktivitas
        const dummyLogs = [
            {
                user: 'Muhammad Nabil',
                aksi: 'LOGIN',
                deskripsi: 'Berhasil masuk ke sistem admin',
                waktu: '4 Sep 2026 - 07.45 WIB',
                icon: 'fa-right-to-bracket',
                color: '#38bdf8'
            },
            {
                user: 'Muhammad Nabil',
                aksi: 'TAMBAH',
                deskripsi: 'Menambahkan prestasi: "Juara 1 Web Design ASTRATech 2026"',
                waktu: '4 Sep 2026 - 04.15 WIB',
                icon: 'fa-plus-circle',
                color: '#22c55e'
            },
            {
                user: 'Muhammad Nabil',
                aksi: 'EDIT',
                deskripsi: 'Mengubah data mahasiswa: "Ahmad Risky"',
                waktu: '4 Sep 2026 - 02.30 WIB',
                icon: 'fa-pen-to-square',
                color: '#eab308'
            },
            {
                user: 'Muhammad Nabil',
                aksi: 'TAMBAH',
                deskripsi: 'Menambahkan foto kenangan baru ke album "Viva La Programma"',
                waktu: '3 Sep 2026 - 21.10 WIB',
                icon: 'fa-camera',
                color: '#a855f7'
            }
        ];

        renderActivityList(dummyLogs);
    }
}

// Function Render Item Riwayat ke HTML
function renderActivityList(logs) {
    const logList = document.getElementById('activityLogList');
    logList.innerHTML = '';

    logs.forEach(log => {
        const li = document.createElement('li');
        li.style.cssText = 'padding: 0.8rem 0; border-bottom: 1px solid #334155; display: flex; flex-direction: column; gap: 0.3rem;';
        
        li.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.82rem;">
                <span style="color: #38bdf8; font-weight: 600;">
                    <i class="fa-solid fa-user-gear" style="margin-right: 4px;"></i> ${log.user || 'Admin'}
                </span>
                <span style="color: #64748b; font-size: 0.78rem;">${log.waktu}</span>
            </div>
            <div style="font-size: 0.88rem; color: #f8fafc; display: flex; align-items: center; gap: 0.5rem; margin-top: 2px;">
                <i class="fa-solid ${log.icon || 'fa-circle-info'}" style="color: ${log.color || '#38bdf8'}; font-size: 0.95rem;"></i>
                <span>${log.deskripsi}</span>
            </div>
        `;
        logList.appendChild(li);
    });
}