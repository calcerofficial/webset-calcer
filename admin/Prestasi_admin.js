/**
 * PRESTASI_ADMIN.JS
 * Terhubung ke backend API — data langsung dari database.
 */

let dataPrestasi = [];

// ===== Fetch Data dari API =====
async function fetchPrestasi() {
    try {
        const res = await fetch('http://localhost:3000/api/prestasi');
        const result = await res.json();
        if (result.success) {
            dataPrestasi = result.data;
            renderTable();
        }
    } catch (err) {
        console.error('Gagal memuat data prestasi:', err);
    }
}

document.addEventListener('DOMContentLoaded', function () {
    fetchPrestasi();

    const modal = document.getElementById('modalPrestasi');
    const btnOpenAddModal = document.getElementById('btnOpenAddModal');
    const btnCloseModal = document.getElementById('btnCloseModal');
    const btnCancelModal = document.getElementById('btnCancelModal');
    const formPrestasi = document.getElementById('formPrestasi');
    const searchInput = document.getElementById('searchPrestasi');

    // Buka Modal Tambah
    btnOpenAddModal.addEventListener('click', () => {
        document.getElementById('modalTitle').textContent = 'Tambah Data Prestasi';
        formPrestasi.reset();
        document.getElementById('editId').value = '';
        modal.style.display = 'flex';
    });

    // Tutup Modal
    const closeModal = () => modal.style.display = 'none';
    btnCloseModal.addEventListener('click', closeModal);
    btnCancelModal.addEventListener('click', closeModal);

    // Form Submit (Tambah & Edit)
    formPrestasi.addEventListener('submit', async function (e) {
        e.preventDefault();

        const editId = document.getElementById('editId').value;
        const judul_prestasi = document.getElementById('inputJudul').value.trim();
        const kategori = document.getElementById('inputKategori').value;
        const keterangan = document.getElementById('inputKeterangan').value.trim();
        const fotoInput = document.getElementById('inputFoto');
        const fotoFile = fotoInput.files[0];

        const formData = new FormData();
        formData.append('judul_prestasi', judul_prestasi);
        formData.append('kategori', kategori);
        formData.append('keterangan', keterangan);
        if (fotoFile) formData.append('foto', fotoFile);

        try {
            if (editId === '') {
                // Tambah Baru
                await fetch('http://localhost:3000/api/prestasi', {
                    method: 'POST',
                    body: formData
                });
            } else {
                // Jika tidak upload foto baru, pertahankan foto lama
                const oldItem = dataPrestasi.find(p => p.id == editId);
                if (!fotoFile && oldItem && oldItem.foto) {
                    formData.append('foto', oldItem.foto);
                }
                await fetch(`http://localhost:3000/api/prestasi/${editId}`, {
                    method: 'PUT',
                    body: formData
                });
            }

            await fetchPrestasi();
            closeModal();
        } catch (err) {
            console.error('Gagal menyimpan prestasi:', err);
            alert('Terjadi kesalahan saat menyimpan data.');
        }
    });

    // Fitur Cari
    searchInput.addEventListener('keyup', function () {
        const query = this.value.toLowerCase();
        const filtered = dataPrestasi.filter(item =>
            item.judul_prestasi.toLowerCase().includes(query) ||
            item.kategori.toLowerCase().includes(query)
        );
        renderTable(filtered);
    });
});

// Render Data ke Tabel
function renderTable(data = dataPrestasi) {
    const tbody = document.getElementById('prestasiTableBody');
    tbody.innerHTML = '';

    if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #64748b;">Data prestasi tidak ditemukan.</td></tr>`;
        return;
    }

    data.forEach(item => {
        let badgeClass = 'badge-akademik';
        if (item.kategori === 'Non Akademik') badgeClass = 'badge-non-akademik';
        if (item.kategori === '5K2S PROJECT') badgeClass = 'badge-project';

        const fotoHtml = item.foto
            ? `<img src="${item.foto}" alt="Foto" class="img-preview" style="width:50px;height:50px;object-fit:cover;border-radius:6px;">`
            : `<span style="color:#64748b;font-size:12px;">Tidak ada</span>`;

        const row = `
            <tr>
                <td>${item.id}</td>
                <td>${fotoHtml}</td>
                <td><strong>${item.judul_prestasi}</strong></td>
                <td><span class="badge-kategori ${badgeClass}">${item.kategori}</span></td>
                <td>${item.keterangan ? item.keterangan : '-'}</td>
                <td>
                    <div class="action-btns">
                        <button class="btn-icon edit-btn" onclick="editPrestasi(${item.id})">
                            <i class="fa-solid fa-pen-to-square"></i>
                        </button>
                        <button class="btn-icon delete-btn" onclick="deletePrestasi(${item.id})">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
        tbody.insertAdjacentHTML('beforeend', row);
    });
}

// Handler Edit
function editPrestasi(id) {
    const item = dataPrestasi.find(p => p.id === id);
    if (!item) return;

    document.getElementById('modalTitle').textContent = 'Edit Data Prestasi';
    document.getElementById('editId').value = item.id;
    document.getElementById('inputJudul').value = item.judul_prestasi;
    document.getElementById('inputKategori').value = item.kategori;
    document.getElementById('inputKeterangan').value = item.keterangan || '';
    document.getElementById('inputFoto').value = ''; // Kosongkan, biarkan kosong jika tidak ganti foto

    document.getElementById('modalPrestasi').style.display = 'flex';
}

// Handler Hapus
async function deletePrestasi(id) {
    if (confirm(`Apakah Anda yakin ingin menghapus prestasi ID: ${id}?`)) {
        try {
            await fetch(`http://localhost:3000/api/prestasi/${id}`, { method: 'DELETE' });
            await fetchPrestasi();
        } catch (err) {
            console.error('Gagal menghapus prestasi:', err);
            alert('Terjadi kesalahan saat menghapus data.');
        }
    }
}