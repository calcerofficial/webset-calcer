/**
 * MAHASISWA.JS — Script khusus halaman Mahasiswa
 * Terpisah dari dashboard.js agar lebih rapi dan mudah dikelola
 */

const pengurusData = [
    { src: "fotocontoh1.png", role: "Ketua Kelas" },
    { src: "fotocontoh2.png", role: "Wakil Kelas" }
];

let currentIndex = 0;

/**
 * Ganti foto pengurus dengan efek fade
 * @param {number} direction - 1 untuk maju, -1 untuk mundur
 */
function gantiOrang(direction) {
    currentIndex += direction;

    // Loop kembali ke awal/akhir jika melebihi batas
    if (currentIndex < 0) {
        currentIndex = pengurusData.length - 1;
    } else if (currentIndex >= pengurusData.length) {
        currentIndex = 0;
    }

    const imgElement  = document.getElementById('pengurus-img');
    const roleElement = document.getElementById('pengurus-role');

    // Efek transisi halus (fade out → ganti → fade in)
    imgElement.style.opacity  = 0;
    roleElement.style.opacity = 0;

    setTimeout(() => {
        imgElement.src          = pengurusData[currentIndex].src;
        roleElement.textContent = pengurusData[currentIndex].role;

        imgElement.style.opacity  = 1;
        roleElement.style.opacity = 1;
    }, 300);
}

/**
 * Data foto per mahasiswa — diambil dari data-fotos (dipisah koma)
 */
let fotoList  = [];
let fotoIndex = 0;

/**
 * Tampilkan foto ke-n di modal
 */
function tampilFoto(index) {
    const fotoEl   = document.getElementById('modal-foto');
    const avatarEl = document.getElementById('modal-avatar');
    const counterEl = document.getElementById('modal-counter');
    const prevBtn  = document.getElementById('modalPrevBtn');
    const nextBtn  = document.getElementById('modalNextBtn');

    if (fotoList.length === 0) {
        // Tidak ada foto — tampilkan emoji
        fotoEl.style.display   = 'none';
        avatarEl.style.display = '';
        counterEl.textContent  = '';
        prevBtn.style.display  = 'none';
        nextBtn.style.display  = 'none';
    } else {
        fotoEl.src             = fotoList[index];
        fotoEl.style.display   = '';
        avatarEl.style.display = 'none';
        counterEl.textContent  = (index + 1) + ' / ' + fotoList.length;
        // Sembunyikan tombol jika hanya 1 foto
        const tampilNav        = fotoList.length > 1 ? '' : 'none';
        prevBtn.style.display  = tampilNav;
        nextBtn.style.display  = tampilNav;
    }
}

/**
 * Isi data teks modal dari card
 */
function isiModal(card) {
    const d = card.dataset;
    document.getElementById('modal-nama').textContent        = d.nama      || 'Nama Mahasiswa';
    document.getElementById('modal-prodi').textContent       = d.prodi     || 'Manajemen Informatika';
    document.getElementById('modal-nim').textContent         = d.nim       || '—';
    document.getElementById('modal-jabatan').textContent     = d.jabatan   || 'Anggota';
    document.getElementById('modal-angkatan').textContent    = d.angkatan  || '2024';
    document.getElementById('modal-status').textContent      = d.status    || 'Aktif';
    document.getElementById('modal-status-text').textContent = d.status    || 'Aktif';

    // Ambil daftar foto dari data-fotos (format: "foto1.jpg,foto2.jpg,foto3.jpg")
    fotoList  = d.fotos ? d.fotos.split(',').map(f => f.trim()).filter(f => f) : [];
    fotoIndex = 0;
    tampilFoto(fotoIndex);
}

/**
 * Buka modal saat card diklik
 */
function bukaModal(card) {
    isiModal(card);
    document.getElementById('modalOverlay').classList.add('active');
    document.body.style.overflow = 'hidden';
}

/**
 * Pindah antar foto dalam satu profil mahasiswa
 * @param {number} arah - 1 = foto berikutnya, -1 = foto sebelumnya
 */
function pindahFoto(arah) {
    if (fotoList.length <= 1) return;

    fotoIndex += arah;
    if (fotoIndex < 0)               fotoIndex = fotoList.length - 1;
    if (fotoIndex >= fotoList.length) fotoIndex = 0;

    const fotoEl = document.getElementById('modal-foto');
    fotoEl.style.opacity = 0;
    setTimeout(() => {
        tampilFoto(fotoIndex);
        fotoEl.style.opacity = 1;
    }, 200);
}

/**
 * Tutup modal
 */
function tutupModal() {
    document.getElementById('modalOverlay').classList.remove('active');
    document.body.style.overflow = '';
}

// Keyboard: Esc = tutup, ArrowLeft/Right = ganti foto
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape')      tutupModal();
    if (e.key === 'ArrowRight')  pindahFoto(1);
    if (e.key === 'ArrowLeft')   pindahFoto(-1);
});

// ==== Integrasi Backend API ====
document.addEventListener('DOMContentLoaded', () => {
    fetchMahasiswaPublic();
});

async function fetchMahasiswaPublic() {
    try {
        const response = await fetch('http://localhost:3000/api/mahasiswa');
        const result = await response.json();
        
        if (result.success) {
            renderMahasiswaGrid(result.data);
        }
    } catch (error) {
        console.error('Gagal mengambil data mahasiswa:', error);
        document.getElementById('mhsGridContainer').innerHTML = '<p style="text-align:center; color:#64748b; width:100%; grid-column: 1 / -1;">Gagal memuat data mahasiswa dari server.</p>';
    }
}

function renderMahasiswaGrid(data) {
    const container = document.getElementById('mhsGridContainer');
    container.innerHTML = '';

    if (data.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#64748b; width:100%; grid-column: 1 / -1;">Belum ada data mahasiswa.</p>';
        return;
    }

    data.forEach(mhs => {
        const fotoHtml = mhs.foto 
            ? `<div class="mhs-card-photo" style="background-image: url('${mhs.foto}'); background-size: cover; background-position: center; display: flex; align-items: center; justify-content: center; overflow: hidden;"><span style="display:none;">👤</span></div>`
            : `<div class="mhs-card-photo"><span>👤</span></div>`;

        const card = document.createElement('div');
        card.className = 'mhs-card';
        card.onclick = function() { bukaModal(this); };
        
        // Atribut data untuk modal
        card.dataset.nama = mhs.nama;
        card.dataset.nim = mhs.nim;
        card.dataset.prodi = 'Manajemen Informatika';
        card.dataset.jabatan = mhs.sub_jabatan ? `${mhs.jabatan} - ${mhs.sub_jabatan}` : mhs.jabatan;
        card.dataset.status = mhs.status;
        card.dataset.angkatan = mhs.angkatan;
        card.dataset.fotos = mhs.foto || '';

        card.innerHTML = `
            ${fotoHtml}
            <div class="mhs-card-info">
                <p class="mhs-card-name">${mhs.nama}</p>
                <p class="mhs-card-nim">NIM: ${mhs.nim}</p>
            </div>
        `;

        container.appendChild(card);
    });
}
