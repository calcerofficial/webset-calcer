const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { poolPromise } = require('./koneksi_database');

// Pastikan folder uploads ada (di Vercel gunakan /tmp jika read-only)
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Konfigurasi Multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        cb(null, 'foto-' + Date.now() + path.extname(file.originalname))
    }
});
const upload = multer({ storage: storage });

const app = express();
app.use(express.json());
app.use(cors());

// Serve folder statis (HTML, CSS, JS, & Uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/admin', express.static(path.join(__dirname, 'admin')));

// Redirect Halaman Utama (root) langsung ke Public Dashboard
app.get('/', (req, res) => {
    res.redirect('/public/dashboard.html');
});

// ============================================
// Activity Log System (In-Memory)
// ============================================
const activityLogs = [];
function addLog(deskripsi) {
    const now = new Date();
    activityLogs.unshift({
        id: Date.now(),
        waktu: now.toISOString(),
        deskripsi: deskripsi
    });
    if (activityLogs.length > 50) {
        activityLogs.pop();
    }
}

// Endpoint untuk mengambil activity logs
app.get('/api/activity-logs', (req, res) => {
    res.json({ success: true, data: activityLogs });
});

// API Endpoint Login
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const pool = await poolPromise;
        const [rows] = await pool.query(
            'SELECT id, username, nama_lengkap, role FROM users WHERE username = ? AND password = ?',
            [username, password]
        );

        if (rows.length > 0) {
            addLog(`Admin login ke sistem`);
            res.json({ 
                success: true, 
                message: 'Login Berhasil',
                user: rows[0]
            });
        } else {
            res.status(401).json({ 
                success: false, 
                message: 'Username atau password salah!' 
            });
        }
    } catch (err) {
        console.error("ERROR LOGIN:", err.message);
        res.status(500).json({ success: false, message: err.message });
    }
});

// API Endpoint Dashboard Stats
app.get('/api/dashboard-stats', async (req, res) => {
    try {
        const pool = await poolPromise;
        const [mhsRows] = await pool.query('SELECT COUNT(*) as total FROM mahasiswa');
        const [prestasiRows] = await pool.query('SELECT COUNT(*) as total FROM Prestasi');
        const [kenanganRows] = await pool.query('SELECT COUNT(*) as total FROM Kenangan');
        
        const chartPrestasi = { 
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'], 
            data: [1, 0, 2, 0, 1, 3, 0, 0, 1, 4, 0, 0]
        }; 

        res.json({
            success: true,
            totalMahasiswa: mhsRows[0].total,
            totalPrestasi: prestasiRows[0].total,
            totalKenangan: kenanganRows[0].total,
            chartPrestasi
        });
    } catch (err) {
        console.error("ERROR DASHBOARD STATS:", err.message);
        res.status(500).json({ success: false, message: err.message });
    }
});

// API Endpoint Ambil Semua Mahasiswa
app.get('/api/mahasiswa', async (req, res) => {
    try {
        const pool = await poolPromise;
        const [rows] = await pool.query('SELECT * FROM mahasiswa');
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error("ERROR GET MAHASISWA:", err.message);
        res.status(500).json({ success: false, message: err.message });
    }
});

// API Endpoint Tambah Mahasiswa
app.post('/api/mahasiswa', upload.single('foto'), async (req, res) => {
    const { nim, nama, jabatan, sub_jabatan, angkatan, status } = req.body;
    let foto = req.body.foto || null; 

    if (req.file) {
        foto = '/uploads/' + req.file.filename;
    }

    try {
        const pool = await poolPromise;
        await pool.query(
            'INSERT INTO mahasiswa (nim, nama, jabatan, sub_jabatan, angkatan, status, foto) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [parseInt(nim), nama, jabatan, sub_jabatan || null, parseInt(angkatan), status, foto]
        );
        
        addLog(`Menambahkan data mahasiswa baru: ${nama}`);
        res.json({ success: true, message: 'Data mahasiswa berhasil ditambahkan' });
    } catch (err) {
        console.error("ERROR POST MAHASISWA:", err.message);
        res.status(500).json({ success: false, message: err.message });
    }
});

// API Endpoint Update Mahasiswa
app.put('/api/mahasiswa/:nim', upload.single('foto'), async (req, res) => {
    const { nim } = req.params;
    const { nama, jabatan, sub_jabatan, angkatan, status } = req.body;
    let foto = req.body.foto || null; 

    if (req.file) {
        foto = '/uploads/' + req.file.filename;
    }

    try {
        const pool = await poolPromise;
        await pool.query(
            'UPDATE mahasiswa SET nama = ?, jabatan = ?, sub_jabatan = ?, angkatan = ?, status = ?, foto = ? WHERE nim = ?',
            [nama, jabatan, sub_jabatan || null, parseInt(angkatan), status, foto, parseInt(nim)]
        );
        
        addLog(`Mengubah data mahasiswa: ${nama} (NIM: ${nim})`);
        res.json({ success: true, message: 'Data mahasiswa berhasil diupdate' });
    } catch (err) {
        console.error("ERROR PUT MAHASISWA:", err.message);
        res.status(500).json({ success: false, message: err.message });
    }
});

