# Konsep Database, Rumus & Format Laporan Payroll
**PT. Yawiraya Bina Mandiri — Sistem HRIS, Absensi Kartu Barcode & Payroll (Prototype)**

> Dokumen analisa awal yang disusun dari keterangan kebutuhan. Format lengkap dari perusahaan akan diberikan kemudian. Seluruh angka dan aturan di bawah ini masih **umum** dan **dapat disesuaikan** melalui menu *Rumus & Komponen*.

---

## 1. Ringkasan Kebutuhan

| Kebutuhan | Penerapan di prototype |
|---|---|
| Database karyawan **lapangan** & **kantor** | Field `kategori` (Lapangan / Kantor), unit kerja, lokasi, skema kerja |
| Sistem lama berbasis Visual Basic (desktop) | Diganti aplikasi **web berbasis domain**, dapat diakses online |
| Komponen gaji: **Pokok, Lembur, Tunjangan** | Gaji pokok, tunjangan tetap (jabatan, lokasi), tunjangan tidak tetap (makan, transport), lembur, penyesuaian |
| Jam kerja reguler **8 jam/hari (Basic)** | Skema `KTR-8` — Senin–Jumat 08:00–17:00 |
| Skema **Freeport & Perusahaan: 6 kerja, 1 libur, 7 jam/hari** | `PRS-6.1` (Senin–Sabtu, Minggu libur) dan `FCX-6.1` (roster bergulir 6/1 per grup) |
| Lembur **1,5× jam pertama, 2× jam berikutnya** | Pengali hari kerja dapat diatur; ditambah pengali hari libur (PP 35/2021) |
| Absensi terintegrasi web | **Kartu ID berbarcode** (Code 128) dipindai di scanner tiap pos → log dikirim otomatis ke server; import file scanner offline; koreksi manual operator |
| Bukti payroll | Slip gaji, kartu absensi, lembar pengesahan, daftar transfer bank |

## 2. Peran Pengguna

| Peran | Tugas utama |
|---|---|
| **Admin Master** | Kelola pengguna & hak akses, parameter, skema database, akses penuh |
| **Operator HR & Absensi** | Data karyawan, mesin & registrasi jari, koreksi absensi, persetujuan lembur (SPL) & izin/cuti |
| **Keuangan / Payroll** | Komponen gaji & rekening, hitung payroll, penyesuaian, ajukan, tandai dibayar, laporan |
| **Pimpinan / Direksi** | Dashboard, **menyetujui / mengembalikan payroll**, laporan analisa |
| **Karyawan** | Portal pribadi: kehadiran, slip gaji (setelah disetujui), pengajuan izin/cuti |

Alur payroll memisahkan tugas: **Keuangan menghitung → Pimpinan menyetujui → Keuangan membayar**. Setiap langkah tercatat (nama, peran, waktu, catatan).

## 3. Alur Data

```
Scanner kartu ───push──► log_absensi ──olah──► absensi_harian
                                                      │
           pengajuan_izin ──┬─────────────────────────┤
       persetujuan_lembur ──┘                         ▼
 karyawan + karyawan_gaji + aturan_payroll ──► payroll_periode
                                                      │
                                   payroll_detail + payroll_komponen + payroll_lembur
                                                      │
                                 Slip gaji · Laporan · Transfer bank · Pengesahan
```

## 4. Struktur Tabel

### Master
| Tabel | Field utama |
|---|---|
| `karyawan` | id, nik (unik), **id_absensi** (unik), nama, jenis_kelamin, no_ktp, npwp, **status_ptkp**, **kategori**, unit_kerja_id, jabatan, lokasi_kerja_id, **jadwal_kerja_id**, grup_roster, status_kerja (PKWTT/PKWT/Harian Lepas), **tipe_gaji** (Bulanan/Harian), tgl_masuk, tgl_keluar, status, telp, email, bank, no_rekening, atas_nama |
| `karyawan_gaji` | id, karyawan_id, berlaku_mulai, gaji_pokok, upah_harian, tunj_jabatan, tunj_makan_harian, tunj_transport_harian, ikut_bpjs_kes, ikut_bpjs_tk, ikut_jp |
| `unit_kerja` | id, kode, nama |
| `lokasi_kerja` | id, kode, nama, **tunjangan_lokasi**, keterangan |
| `jadwal_kerja` | id, kode, nama, kategori, **pola** (mingguan/siklus), hari_kerja, siklus_kerja, siklus_libur, tgl_acuan, jam_masuk, jam_pulang, istirahat_menit, **jam_reguler**, **minggu_kerja** (5/6), hari_kerja_bulan |
| `hari_libur` | tanggal (PK), nama |

