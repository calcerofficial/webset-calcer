let dataKenangan = [];

// Fetch Data dari Backend API
async function fetchKenangan() {
    try {
        const res = await fetch('http://localhost:3000/api/kenangan');
        const result = await res.json();
        if (result.success || res.ok) {
            dataKenangan = result.data || result;
            renderTable();
        }
    } catch (err) {
        console.warn('Gagal memuat data kenangan dari API:', err);
        dataKenangan = [];
        renderTable();
    }
}

document.addEventListener('DOMContentLoaded', function () {
    fetchKenangan();

    const modal = document.getElementById('modalKenangan');
    const btnOpenAddModal = document.getElementById('btnOpenAddModal');
    const btnCloseModal = document.getElementById('btnCloseModal');
    const btnCancelModal = document.getElementById('btnCancelModal');
    const formKenangan = document.getElementById('formKenangan');
    const searchInput = document.getElementById('searchKenangan');

    // Buka Modal Tambah
    btnOpenAddModal.addEventListener('click', () => {
        document.getElementById('modalTitle').textContent = 'Tambah Foto Kenangan';
        formKenangan.reset();
        document.getElementById('editId').value = '';
        modal.style.display = 'flex';
    });

    // Tutup Modal
    const closeModal = () => modal.style.display = 'none';
    btnCloseModal.addEventListener('click', closeModal);
    btnCancelModal.addEventListener('click', closeModal);

    // Form Submit (POST & PUT via JSON)
    formKenangan.addEventListener('submit', async function (e) {
        e.preventDefault();

        const editId = document.getElementById('editId').value;
        const judul_foto = document.getElementById('inputJudul').value.trim();
        const foto = document.getElementById('inputFoto').value.trim();

        const payload = { judul_foto, foto };

        try {
            let res;
            if (editId === '') {
                // Tambah Data Baru
                res = await fetch('http://localhost:3000/api/kenangan', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            } else {
                // Edit Data
                res = await fetch(`http://localhost:3000/api/kenangan/${editId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            }

            if (res.ok) {
                await fetchKenangan();
                closeModal();
            } else {
                alert('Gagal menyimpan data ke database.');
            }
        } catch (err) {
            console.error('Error saat menyimpan kenangan:', err);
            alert('Terjadi kesalahan koneksi.');
        }
    });

    // Fitur Cari
    searchInput.addEventListener('keyup', function () {
        const query = this.value.toLowerCase();
        const filtered = dataKenangan.filter(item =>
            item.judul_foto.toLowerCase().includes(query)
        );
        renderTable(filtered);
    });
});

// Render Data ke Tabel
function renderTable(data = dataKenangan) {
    const tbody = document.getElementById('kenanganTableBody');
    tbody.innerHTML = '';

    if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #64748b;">Data foto kenangan belum tersedia.</td></tr>`;
        return;
    }

    data.forEach(item => {
        // Format tanggal upload
        const tglFormatted = item.tanggal_updload 
            ? new Date(item.tanggal_updload).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
            : '-';

        const row = `
            <tr>
                <td>${item.id}</td>
                <td>
                    <img src="${item.foto}" alt="${item.judul_foto}" class="img-preview" onerror="this.src='../fotokelas.jpg'">
                </td>
                <td><strong>${item.judul_foto}</strong></td>
                <td>${tglFormatted}</td>
                <td>
                    <div class="action-btns">
                        <button class="btn-icon edit-btn" onclick="editKenangan(${item.id})">
                            <i class="fa-solid fa-pen-to-square"></i>
                        </button>
                        <button class="btn-icon delete-btn" onclick="deleteKenangan(${item.id})">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
        tbody.insertAdjacentHTML('beforeend', row);
    });
}

// Edit Data
function editKenangan(id) {
    const item = dataKenangan.find(k => k.id === id);
    if (!item) return;

    document.getElementById('modalTitle').textContent = 'Edit Foto Kenangan';
    document.getElementById('editId').value = item.id;
    document.getElementById('inputJudul').value = item.judul_foto;
    document.getElementById('inputFoto').value = item.foto;

    document.getElementById('modalKenangan').style.display = 'flex';
}

// Hapus Data
async function deleteKenangan(id) {
    if (confirm(`Apakah Anda yakin ingin menghapus foto kenangan ID: ${id}?`)) {
        try {
            const res = await fetch(`http://localhost:3000/api/kenangan/${id}`, { method: 'DELETE' });
            if (res.ok) {
                await fetchKenangan();
            } else {
                alert('Gagal menghapus data.');
            }
        } catch (err) {
            console.error('Gagal menghapus data:', err);
        }
    }
}