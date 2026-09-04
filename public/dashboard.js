document.addEventListener("DOMContentLoaded", () => {
    const elSub = document.querySelector(".sub-title");
    const elDesc = document.querySelector(".description");

    if (!elSub || !elDesc) return;

    // Simpan teks asli dari HTML
    const textSub = elSub.textContent.trim();
    const textDesc = elDesc.textContent.trim();

    // Kosongkan teks awal untuk efek pengetikan
    elSub.textContent = "";
    elDesc.textContent = "";

    let indexSub = 0;
    let indexDesc = 0;

    // Fungsi mengetik baris sub-title (Manajemen Informatika)
    function typeSub() {
        if (indexSub < textSub.length) {
            elSub.textContent += textSub.charAt(indexSub);
            indexSub++;
            setTimeout(typeSub, 70); // Kecepatan ketik (ms)
        } else {
            elSub.classList.remove("typing-cursor");
            elDesc.classList.add("typing-cursor");
            setTimeout(typeDesc, 300); // Jeda sebelum mengetik deskripsi
        }
    }

    // Fungsi mengetik baris deskripsi (Move Bold Move Calcer)
    function typeDesc() {
        if (indexDesc < textDesc.length) {
            elDesc.textContent += textDesc.charAt(indexDesc);
            indexDesc++;
            setTimeout(typeDesc, 60);
        } else {
            // Hilangkan kursor berkedip setelah selesai
            setTimeout(() => elDesc.classList.remove("typing-cursor"), 1500);
        }
    }

    // Jalankan efek pengetikan
    elSub.classList.add("typing-cursor");
    setTimeout(typeSub, 400);

    // Navigasi aktif saat di-klik
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            // Hapus class active dari semua menu
            navItems.forEach(nav => nav.classList.remove('active'));
            // Tambahkan class active ke menu yang di-klik
            this.classList.add('active');
        });
    });
});