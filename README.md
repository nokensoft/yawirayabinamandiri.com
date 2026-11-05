# Website PT. Yawiraya Bina Mandiri

Template website company profile **PT. Yawiraya Bina Mandiri (YBM)**. Perusahaan ini adalah General Contractor, Supplier dan Perdagangan Umum di Timika, Papua, dan sudah berdiri sejak 1996.

Desainnya minimalis modern: judul besar berhuruf kapital, kotak dan gambar bersudut tegas, serta warna yang diambil dari logo YBM (navy, biru muda, oranye). Semua teks, logo dan foto diambil dari dokumen *Company Profile PT. Yawiraya Bina Mandiri 2025*.

> Dikembangkan oleh **[Nokensoft.com](https://nokensoft.com)**

---

## Teknologi

| Teknologi | Kegunaan |
|---|---|
| HTML5 | Struktur halaman (multi-page, statis) |
| Tailwind CSS 3 (CDN) | Styling dan tata letak responsif |
| Alpine.js 3 + plugin Collapse & Intersect | Interaksi: menu mobile, tab, filter, pencarian, animasi angka |
| Font Awesome 6 | Ikon |
| Google Fonts (Inter Tight) | Tipografi |
| Open-Meteo API | Data cuaca Timika secara langsung, tanpa API key |
| Google Translate | Terjemahan otomatis ke Bahasa Inggris |
| Google Maps Embed | Peta lokasi kantor |

Website ini tidak memerlukan build tool, database, atau server khusus. Cukup diunggah ke hosting biasa.

---

## Halaman

| File | Halaman | Isi utama |
|---|---|---|
| `index.html` | Beranda | Hero foto tim dengan 4 pintasan layanan, sorotan sejarah (2006), statistik (184 tenaga kerja, 30+ tahun, 600 set scaffolding), layanan, daftar mitra berjalan, proyek terpilih, pimpinan, ajakan kontak |
| `tentang.html` | Tentang | Sejarah dan linimasa, Visi & Misi (tab), profil 3 pimpinan, komposisi SDM, data legalitas |
| `layanan.html` | Layanan | Contractors, Labour Supplier, Proyek Conveyor, General Supplier (produk 3M), Rental Unit |
| `pengalaman.html` | Pengalaman | Galeri dokumentasi dengan filter kategori, tabel 20 proyek dengan pencarian, mitra kerja sama |
| `k3.html` | K3 / SHE | Komitmen Safety, Health & Environment, 8 Program K3, struktur organisasi P2K3 |
| `armada.html` | Armada | Galeri alat berat dan bus, kendaraan berizin area tambang, tabel 30 aset dengan pencarian |
| `kontak.html` | Kontak | Kartu alamat, telepon dan email, embed Google Maps (tanpa form kontak) |

---

## Fitur Utama

### Topbar
- **Tanggal dan jam real-time** dalam zona waktu WIT (Asia/Jayapura), diperbarui setiap detik.
- **Cuaca Timika**: suhu, ikon dan keterangan cuaca dari Open-Meteo. Data disimpan sementara selama 15 menit.
- **Link media sosial**: Instagram, Facebook, YouTube dan WhatsApp Channel.
- **Pilihan bahasa ID / EN** dalam bentuk tombol teks, tanpa ikon bendera. Pilihan bahasa diingat saat berpindah halaman.

### Navigasi
- Header menempel di atas saat halaman digulir, dengan menu berbentuk pill dan penanda halaman aktif.
- Menu hamburger di layar mobile.
- Tombol telepon cepat dan tombol *kembali ke atas*.

### Konten interaktif (Alpine.js)
- Tab Visi / Misi.
- Filter galeri pengalaman per kategori.
- Pencarian langsung pada tabel proyek dan tabel aset.
- Accordion peran P2K3.
- Angka statistik yang bergerak saat terlihat di layar.
- Daftar nama mitra yang bergerak (marquee) dan berhenti saat kursor diarahkan.

### Footer
Footer dibuat rata tengah dalam 3 baris:
1. Identitas perusahaan dan kontak.
2. Menu dan media sosial.
3. Hak cipta, dan di bawahnya *Powered by Nokensoft.com* (terbuka di tab baru).

### Kualitas
- Responsif untuk mobile, tablet dan desktop.
- Aksesibel: link *lewati ke konten*, `aria-label`, alt text pada gambar, dan animasi berkurang bila pengguna mengaktifkan `prefers-reduced-motion`.
- Siap SEO dasar: judul dan meta description berbeda di setiap halaman, serta HTML yang semantik.
- Gambar lazy-load di galeri.

---

## Struktur Folder

```
yawirayabinamandiri.com/
├── index.html, tentang.html, layanan.html, pengalaman.html,
│   k3.html, armada.html, kontak.html
├── assets/
│   ├── css/style.css              # gaya tambahan (judul, tombol, chip, marquee, translate)
│   ├── js/tailwind.config.js      # warna & font tema
│   ├── js/main.js                 # topbar (jam, cuaca, bahasa) & komponen Alpine
│   └── img/                       # logo, foto proyek, armada, pimpinan, logo Nokensoft
├── admin/                         # SIMULASI panel admin & sistem database
│   ├── login.html                 # halaman masuk
│   ├── index.html                 # aplikasi panel admin (semua modul)
│   └── assets/admin.js            # data, logika, perhitungan KPI
├── hris/                          # PROTOTYPE HRIS, absensi kartu barcode & payroll
│   ├── login.html                 # pilih peran simulasi (5 pengguna)
│   ├── index.html                 # aplikasi HRIS (semua modul)
│   ├── mesin.html                 # simulator scanner kartu ID berbarcode
│   ├── cetak.html                 # slip gaji, kartu absensi, pengesahan, transfer bank
│   ├── KONSEP-DATABASE.md         # konsep tabel, rumus & format laporan (bahan analisa)
│   └── assets/                    # payroll-engine.js (rumus), hris-data.js (data & seed), hris.js (aplikasi)
├── _backup/                       # backup website sebelum pengembangan HRIS
└── _profile/                      # PDF company profile (sumber konten, JANGAN diunggah)
```

---

## Menjalankan & Mengunggah

1. Buka `index.html` langsung di browser, atau jalankan server lokal, misalnya ekstensi *Live Server* di VS Code.
2. Untuk online, unggah semua file **kecuali folder `_profile/`** ke `public_html` di hosting.

## Kustomisasi Cepat

| Kebutuhan | Lokasi |
|---|---|
| Warna tema | `assets/js/tailwind.config.js` → `navy`, `sky`, `accent`, `ink`, `surface` |
| Link media sosial | Ganti `href="#"` pada ikon media sosial di topbar dan footer setiap halaman |
| Lokasi cuaca | `assets/js/main.js` → `WEATHER_URL` (latitude/longitude) |
| Titik peta | `kontak.html` → atribut `src` pada `<iframe>` Google Maps |
| Foto | Ganti file di `assets/img/` dengan nama yang sama |

## Catatan

- **Terjemahan EN** menggunakan Google Translate otomatis. Hasilnya paling baik bila website sudah online di domain.
- **Tailwind CDN** cocok untuk template. Untuk performa produksi yang lebih baik, CSS dapat di-compile dengan Tailwind CLI.
- **Tahun per proyek** belum ditampilkan karena tabel di PDF sumber tidak terbaca utuh. Data ini perlu dikonfirmasi oleh pihak YBM.
- **Nomor rekening bank** sengaja tidak ditampilkan di website.

---

## Simulasi Panel Admin & Sistem Database

Prototipe interaktif untuk memperlihatkan fitur **Paket 2** (panel admin kelola konten) dan **Paket 3** (sistem database SDM).

- **Buka:** `admin/login.html`
- **Email:** `admin@yawirayabinamandiri.com`
- **Kata sandi:** `demo123`

> **Ini simulasi.** Semua data disimpan di *localStorage* browser, sehingga hanya ada di perangkat itu dan bisa direset kapan saja. Data karyawan, laporan dan dokumen adalah **data contoh fiktif**, bukan data karyawan YBM yang sebenarnya.

### Modul

| Modul | Fitur |
|---|---|
| **Dashboard** | Ringkasan karyawan, OAP, laporan hari ini, rata-rata KPI dan catatan K3; grafik daily report 14 hari; komposisi status karyawan; KPI per unit; peringatan kontrak/dokumen; kinerja terbaik; log aktivitas |
| **Monitoring Kinerja** | Skor KPI otomatis per karyawan dari daily report, dengan periode 7/14/30 hari, filter unit, pengurutan, predikat (Sangat Baik → Perlu Pembinaan) dan grafik progres harian per karyawan |
| **Database Karyawan** | Tambah/ubah/hapus karyawan, tampilan tabel atau kartu, pencarian dan filter. Form 5 tab: data pribadi + **foto profil 4:5**, pekerjaan & **status**, **informasi kontak** + kontak darurat, **surat kontrak**, **dokumen terkait** |
| **Unit Kerja** | Tambah/ubah/hapus unit (10 unit sesuai bidang usaha YBM), jumlah karyawan, kepala unit, skor KPI unit dan daftar kegiatan |
| **Daily Report** | **Dibuat otomatis oleh sistem** setiap hari kerja kalender (lihat di bawah). Pengawas mengisi kehadiran, kegiatan, lokasi, jam, progres, nilai kualitas, catatan K3 dan status, dengan alur cepat *Simpan & berikutnya*. Dilengkapi verifikasi pengawas, filter, **export CSV** dan tab **Kalender Kerja** |
| **Dokumen & Kontrak** | Daftar surat kontrak, KTP, BPJS dan sertifikat beserta status masa berlaku (Berlaku / Segera Berakhir / Kedaluwarsa). Bisa unggah dan pratinjau file |
| **Direktori Kontak** | Telepon (langsung ke WhatsApp), email, alamat dan kontak darurat seluruh karyawan |
| **Konten Website** | Edit teks beranda + pratinjau; kelola layanan (urutan, ikon, tampil/sembunyi); galeri proyek (unggah foto, kategori); kontak, peta & link media sosial |
| **Pengaturan** | Info akun, ukuran database, backup/pulihkan JSON, reset data demo |

### Daily Report Otomatis & Kalender Kerja

Daily report tidak dibuat manual satu per satu, tetapi dihasilkan sistem sesuai kalender hari kerja:

1. **Kalender kerja**
   - Admin menentukan hari kerja (default Senin–Sabtu), jam generate (default 07:00) dan daftar hari libur.
   - Libur nasional bertanggal tetap sudah terisi. Libur yang tanggalnya berubah tiap tahun dan cuti bersama ditambahkan sesuai SKB pemerintah.
2. **Generate otomatis**
   - Setiap hari kerja pada jam generate, sistem membuat 1 **draft "Belum Diisi"** untuk setiap karyawan aktif.
   - Karyawan berstatus *Cuti* otomatis tercatat **Cuti**.
   - Hari Minggu dan tanggal merah dilewati. Hari yang terlewat (misalnya sistem belum dibuka) ikut disusulkan.
3. **Pengisian oleh pengawas**
   - Tombol *Isi Laporan* membuka draft tertua.
   - Pengawas memilih kehadiran **Hadir / Izin / Sakit / Cuti / Alpa**. Jika hadir, pengawas mengisi detail pekerjaan.
   - *Simpan & berikutnya* langsung membuka draft selanjutnya.
4. **Pemantauan**
   - Progres pengisian hari ini tampil di dashboard dan halaman Daily Report.
   - Tab **Kalender Kerja** menampilkan tingkat pengisian per tanggal. Klik sebuah tanggal untuk melihat laporannya.
5. **Pengecualian**
   - *Laporan Manual* tetap tersedia untuk lembur di hari libur.
   - Menambah hari libur akan menghapus draft yang belum diisi pada tanggal tersebut.
   - Tombol *Generate* menjalankan generator seketika.

### Rumus Skor KPI

| Komponen | Bobot | Sumber |
|---|---|---|
| Produktivitas | 35% | rata-rata progres pekerjaan harian |
| Kualitas | 25% | rata-rata nilai kualitas 1–5 dari pengawas |
| Kehadiran | 25% | hari hadir ÷ (hari kerja kalender − izin/sakit/cuti); alpa dan laporan yang belum diisi mengurangi skor |
| K3 | 15% | 100 − 25 per insiden − 10 per near miss |

Predikat: ≥ 85 Sangat Baik · ≥ 70 Baik · ≥ 55 Cukup · < 55 Perlu Pembinaan.

### Batasan Simulasi

- Login hanya satu akun demo, tanpa keamanan server.
- File ≤ 400 KB tersimpan penuh dan bisa dipratinjau. File yang lebih besar hanya disimpan namanya dan ukurannya.
- Perubahan di *Konten Website* tersimpan di panel, tetapi **belum** mengubah halaman publik.
- Generator daily report berjalan saat panel admin dibuka, lalu dicek ulang setiap menit. Hari yang terlewat disusulkan saat panel dibuka kembali. Pada versi produksi, generator berjalan di server lewat *cron job* tepat pada jam generate, walaupun tidak ada yang membuka panel.

Pada implementasi produksi, sistem dibangun di server dengan database, sehingga:
- tersedia login multi-pengguna dengan hak akses (Admin, HR, Pengawas),
- file tersimpan di storage server,
- ada notifikasi kontrak via email,
- konten website terhubung langsung ke halaman publik.

---

## Prototype HRIS, Absensi Kartu Barcode & Payroll (`hris/`)

Prototype untuk menggantikan sistem payroll lama (Visual Basic) dengan aplikasi web berbasis domain. Fokusnya database karyawan lapangan & kantor, absensi kartu ID berbarcode yang terhubung ke web, rumus lembur & gaji, serta bukti payroll. Seluruh data adalah **dummy** dan disimpan di `localStorage` browser.

**Cara mencoba:** buka `hris/login.html`, lalu pilih salah satu peran. Kata sandi semua akun adalah `demo123`. Peran juga bisa diganti lewat menu pengguna di kanan atas.

| Peran | Akun | Yang bisa dicoba |
|---|---|---|
| Admin Master | admin@yawirayabinamandiri.com | Semua modul, pengguna & hak akses, skema database, reset data |
| Operator HR & Absensi | operator@… | Data karyawan, terbitkan/blokir/cetak kartu ID, import log scanner, koreksi absensi, persetujuan lembur & izin |
| Keuangan / Payroll | keuangan@… | Komponen gaji, hitung payroll, penyesuaian, ajukan, tandai dibayar, slip & laporan |
| Pimpinan / Direksi | pimpinan@… | Menyetujui / mengembalikan payroll Oktober (status awal *Diajukan*), laporan analisa |
| Karyawan | yohanes.wenda@… (atau pilih karyawan lain) | Kehadiran pribadi, slip gaji, pengajuan izin/cuti |

**Demo absensi kartu barcode:** buka `hris/mesin.html` di tab lain, atau pakai simulator yang tertanam di menu *Kartu & Scanner Barcode*. Klik kartu karyawan untuk memindainya, ketik/scan nomor kartu (scanner USB bekerja seperti keyboard), atau pindai barcode dengan kamera. Kartu tidak terdaftar, diblokir, atau kartu lama yang sudah diganti akan ditolak. Log terkirim otomatis dan muncul langsung di aplikasi. Atur *waktu scan* (misalnya 18:40) untuk mensimulasikan lembur, atau matikan jaringan untuk mensimulasikan scanner offline (log diantrekan, lalu dikirim saat online kembali).

**Aturan bawaan** (semua bisa diubah di menu *Rumus & Komponen*):
- Skema kerja: Kantor basic 8 jam (Senin–Jumat); Perusahaan 6-1, 7 jam; Freeport roster 6-1, 7 jam.
- Lembur hari kerja: 1,5× untuk jam pertama, 2× untuk jam berikutnya. Lembur hari libur mengikuti PP 35/2021. Upah per jam = upah ÷ 173.
- BPJS Kesehatan/JHT/JP/JKK/JKM, PPh 21 metode TER (PP 58/2023), cut-off absensi tanggal 20.

Rincian tabel, rumus dan format laporan untuk analisa ada di [`hris/KONSEP-DATABASE.md`](hris/KONSEP-DATABASE.md).

---

## Penawaran Paket Jasa Pembuatan Website — Nokensoft

Berikut prakiraan harga penawaran pembuatan website PT. Yawiraya Bina Mandiri oleh **[Nokensoft.com](https://nokensoft.com)**.

| | **Paket 1: Statis** | **Paket 2: Dinamis** | **Paket 3: Sistem Database** |
|---|---|---|---|
| **Harga** | **Rp 3.500.000** | **Rp 7.500.000** | **Rp 15.000.000** |
| Jenis website | Multi pages statis | Multi pages dinamis | Multi pages dengan sistem database |
| Panel admin (kelola konten) | — | ✓ | ✓ |
| Webmail system (email @domain perusahaan) | — | ✓ | ✓ |
| Sistem database & modul data khusus | — | — | ✓ |
| Domain + hosting | 1 tahun | 1 tahun | **2 tahun** |
| Garansi perbaikan minor | 3 bulan | 6 bulan | 12 bulan |

### Rincian Paket

**Paket 1: Website Statis Multi Pages (Rp 3.500.000)**
Sesuai template ini: 7 halaman company profile, desain responsif, topbar (jam, cuaca, bahasa), galeri, tabel dengan pencarian, dan Google Maps. Konten diperbarui oleh tim Nokensoft. Termasuk domain dan hosting selama 1 tahun.

**Paket 2: Website Dinamis + Panel Admin + Webmail (Rp 7.500.000)**
Semua fitur Paket 1, ditambah:
- Panel admin agar tim YBM dapat mengelola sendiri halaman, layanan, galeri proyek, armada dan berita.
- Webmail system dengan email resmi berdomain perusahaan (contoh: `info@yawirayabinamandiri.com`).

Termasuk domain dan hosting selama 1 tahun.

**Paket 3: Website Multi Pages dengan Sistem Database (Rp 15.000.000)**
Semua fitur Paket 2, ditambah sistem database untuk pengelolaan data operasional, misalnya:
- data proyek dan kontrak,
- data aset dan armada,
- data tenaga kerja,
- dokumen legalitas.

Modul disesuaikan dengan kebutuhan perusahaan. Termasuk domain dan hosting selama **2 tahun**.

### Bonus & Nilai Tambah Menggunakan Jasa Nokensoft

Berlaku untuk semua paket:

- 🎓 **Pelatihan** penggunaan dan pengelolaan website untuk tim YBM (daring; untuk on-site lihat *Ketentuan Umum*)
- 📄 **Dokumentasi** teknis website
- 📘 **Buku panduan** penggunaan
- 🛠️ **Pendampingan teknis sebagai admin website** selama website aktif di Nokensoft.com. Tim YBM punya tempat bertanya dan dibantu saat mengelola website.
- 🔧 **Pemeliharaan dan perbaikan minor**, termasuk pengecekan berkala agar website tetap berjalan normal
- ✅ **Garansi perbaikan minor**: 3 bulan (Paket 1), 6 bulan (Paket 2), 12 bulan (Paket 3)

**Bonus desain branding peluncuran website:**

- 🪪 Desain **kartu nama** perusahaan
- 🚀 Desain **poster launching website**
- 📊 Desain **presentasi profil perusahaan** dengan tema yang sama dengan website
- 👕 Desain **baju** dengan alamat website resmi
- 🖼️ **Poster mockup** website, kartu nama dan gantungan kunci

> Bonus desain berupa file desain digital siap cetak. Biaya cetak dan produksi (kartu nama, baju, gantungan kunci, poster) tidak termasuk dalam harga paket.

### Layanan Lanjutan Setelah Peluncuran Website

Setelah website diluncurkan, Nokensoft juga menawarkan layanan lanjutan agar website benar-benar dimanfaatkan:

| Layanan | Cakupan |
|---|---|
| 📣 **Strategi Publikasi** | Perencanaan publikasi website dan konten perusahaan (profil, proyek, kegiatan K3, berita) agar dikenal oleh calon klien dan mitra |
| 📱 **Manajemen Media Sosial** | Pengelolaan Instagram, Facebook, YouTube dan WhatsApp Channel: perencanaan konten, desain, unggahan rutin, dan laporan perkembangan |
| 🖥️ **Admin Website / Aplikasi** | Pembaruan konten website secara rutin, pengelolaan panel admin dan sistem database, input data, serta dukungan teknis harian |

#### Paket Custom Layanan Lanjutan (Bulanan)

Layanan lanjutan berbentuk paket custom terpisah dari Paket 1–3. Paket ini bisa ditambahkan ke paket mana pun, dan sangat disarankan untuk Paket 3 (sistem database).

| Paket Custom | Harga | Cakupan |
|---|---|---|
| 📣 **Strategi Publikasi & Manajemen Media Sosial** | **Rp 500.000 / bulan** | 4 poster per bulan (± 1 poster per minggu) + story; perencanaan konten & jadwal unggah; pengelolaan Instagram, Facebook, YouTube dan WhatsApp Channel |
| 🖥️ **Admin / Operator Website & Sistem Database** | **Rp 1.500.000 / bulan** | Pembaruan konten website, pengelolaan panel admin, input & pemeliharaan data sistem database (karyawan, unit kerja, daily report, dokumen), serta dukungan teknis operasional |

- **Kerja sama fleksibel** sesuai kesepakatan, dengan durasi kontrak, jumlah konten atau jam kerja yang bisa disesuaikan.
- Dikerjakan secara **part-time remote/daring**.
- **Harga dapat berubah** sesuai lingkup pekerjaan dan kesepakatan kedua belah pihak.

### Ketentuan Umum

- **Harga paket adalah biaya pembuatan sekali bayar** (*one-time payment*), sudah termasuk domain dan hosting sesuai masa berlaku paket.
- **Pelatihan dan pendampingan teknis** yang termasuk dalam bonus paket dilakukan secara **daring (online)**.
- **Pelatihan atau pendampingan on-site** di lokasi klien (Timika) dikenakan **biaya tambahan** di luar harga paket:
  - transportasi / tiket pesawat **Jayapura – Timika pergi-pulang**;
  - akomodasi (penginapan) selama di lokasi.

  Besarnya biaya menyesuaikan **jumlah hari** pelatihan atau pendampingan, dan dihitung serta disepakati sebelum keberangkatan.
- **Layanan lanjutan ditawarkan terpisah.** Manajemen media sosial dan admin website/sistem aplikasi dibuat dalam **penawaran atau kontrak terpisah**, tidak termasuk dalam harga paket.
- **Bentuk kerja layanan lanjutan** adalah kontrak **part-time secara remote/daring**. Lingkup, durasi dan biayanya **sesuai kesepakatan** kedua belah pihak.
- **Harga paket adalah prakiraan penawaran** dan dapat menyesuaikan lingkup pekerjaan final.
- **Perpanjangan domain dan hosting** setelah masa berlaku paket ditagihkan terpisah.

> Informasi & pemesanan: **[nokensoft.com](https://nokensoft.com)**
