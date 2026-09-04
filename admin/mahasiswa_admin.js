// State Data
let mahasiswaList = [];

// Fetch data dari backend
async function fetchMahasiswa() {
    try {
        const response = await fetch('http://localhost:3000/api/mahasiswa');
        const result = await response.json();
        if (result.success) {
            mahasiswaList = result.data;
            renderTable();
        }
    } catch (error) {
        console.error("Gagal mengambil data mahasiswa:", error);
    }
}

document.addEventListener('DOMContentLoaded', function () {
    fetchMahasiswa();

    // Modal Control Elements
    const modalMhs = document.getElementById('modalMhs');
    const btnOpenAddModal = document.getElementById('btnOpenAddModal');
    const btnCloseModal = document.getElementById('btnCloseModal');
    const btnCancelModal = document.getElementById('btnCancelModal');
    const formMhs = document.getElementById('formMhs');
    const modalTitle = document.getElementById('modalTitle');
    const searchInput = document.getElementById('searchMhs');

    // Buka Modal Tambah
    btnOpenAddModal.addEventListener('click', () => {
        modalTitle.textContent = 'Tambah Data Mahasiswa';
        formMhs.reset();
        document.getElementById('editIndex').value = '';
        document.getElementById('inputNim').readOnly = false; // Bisa isi NIM
        document.getElementById('groupSubJabatan').style.display = 'none'; // Sembunyikan default
        modalMhs.style.display = 'flex';
    });

    // Toggle Sub Jabatan jika Role = Pengurus
    const inputRole = document.getElementById('inputRole');
    const groupSubJabatan = document.getElementById('groupSubJabatan');
    const inputSubJabatan = document.getElementById('inputSubJabatan');

    inputRole.addEventListener('change', function () {
        if (this.value === 'Pengurus') {
            groupSubJabatan.style.display = 'block';
            inputSubJabatan.required = true;
        } else {
            groupSubJabatan.style.display = 'none';
            inputSubJabatan.required = false;
            inputSubJabatan.value = '';
        }
    });

    // Tutup Modal
    const closeModal = () => modalMhs.style.display = 'none';
    btnCloseModal.addEventListener('click', closeModal);
    btnCancelModal.addEventListener('click', closeModal);

    // Submit Form (Tambah / Edit)
    formMhs.addEventListener('submit', async function (e) {
        e.preventDefault();

        const editIndex = document.getElementById('editIndex').value;
        const nim = document.getElementById('inputNim').value;
        const nama = document.getElementById('inputNama').value;
        const jabatan = document.getElementById('inputRole').value;
        const sub_jabatan = document.getElementById('inputSubJabatan').value;
        
        // Validasi NIM: diawali 032025 dan hanya angka
        if (!/^032025\d+$/.test(nim)) {
            alert('NIM harus diawali dengan 032025 dan hanya berisi angka.');
            return;
        }

        // Validasi Nama: hanya huruf dan spasi, minimal 4 huruf
        if (!/^[a-zA-Z\s]{4,}$/.test(nama)) {
            alert('Nama harus berisi minimal 4 huruf dan hanya boleh berisi huruf alfabet.');
            return;
        }

        // Nilai Otomatis
        const angkatan = 2025;
        const status = 'Aktif';
        
        const fotoInput = document.getElementById('inputFoto');
        const fotoFile = fotoInput.files[0];

        const formData = new FormData();
        formData.append('nim', nim);
        formData.append('nama', nama);
        formData.append('angkatan', angkatan);
        formData.append('jabatan', jabatan);
        if (sub_jabatan) formData.append('sub_jabatan', sub_jabatan);
        formData.append('status', status);
        if (fotoFile) formData.append('foto', fotoFile);

        try {
            if (editIndex === '') {
                // Tambah Data Baru
                await fetch('http://localhost:3000/api/mahasiswa', {
                    method: 'POST',
                    body: formData
                });
            } else {
                // Update Data Lama
                const oldNim = mahasiswaList[editIndex].nim;
                const oldFoto = mahasiswaList[editIndex].foto;
                // Jika tidak ada foto baru yang di-upload, kirim foto lama agar tidak jadi null
                if (!fotoFile && oldFoto) {
                    formData.append('foto', oldFoto);
                }

                await fetch(`http://localhost:3000/api/mahasiswa/${oldNim}`, {
                    method: 'PUT',
                    body: formData
                });
            }

            await fetchMahasiswa();
            closeModal();
        } catch (error) {
            console.error('Gagal menyimpan data:', error);
            alert('Terjadi kesalahan saat menyimpan data.');
        }
    });

    // Pencarian Live (Search)
    searchInput.addEventListener('keyup', function () {
        const query = this.value.toLowerCase();
        const filtered = mahasiswaList.filter(mhs => 
            mhs.nama.toLowerCase().includes(query) || 
            mhs.nim.toLowerCase().includes(query)
        );
        renderTable(filtered);
    });
});

