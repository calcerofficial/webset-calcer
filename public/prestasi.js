/**
 * PRESTASI.JS
 * Skrip untuk filter kategori, modal pop-up sertifikat, dan fetch data dari API.
 */

// Map kategori dari database ke data-filter di tombol HTML
const kategoriMap = {
    'Akademik': 'akademik',
    'Non Akademik': 'non-akademik',
    '5K2S PROJECT': 'lomba'
};

const tagMap = {
    'Akademik':    { cls: 'tag-akademik', label: 'Akademik' },
    'Non Akademik':{ cls: 'tag-non',      label: 'Non-Akademik' },
    '5K2S PROJECT':{ cls: 'tag-lomba',    label: '5K2S PROJECT' }
};

const emojiMap = {
    'Akademik':    '🏆',
    'Non Akademik':'⚽',
    '5K2S PROJECT':'🎨'
};

let semuaPrestasi = [];
let filterAktif = 'all';

// ===== Fetch Data dari Backend =====
document.addEventListener('DOMContentLoaded', () => {
    fetchPrestasiPublic();
    initFilter();
});

async function fetchPrestasiPublic() {
    try {
        const res = await fetch('http://localhost:3000/api/prestasi');
        const result = await res.json();
        if (result.success) {
            semuaPrestasi = result.data;
            renderPrestasiGrid(semuaPrestasi);
        }
    } catch (err) {
        console.error('Gagal memuat data prestasi:', err);
        document.getElementById('prestasiGridContainer').innerHTML =
            '<p style="text-align:center;color:#64748b;grid-column:1/-1;">Gagal memuat data dari server.</p>';
    }
}

function renderPrestasiGrid(data) {
    const container = document.getElementById('prestasiGridContainer');
    container.innerHTML = '';

    if (data.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:#64748b;grid-column:1/-1;padding:2rem;">Belum ada data prestasi.</p>';
        return;
    }

    data.forEach(item => {
        const filterAttr = kategoriMap[item.kategori] || 'lainnya';
        const tag = tagMap[item.kategori] || { cls: 'tag-lomba', label: item.kategori };
        const emoji = emojiMap[item.kategori] || '🏅';

        const imgContent = item.foto
            ? `<img src="${item.foto}" alt="${item.judul_prestasi}" style="width:100%;height:100%;object-fit:cover;">`
            : `<div class="img-placeholder">${emoji}</div>`;

        const card = document.createElement('div');
        card.className = 'prestasi-card';
        card.setAttribute('data-category', filterAttr);
        card.onclick = () => bukaSertifikat(item.judul_prestasi, item.keterangan || '', item.foto || '');

        card.innerHTML = `
            <div class="prestasi-card-img">
                ${imgContent}
            </div>
            <div class="prestasi-card-body">
                <span class="prestasi-tag ${tag.cls}">${tag.label}</span>
                <h3 class="prestasi-name">${item.judul_prestasi}</h3>
                ${item.keterangan ? `<p class="prestasi-winner">${item.keterangan}</p>` : ''}
            </div>
        `;

        container.appendChild(card);
    });

    // Re-apply filter aktif setelah render
    applyFilter(filterAktif);
}

// ===== Logika Filter Kategori =====
function initFilter() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            filterAktif = btn.getAttribute('data-filter');
            applyFilter(filterAktif);
        });
    });
}

function applyFilter(filterValue) {
    const cards = document.querySelectorAll('.prestasi-card');
    cards.forEach(card => {
        if (filterValue === 'all' || card.getAttribute('data-category') === filterValue) {
            card.classList.remove('hide');
        } else {
            card.classList.add('hide');
        }
    });
}

// ===== Logika Modal Sertifikat =====
function bukaSertifikat(judul, deskripsi, imageSrc) {
    document.getElementById('modalSertifikatTitle').textContent = judul;
    document.getElementById('modalSertifikatDesc').textContent = deskripsi || 'Tidak ada keterangan.';

    const imgEl = document.getElementById('modalSertifikatImg');
    if (imageSrc) {
        imgEl.src = imageSrc;
        imgEl.style.display = '';
    } else {
        imgEl.style.display = 'none';
    }

    const modal = document.getElementById('prestasiModal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function tutupSertifikat() {
    const modal = document.getElementById('prestasiModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

// Tutup modal jika tekan Escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') tutupSertifikat();
});