### Absensi
| Tabel | Field utama |
|---|---|
| `perangkat_scanner` | id, nama, lokasi_kerja_id, serial_number, ip_address, status_online, terakhir_sinkron |
| `kartu_absensi` | id, karyawan_id, **no_kartu** (unik, isi barcode = YBM + ID absensi + versi), versi, status (Aktif/Hilang/Diblokir), tgl_terbit, tgl_blokir, alasan_ganti |
| `log_absensi` | id, no_kartu, karyawan_id, **waktu_scan**, scanner_id, metode (Kartu/Manual), **sumber** (Push scanner / Import file / Manual), diinput_oleh |
| `absensi_harian` *(view / hasil olah)* | karyawan_id + tanggal, jenis_hari, jam_masuk, jam_pulang, terlambat_menit, jam_kerja_menit, status, lembur_aktual_jam, lembur_disetujui_jam |
| `pengajuan_izin` | id, karyawan_id, jenis (Izin/Sakit/Cuti/Dinas), dari, sampai, keterangan, lampiran, status, disetujui_oleh, waktu |
| `persetujuan_lembur` | karyawan_id + tanggal, jam_diajukan, jam_disetujui, status, catatan, disetujui_oleh, waktu |

### Payroll
| Tabel | Field utama |
|---|---|
| `aturan_payroll` | berlaku_mulai, tgl_cutoff, toleransi_terlambat, lembur (pembagi, dasar, pembulatan, minimal, maks_harian, pengali JSON), tarif BPJS, metode_pph, upah_minimum_acuan |
| `tarif_ter` | kategori (A/B/C), batas_bawah, batas_atas, tarif_persen |
| `penyesuaian_gaji` | id, periode, karyawan_id, jenis (Pendapatan/Potongan), nama, nilai |
| `payroll_periode` | id, periode (unik), tgl_dari, tgl_sampai, **status** (Draft/Diajukan/Disetujui/Dibayar), dibuat_oleh, dihitung_pada, tgl_bayar, snapshot_aturan, total-total |
| `payroll_detail` | id, payroll_periode_id, karyawan_id, *snapshot data karyawan*, ringkasan kehadiran, jam_lembur, upah_per_jam, bruto_pajak, kategori_ter, tarif_ter, pph21, total_pendapatan, total_potongan, **take_home_pay**, kode_verifikasi |
| `payroll_komponen` | id, payroll_detail_id, kelompok (Pendapatan/Potongan/Perusahaan), kode, nama, keterangan, nilai |
| `payroll_lembur` | id, payroll_detail_id, tanggal, jenis_hari, jam_aktual, rincian_pengali, jam_ekuivalen, nilai |
| `payroll_riwayat` | id, payroll_periode_id, status, oleh, peran, waktu, catatan |

### Sistem
| Tabel | Field utama |
|---|---|
| `users` | id, email, nama, password_hash, **peran**, karyawan_id, aktif, login_terakhir |
| `log_aktivitas` | id, waktu, user_id, peran, aksi, data_lama, data_baru |

> Payroll yang sudah dihitung disimpan sebagai **snapshot**. Perubahan data karyawan atau aturan di kemudian hari tidak mengubah slip yang sudah disetujui.

## 5. Rumus Perhitungan

### 5.1 Pengolahan absensi
- **Masuk** = scan pertama hari itu; **pulang** = scan terakhir.
- **Terlambat** = jam masuk − jadwal masuk (status *Terlambat* bila > toleransi, bawaan 10 menit).
- **Jam kerja** = pulang − masuk − istirahat (istirahat dipotong bila durasi > 5 jam).
- Hanya 1 kali scan → *Tidak Lengkap* (dihitung hadir, perlu dikoreksi operator).
- Tidak ada scan di hari jadwal tanpa izin → *Alpa*.
- Periode absensi memakai **cut-off**: bawaan tanggal 21 bulan lalu s/d tanggal 20 bulan berjalan.

### 5.2 Lembur
```
Lembur hari kerja   = jam pulang − jadwal pulang
Lembur hari libur   = seluruh jam kerja pada hari libur / libur nasional
Dibulatkan ke bawah per 0,5 jam, minimal 0,5 jam, dibayar setelah disetujui (SPL)

Upah per jam        = (gaji pokok + tunjangan tetap) ÷ 173
Upah lembur         = upah per jam × Σ (jam × pengali)
```