// Function Render Tabel
function renderTable(data = mahasiswaList) {
    const tbody = document.getElementById('mhsTableBody');
    tbody.innerHTML = '';

    if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; color: #64748b;">Data mahasiswa tidak ditemukan.</td></tr>`;
        return;
    }

    data.forEach((mhs, index) => {
        const statusBadge = mhs.status === 'Aktif' 
            ? `<span class="badge active">Aktif</span>` 
            : `<span class="badge inactive">Non-Aktif</span>`;
            
        const fotoHtml = mhs.foto ? `<img src="${mhs.foto}" alt="Foto" width="40" style="border-radius: 4px;">` : `<span style="color:#64748b; font-size:12px;">Tidak ada</span>`;

        const row = `
            <tr>
                <td>${index + 1}</td>
                <td>${mhs.nim}</td>
                <td>${mhs.nama}</td>
                <td>${mhs.angkatan}</td>
                <td>${mhs.jabatan}</td>
                <td>${mhs.sub_jabatan || '-'}</td>
                <td>${statusBadge}</td>
                <td>${fotoHtml}</td>
                <td>
                    <div class="action-btns">
                        <button class="btn-icon edit-btn" onclick="editMhs(${index})">
                            <i class="fa-solid fa-pen-to-square"></i>
                        </button>
                        <button class="btn-icon delete-btn" onclick="deleteMhs(${index})">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
        tbody.insertAdjacentHTML('beforeend', row);
    });
}

// Function Edit Mahasiswa
function editMhs(index) {
    const mhs = mahasiswaList[index];
    document.getElementById('modalTitle').textContent = 'Edit Data Mahasiswa';
    document.getElementById('editIndex').value = index;
    document.getElementById('inputNim').value = mhs.nim;
    document.getElementById('inputNim').readOnly = true; // Tidak bisa ganti NIM saat edit
    document.getElementById('inputNama').value = mhs.nama;
    document.getElementById('inputRole').value = mhs.jabatan;
    
    // Trigger event agar form dropdown update
    const event = new Event('change');
    document.getElementById('inputRole').dispatchEvent(event);
    
    document.getElementById('inputSubJabatan').value = mhs.sub_jabatan || '';
    document.getElementById('inputFoto').value = ''; // Kosongkan input file saat edit, jika tidak mau ganti foto biarkan kosong

    document.getElementById('modalMhs').style.display = 'flex';
}

// Function Hapus Mahasiswa
async function deleteMhs(index) {
    const mhs = mahasiswaList[index];
    if (confirm(`Apakah Anda yakin ingin menghapus mahasiswa "${mhs.nama}"?`)) {
        try {
            await fetch(`http://localhost:3000/api/mahasiswa/${mhs.nim}`, {
                method: 'DELETE'
            });
            await fetchMahasiswa();
        } catch (error) {
            console.error('Gagal menghapus data:', error);
            alert('Terjadi kesalahan saat menghapus data.');
        }
    }
}