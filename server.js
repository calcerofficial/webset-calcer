const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { sql, poolPromise } = require('./koneksi_database');

// Pastikan folder uploads ada
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
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
app.use('/uploads', express.static('uploads'));

// ============================================
// Activity Log System (In-Memory)
// ============================================
const activityLogs = [];
function addLog(deskripsi) {
    const now = new Date();
    // Add to the beginning of the array
    activityLogs.unshift({
        id: Date.now(),
        waktu: now.toISOString(),
        deskripsi: deskripsi
    });
    // Keep max 50 logs
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
        const result = await pool.request()
            .input('userParam', sql.VarChar, username)
            .input('passParam', sql.VarChar, password)
            .query('SELECT id, username, nama_lengkap, role FROM Users WHERE username = @userParam AND password = @passParam');

        if (result.recordset.length > 0) {
            addLog(`Admin login ke sistem`);
            res.json({ 
                success: true, 
                message: 'Login Berhasil',
                user: result.recordset[0]
            });
        } else {
            res.status(401).json({ 
                success: false, 
                message: 'Username atau password salah!' 
            });
        }
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// API Endpoint Dashboard Stats
app.get('/api/dashboard-stats', async (req, res) => {
    try {
        const pool = await poolPromise;
        
        // Asumsi struktur query sederhana untuk menghitung total
        const mhsResult = await pool.request().query('SELECT COUNT(*) as total FROM mahasiswa');
        const prestasiResult = await pool.request().query('SELECT COUNT(*) as total FROM Prestasi');
        const kenanganResult = await pool.request().query('SELECT COUNT(*) as total FROM Kenangan');
        
        // Data statistik bulanan 2025
        const chartPrestasi = { 
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'], 
            data: [1, 0, 2, 0, 1, 3, 0, 0, 1, 4, 0, 0] // Data dummy untuk contoh 2025
        }; 

        res.json({
            success: true,
            totalMahasiswa: mhsResult.recordset[0].total,
            totalPrestasi: prestasiResult.recordset[0].total,
            totalKenangan: kenanganResult.recordset[0].total,
            chartPrestasi
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// API Endpoint Ambil Semua Mahasiswa
app.get('/api/mahasiswa', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT * FROM mahasiswa');
        res.json({ success: true, data: result.recordset });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// API Endpoint Tambah Mahasiswa
app.post('/api/mahasiswa', upload.single('foto'), async (req, res) => {
    const { nim, nama, jabatan, sub_jabatan, angkatan, status } = req.body;
    let foto = req.body.foto || null; 

    if (req.file) {
        foto = 'http://localhost:3000/uploads/' + req.file.filename;
    }

    try {
        const pool = await poolPromise;
        await pool.request()
            .input('nim', sql.Int, parseInt(nim))
            .input('nama', sql.VarChar, nama)
            .input('jabatan', sql.VarChar, jabatan)
            .input('sub_jabatan', sql.VarChar, sub_jabatan || null)
            .input('angkatan', sql.Int, parseInt(angkatan))
            .input('status', sql.VarChar, status)
            .input('foto', sql.VarChar, foto)
            .query('INSERT INTO mahasiswa (nim, nama, jabatan, sub_jabatan, angkatan, status, foto) VALUES (@nim, @nama, @jabatan, @sub_jabatan, @angkatan, @status, @foto)');
        
        addLog(`Menambahkan data mahasiswa baru: ${nama}`);
        res.json({ success: true, message: 'Data mahasiswa berhasil ditambahkan' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// API Endpoint Update Mahasiswa
app.put('/api/mahasiswa/:nim', upload.single('foto'), async (req, res) => {
    const { nim } = req.params;
    const { nama, jabatan, sub_jabatan, angkatan, status } = req.body;
    let foto = req.body.foto || null; 

    if (req.file) {
        foto = 'http://localhost:3000/uploads/' + req.file.filename;
    }

    try {
        const pool = await poolPromise;
        await pool.request()
            .input('nim', sql.Int, parseInt(nim))
            .input('nama', sql.VarChar, nama)
            .input('jabatan', sql.VarChar, jabatan)
            .input('sub_jabatan', sql.VarChar, sub_jabatan || null)
            .input('angkatan', sql.Int, parseInt(angkatan))
            .input('status', sql.VarChar, status)
            .input('foto', sql.VarChar, foto)
            .query('UPDATE mahasiswa SET nama = @nama, jabatan = @jabatan, sub_jabatan = @sub_jabatan, angkatan = @angkatan, status = @status, foto = @foto WHERE nim = @nim');
        
        addLog(`Mengubah data mahasiswa: ${nama} (NIM: ${nim})`);
        res.json({ success: true, message: 'Data mahasiswa berhasil diupdate' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// API Endpoint Hapus Mahasiswa
app.delete('/api/mahasiswa/:nim', async (req, res) => {
    const { nim } = req.params;
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('nim', sql.Int, parseInt(nim))
            .query('DELETE FROM mahasiswa WHERE nim = @nim');
        
        addLog(`Menghapus data mahasiswa NIM ${nim}`);
        res.json({ success: true, message: 'Data mahasiswa berhasil dihapus' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ============================================
// API Endpoint Prestasi
// ============================================

// GET: Ambil semua prestasi
app.get('/api/prestasi', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT * FROM Prestasi ORDER BY id DESC');
        res.json({ success: true, data: result.recordset });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST: Tambah prestasi baru
app.post('/api/prestasi', upload.single('foto'), async (req, res) => {
    const { judul_prestasi, kategori, keterangan } = req.body;
    let foto = null;
    if (req.file) {
        foto = 'http://localhost:3000/uploads/' + req.file.filename;
    }
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('judul_prestasi', sql.VarChar, judul_prestasi)
            .input('kategori', sql.VarChar, kategori)
            .input('keterangan', sql.VarChar, keterangan || null)
            .input('foto', sql.VarChar, foto)
            .query('INSERT INTO Prestasi (judul_prestasi, kategori, keterangan, foto) VALUES (@judul_prestasi, @kategori, @keterangan, @foto)');
        
        addLog(`Menambahkan prestasi baru: ${judul_prestasi}`);
        res.json({ success: true, message: 'Prestasi berhasil ditambahkan' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// PUT: Update prestasi
app.put('/api/prestasi/:id', upload.single('foto'), async (req, res) => {
    const { id } = req.params;
    const { judul_prestasi, kategori, keterangan } = req.body;
    let foto = req.body.foto || null;
    if (req.file) {
        foto = 'http://localhost:3000/uploads/' + req.file.filename;
    }
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('id', sql.Int, parseInt(id))
            .input('judul_prestasi', sql.VarChar, judul_prestasi)
            .input('kategori', sql.VarChar, kategori)
            .input('keterangan', sql.VarChar, keterangan || null)
            .input('foto', sql.VarChar, foto)
            .query('UPDATE Prestasi SET judul_prestasi = @judul_prestasi, kategori = @kategori, keterangan = @keterangan, foto = @foto WHERE id = @id');
        
        addLog(`Mengubah data prestasi: ${judul_prestasi}`);
        res.json({ success: true, message: 'Prestasi berhasil diupdate' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// DELETE: Hapus prestasi
app.delete('/api/prestasi/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('id', sql.Int, parseInt(id))
            .query('DELETE FROM Prestasi WHERE id = @id');
        
        addLog(`Menghapus data prestasi ID ${id}`);
        res.json({ success: true, message: 'Prestasi berhasil dihapus' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ============================================
// API Endpoint Kenangan
// ============================================

// GET: Ambil semua kenangan
app.get('/api/kenangan', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT * FROM Kenangan ORDER BY id DESC');
        res.json({ success: true, data: result.recordset });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST: Tambah kenangan baru
app.post('/api/kenangan', upload.single('foto'), async (req, res) => {
    const { judul_foto } = req.body;
    let foto = req.body.foto || null;
    if (req.file) {
        foto = 'http://localhost:3000/uploads/' + req.file.filename;
    }
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('judul_foto', sql.VarChar, judul_foto)
            .input('foto', sql.VarChar, foto)
            .query('INSERT INTO Kenangan (judul_foto, foto, tanggal_updload) VALUES (@judul_foto, @foto, GETDATE())');
        
        addLog(`Menambahkan foto kenangan: ${judul_foto}`);
        res.json({ success: true, message: 'Kenangan berhasil ditambahkan' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// PUT: Update kenangan
app.put('/api/kenangan/:id', async (req, res) => {
    const { id } = req.params;
    const { judul_foto, foto } = req.body;
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('id', sql.Int, parseInt(id))
            .input('judul_foto', sql.VarChar, judul_foto)
            .input('foto', sql.VarChar, foto)
            .query('UPDATE Kenangan SET judul_foto = @judul_foto, foto = @foto WHERE id = @id');
        
        addLog(`Mengubah data kenangan: ${judul_foto}`);
        res.json({ success: true, message: 'Kenangan berhasil diupdate' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// DELETE: Hapus kenangan
app.delete('/api/kenangan/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('id', sql.Int, parseInt(id))
            .query('DELETE FROM Kenangan WHERE id = @id');
        
        addLog(`Menghapus data kenangan ID ${id}`);
        res.json({ success: true, message: 'Kenangan berhasil dihapus' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server Backend berjalan di http://localhost:${PORT}`);
});