| Jenis hari | Pengali (bawaan) |
|---|---|
| Hari kerja | jam ke-1 **×1,5**, jam ke-2 dst **×2** |
| Libur — pola 6 hari kerja (Freeport/Perusahaan) | jam 1–7 ×2, jam 8 ×3, jam 9 dst ×4 |
| Libur — pola 5 hari kerja (Kantor) | jam 1–8 ×2, jam 9 ×3, jam 10 dst ×4 |

**Contoh:** gaji pokok Rp 6.500.000 + tunjangan tetap Rp 500.000 → upah/jam = 7.000.000 ÷ 173 = Rp 40.462. Lembur 3 jam di hari kerja = (1×1,5 + 2×2) = 5,5 jam ekuivalen → **Rp 222.543**.

### 5.3 Komponen slip
| Kode | Komponen | Rumus |
|---|---|---|
| GP | Gaji pokok | Bulanan (pro-rata bila masuk di tengah periode) / upah harian × hari dibayar |
| TJ | Tunjangan jabatan | Tetap per bulan |
| TL | Tunjangan lokasi | Tetap, dari master lokasi kerja |
| TM / TT | Tunjangan makan / transport | Nominal × hari hadir |
| LB | Upah lembur | Lihat 5.2 |
| ADJ | Penyesuaian | Insentif, bonus, kasbon (input Keuangan) |
| PA | Potongan alpa | (pokok + tetap) ÷ hari kerja per bulan × hari alpa |
| BK / JHT / JP | BPJS pekerja | 1% (maks. upah Rp 12 jt) / 2% / 1% (maks. upah JP) |
| PPH | PPh 21 | Bruto × tarif TER |

**BPJS perusahaan** (tidak memotong gaji): Kesehatan 4%, JHT 3,7%, JP 2%, JKK 0,24% (kantor) / 1,27% (lapangan), JKM 0,3%.

### 5.4 PPh 21 (TER, PP 58/2023)
```
Bruto       = total pendapatan + JKK + JKM + BPJS Kesehatan perusahaan
PPh 21      = Bruto × tarif TER (kategori A: TK/0, TK/1, K/0 · B: TK/2, TK/3, K/1, K/2 · C: K/3)
Take home   = total pendapatan − total potongan
```
Masa Desember (perhitungan ulang tahunan Pasal 17) belum termasuk prototype.

## 6. Format Laporan

| Laporan | Isi |
|---|---|
| Rekap payroll per periode | Seluruh komponen per karyawan + total (export CSV/Excel) |
| Ringkasan biaya | Per kategori (lapangan vs kantor), per unit, per lokasi: pokok, tunjangan, lembur, % lembur, BPJS perusahaan, THP, biaya total, rata-rata per orang |
| Analisa lembur | Jam & nilai lembur per karyawan, rincian harian dengan pengali |
| BPJS | Iuran pekerja & perusahaan per program |
| PPh 21 | NPWP, PTKP, kategori TER, bruto, tarif, PPh |
| Tren periode | Perbandingan biaya antar periode dan perubahan (%) |
| Rekap absensi | Matriks harian per periode (H, T, TL, A, I, S, C, HL, L, LN) + jam lembur |

**Dokumen bukti (siap cetak / PDF):** slip gaji (dengan terbilang, rincian lembur, stempel persetujuan elektronik, kode verifikasi), kartu absensi, lembar pengesahan payroll, daftar transfer bank.

## 7. Catatan untuk Tahap Produksi

1. **Server & database:** MySQL/PostgreSQL + backend (mis. Laravel) di domain perusahaan, dengan HTTPS.
2. **Perangkat absensi:** scanner barcode 1D/2D di setiap pos (USB ke PC/tablet pos jaga, atau terminal berjaringan yang mengirim data ke API server); lokasi tanpa jaringan memakai scanner genggam dengan memori lalu file diimpor.
3. **Kartu:** dicetak PVC ukuran CR80 berisi foto, nama, jabatan dan barcode Code 128. Kartu hilang langsung diblokir dan diganti dengan versi baru. Untuk mencegah titip absen, terminal menampilkan nama & foto pemilik kartu agar diawasi petugas pos, dan dapat ditambah foto otomatis saat scan.
4. **Keamanan:** password ter-hash, login per pengguna, hak akses di sisi server, audit log, backup harian.
5. **Hal yang perlu dikonfirmasi dari format lengkap perusahaan:** daftar tunjangan & nilainya, tanggal cut-off, aturan lembur khusus Freeport, UMK/UMSK acuan, kebijakan potongan, format slip & laporan yang dipakai sekarang (sistem VB), metode PPh (gross/ditanggung), jadwal roster per grup.