// API Endpoint Hapus Mahasiswa
app.delete('/api/mahasiswa/:nim', async (req, res) => {
    const { nim } = req.params;
    try {
        const pool = await poolPromise;
        await pool.query('DELETE FROM mahasiswa WHERE nim = ?', [parseInt(nim)]);
        
        addLog(`Menghapus data mahasiswa NIM ${nim}`);
        res.json({ success: true, message: 'Data mahasiswa berhasil dihapus' });
    } catch (err) {
        console.error("ERROR DELETE MAHASISWA:", err.message);
        res.status(500).json({ success: false, message: err.message });
    }
});

// ============================================
// API Endpoint Prestasi
// ============================================

app.get('/api/prestasi', async (req, res) => {
    try {
        const pool = await poolPromise;
        const [rows] = await pool.query('SELECT * FROM Prestasi ORDER BY id DESC');
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error("ERROR GET PRESTASI:", err.message);
        res.status(500).json({ success: false, message: err.message });
    }
});

app.post('/api/prestasi', upload.single('foto'), async (req, res) => {
    const { judul_prestasi, kategori, keterangan } = req.body;
    let foto = null;
    if (req.file) {
        foto = '/uploads/' + req.file.filename;
    }
    try {
        const pool = await poolPromise;
        await pool.query(
            'INSERT INTO Prestasi (judul_prestasi, kategori, keterangan, foto) VALUES (?, ?, ?, ?)',
            [judul_prestasi, kategori, keterangan || null, foto]
        );
        
        addLog(`Menambahkan prestasi baru: ${judul_prestasi}`);
        res.json({ success: true, message: 'Prestasi berhasil ditambahkan' });
    } catch (err) {
        console.error("ERROR POST PRESTASI:", err.message);
        res.status(500).json({ success: false, message: err.message });
    }
});

app.put('/api/prestasi/:id', upload.single('foto'), async (req, res) => {
    const { id } = req.params;
    const { judul_prestasi, kategori, keterangan } = req.body;
    let foto = req.body.foto || null;
    if (req.file) {
        foto = '/uploads/' + req.file.filename;
    }
    try {
        const pool = await poolPromise;
        await pool.query(
            'UPDATE Prestasi SET judul_prestasi = ?, kategori = ?, keterangan = ?, foto = ? WHERE id = ?',
            [judul_prestasi, kategori, keterangan || null, foto, parseInt(id)]
        );
        
        addLog(`Mengubah data prestasi: ${judul_prestasi}`);
        res.json({ success: true, message: 'Prestasi berhasil diupdate' });
    } catch (err) {
        console.error("ERROR PUT PRESTASI:", err.message);
        res.status(500).json({ success: false, message: err.message });
    }
});

app.delete('/api/prestasi/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await poolPromise;
        await pool.query('DELETE FROM Prestasi WHERE id = ?', [parseInt(id)]);
        
        addLog(`Menghapus data prestasi ID ${id}`);
        res.json({ success: true, message: 'Prestasi berhasil dihapus' });
    } catch (err) {
        console.error("ERROR DELETE PRESTASI:", err.message);
        res.status(500).json({ success: false, message: err.message });
    }
});

// ============================================
// API Endpoint Kenangan
// ============================================

app.get('/api/kenangan', async (req, res) => {
    try {
        const pool = await poolPromise;
        const [rows] = await pool.query('SELECT * FROM Kenangan ORDER BY id DESC');
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error("ERROR GET KENANGAN:", err.message);
        res.status(500).json({ success: false, message: err.message });
    }
});

app.post('/api/kenangan', upload.single('foto'), async (req, res) => {
    const { judul_foto } = req.body;
    let foto = req.body.foto || null;
    if (req.file) {
        foto = '/uploads/' + req.file.filename;
    }
    try {
        const pool = await poolPromise;
        await pool.query(
            'INSERT INTO Kenangan (judul_foto, foto, tanggal_updload) VALUES (?, ?, NOW())',
            [judul_foto, foto]
        );
        
        addLog(`Menambahkan foto kenangan: ${judul_foto}`);
        res.json({ success: true, message: 'Kenangan berhasil ditambahkan' });
    } catch (err) {
        console.error("ERROR POST KENANGAN:", err.message);
        res.status(500).json({ success: false, message: err.message });
    }
});

app.put('/api/kenangan/:id', async (req, res) => {
    const { id } = req.params;
    const { judul_foto, foto } = req.body;
    try {
        const pool = await poolPromise;
        await pool.query(
            'UPDATE Kenangan SET judul_foto = ?, foto = ? WHERE id = ?',
            [judul_foto, foto, parseInt(id)]
        );
        
        addLog(`Mengubah data kenangan: ${judul_foto}`);
        res.json({ success: true, message: 'Kenangan berhasil diupdate' });
    } catch (err) {
        console.error("ERROR PUT KENANGAN:", err.message);
        res.status(500).json({ success: false, message: err.message });
    }
});

app.delete('/api/kenangan/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await poolPromise;
        await pool.query('DELETE FROM Kenangan WHERE id = ?', [parseInt(id)]);
        
        addLog(`Menghapus data kenangan ID ${id}`);
        res.json({ success: true, message: 'Kenangan berhasil dihapus' });
    } catch (err) {
        console.error("ERROR DELETE KENANGAN:", err.message);
        res.status(500).json({ success: false, message: err.message });
    }
});

// Jalankan Server Lokal
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server Backend berjalan di http://localhost:${PORT}`);
});

// Export modul app untuk Vercel
module.exports = app;