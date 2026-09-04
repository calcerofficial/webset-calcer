/**
 * KENANGAN.JS
 * Mengambil data kenangan dari database via API dan menampilkannya sebagai galeri.
 */

// ===== Fetch & Render Data dari Backend =====
document.addEventListener('DOMContentLoaded', () => {
    fetchKenanganPublic();
});

async function fetchKenanganPublic() {
    const grid = document.getElementById('galleryGrid');
    try {
        const res = await fetch('http://localhost:3000/api/kenangan');
        const result = await res.json();

        grid.innerHTML = ''; // Hapus loading indicator

        if (result.success && result.data && result.data.length > 0) {
            result.data.forEach(item => {
                const tahun = item.tanggal_updload
                    ? new Date(item.tanggal_updload).getFullYear()
                    : new Date().getFullYear();

                const div = document.createElement('div');
                div.className = 'gallery-item';
                div.onclick = () => bukaFoto(item.foto, item.judul_foto, tahun);

                div.innerHTML = `
                    <img src="${item.foto}" alt="${item.judul_foto}"
                         onerror="this.src='../assets/fotokelas.jpg'">
                    <div class="gallery-overlay">
                        <div class="gallery-info">
                            <h3>${item.judul_foto}</h3>
                            <span>${tahun}</span>
                        </div>
                    </div>
                `;
                grid.appendChild(div);
            });
        } else {
            grid.innerHTML = '<div class="gallery-empty">📸 Belum ada foto kenangan yang tersedia.</div>';
        }
    } catch (err) {
        console.error('Gagal memuat data kenangan:', err);
        grid.innerHTML = '<div class="gallery-empty">⚠️ Gagal memuat data. Pastikan server berjalan.</div>';
    }
}

/**
 * Buka foto dalam mode full-screen lightbox
 */
function bukaFoto(src, title, year) {
    const modal = document.getElementById('lightboxModal');
    document.getElementById('lightboxImg').src = src;
    document.getElementById('lightboxTitle').textContent = title;
    document.getElementById('lightboxYear').textContent = year;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

/**
 * Tutup modal lightbox
 */
function tutupFoto() {
    const modal = document.getElementById('lightboxModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

// Tutup dengan tombol Escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') tutupFoto();
});
