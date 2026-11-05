/* =====================================================================
   APLIKASI HRIS, ABSENSI KARTU BARCODE & PAYROLL — YBM (PROTOTYPE)
   Komponen Alpine.js untuk hris/index.html
   ===================================================================== */
const E = window.PayrollEngine;
const H = window.HRIS;
const { iso, parseISO, addDays, fmt, num } = E;

// ------------------------------------------------------------ menu & hak akses
const ROUTES = {
  dashboard: ['Dashboard', 'fa-gauge-high', ['admin', 'operator', 'keuangan', 'pimpinan']],
  saya: ['Portal Saya', 'fa-id-badge', ['karyawan']],
  karyawan: ['Database Karyawan', 'fa-id-card', ['admin', 'operator', 'keuangan', 'pimpinan']],
  jadwal: ['Jadwal & Kalender', 'fa-calendar-days', ['admin', 'operator']],
  absensi: ['Rekap Kehadiran', 'fa-calendar-check', ['admin', 'operator', 'keuangan', 'pimpinan']],
  scanner: ['Kartu & Scanner Barcode', 'fa-barcode', ['admin', 'operator']],
  lembur: ['Lembur', 'fa-business-time', ['admin', 'operator', 'keuangan', 'pimpinan']],
  pengajuan: ['Izin, Sakit & Cuti', 'fa-envelope-open-text', ['admin', 'operator']],
  payroll: ['Proses Payroll', 'fa-money-check-dollar', ['admin', 'keuangan', 'pimpinan']],
  slip: ['Slip Gaji & Dokumen', 'fa-file-invoice-dollar', ['admin', 'keuangan']],
  laporan: ['Laporan & Analisa', 'fa-chart-column', ['admin', 'keuangan', 'pimpinan']],
  rumus: ['Rumus & Komponen', 'fa-square-root-variable', ['admin', 'keuangan', 'pimpinan']],
  pengguna: ['Pengguna & Hak Akses', 'fa-users-gear', ['admin']],
  skema: ['Skema Database', 'fa-database', ['admin']],
  audit: ['Log Aktivitas', 'fa-clock-rotate-left', ['admin', 'pimpinan']],
};
const MENU = [
  ['Utama', ['dashboard', 'saya']],
  ['Karyawan & Absensi', ['karyawan', 'jadwal', 'scanner', 'absensi', 'lembur', 'pengajuan']],
  ['Payroll', ['payroll', 'slip', 'laporan', 'rumus']],
  ['Sistem', ['pengguna', 'skema', 'audit']],
];
const PERMS = {
  'emp.edit': ['Tambah / ubah data karyawan', ['admin', 'operator']],
  'emp.gaji.view': ['Melihat data gaji karyawan', ['admin', 'keuangan', 'pimpinan']],
  'emp.gaji': ['Mengubah komponen gaji & rekening', ['admin', 'keuangan']],
  'device.manage': ['Kelola scanner, terbitkan & blokir kartu ID', ['admin', 'operator']],
  'absen.edit': ['Koreksi absensi manual & import log', ['admin', 'operator']],
  'ot.approve': ['Menyetujui lembur (SPL)', ['admin', 'operator']],
  'leave.approve': ['Menyetujui izin, sakit & cuti', ['admin', 'operator']],
  'jadwal.edit': ['Mengatur jadwal kerja & hari libur', ['admin', 'operator']],
  'payroll.process': ['Menghitung & mengajukan payroll', ['admin', 'keuangan']],
  'payroll.approve': ['Menyetujui / menolak payroll', ['admin', 'pimpinan']],
  'payroll.pay': ['Menandai payroll dibayar', ['admin', 'keuangan']],
  'rules.edit': ['Mengubah rumus & parameter payroll', ['admin', 'keuangan']],
  'leave.request': ['Mengajukan izin / cuti pribadi', ['karyawan', 'operator', 'keuangan']],
  'user.manage': ['Kelola pengguna & reset data', ['admin']],
};

const RUN_STATUS = {
  Draft: { cls: 'bg-slate-100 text-slate-700 ring-slate-500/20', icon: 'fa-pen-ruler' },
  Diajukan: { cls: 'bg-amber-50 text-amber-800 ring-amber-600/20', icon: 'fa-hourglass-half' },
  Disetujui: { cls: 'bg-blue-50 text-blue-700 ring-blue-600/20', icon: 'fa-circle-check' },
  Dibayar: { cls: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20', icon: 'fa-money-bill-transfer' },
  Ditolak: { cls: 'bg-red-50 text-red-700 ring-red-600/20', icon: 'fa-circle-xmark' },
};
const KODE = {
  H: ['Hadir', 'bg-emerald-100 text-emerald-800'], T: ['Terlambat', 'bg-amber-100 text-amber-900'], TL: ['Tidak lengkap (1 kali scan)', 'bg-orange-100 text-orange-900'],
  A: ['Alpa', 'bg-red-600 text-white'], I: ['Izin', 'bg-blue-100 text-blue-800'], S: ['Sakit', 'bg-violet-100 text-violet-800'], C: ['Cuti', 'bg-sky/20 text-navy'], D: ['Dinas', 'bg-teal-100 text-teal-800'],
  L: ['Libur (jadwal)', 'bg-surface text-ink/30'], LN: ['Libur nasional', 'bg-red-50 text-red-400'], HL: ['Masuk hari libur (lembur)', 'bg-navy text-white'], '·': ['Belum absen hari ini', 'bg-white text-ink/40 ring-1 ring-inset ring-dashed ring-ink/20'], '': ['Terjadwal', 'bg-white text-ink/20'],
};
const STATUS_CLS = {
  Hadir: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20', Terlambat: 'bg-amber-50 text-amber-800 ring-amber-600/20', 'Tidak Lengkap': 'bg-orange-50 text-orange-800 ring-orange-600/20',
  Alpa: 'bg-red-50 text-red-700 ring-red-600/20', Izin: 'bg-blue-50 text-blue-700 ring-blue-600/20', Sakit: 'bg-violet-50 text-violet-700 ring-violet-600/20', Cuti: 'bg-sky-50 text-navy ring-sky/30', Dinas: 'bg-teal-50 text-teal-700 ring-teal-600/20',
  'Masuk Hari Libur': 'bg-navy/10 text-navy ring-navy/20', 'Sedang Bekerja': 'bg-emerald-50 text-emerald-700 ring-emerald-600/20', 'Belum Absen': 'bg-white text-ink/50 ring-ink/15',
  Libur: 'bg-slate-100 text-slate-500 ring-slate-500/10', 'Libur Nasional': 'bg-red-50 text-red-500 ring-red-500/10', Terjadwal: 'bg-white text-ink/40 ring-ink/10',
  Menunggu: 'bg-amber-50 text-amber-800 ring-amber-600/20', Disetujui: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20', Ditolak: 'bg-red-50 text-red-700 ring-red-600/20',
};
const CARD_STATUS = {
  Aktif: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20', Hilang: 'bg-red-50 text-red-700 ring-red-600/20',
  Diblokir: 'bg-red-50 text-red-700 ring-red-600/20', 'Belum Diterbitkan': 'bg-amber-50 text-amber-800 ring-amber-600/20',
};

// ------------------------------------------------------------ konsep skema database (untuk analisa)
const SCHEMA = [
  ['Master', 'karyawan', 'Data induk karyawan (lapangan & kantor)', ['id:PK', 'nik:VARCHAR(20) UNIQUE — nomor induk karyawan', 'id_absensi:VARCHAR(10) UNIQUE — kode absensi karyawan (dicetak di kartu)', 'nama, jenis_kelamin, no_ktp, npwp', 'status_ptkp:ENUM(TK/0..K/3) — kategori TER PPh 21', 'kategori:ENUM(Kantor, Lapangan)', 'unit_kerja_id:FK', 'jabatan:VARCHAR', 'lokasi_kerja_id:FK', 'jadwal_kerja_id:FK', 'grup_roster:TINYINT — offset siklus 6-1', 'status_kerja:ENUM(PKWTT, PKWT, Harian Lepas)', 'tipe_gaji:ENUM(Bulanan, Harian)', 'tgl_masuk, tgl_keluar:DATE', 'status:ENUM(Aktif, Nonaktif)', 'telp, email, alamat', 'bank, no_rekening, atas_nama']],
  ['Master', 'karyawan_gaji', 'Komponen gaji per karyawan (riwayat berlaku)', ['id:PK', 'karyawan_id:FK', 'berlaku_mulai:DATE', 'gaji_pokok:DECIMAL', 'upah_harian:DECIMAL', 'tunj_jabatan:DECIMAL — tetap', 'tunj_makan_harian:DECIMAL — tidak tetap', 'tunj_transport_harian:DECIMAL — tidak tetap', 'ikut_bpjs_kes, ikut_bpjs_tk, ikut_jp:BOOLEAN']],
  ['Master', 'unit_kerja', 'Departemen / divisi', ['id:PK', 'kode:VARCHAR(5)', 'nama:VARCHAR']],
  ['Master', 'lokasi_kerja', 'Lokasi kerja & tunjangan area', ['id:PK', 'kode', 'nama', 'tunjangan_lokasi:DECIMAL — tetap/bulan', 'keterangan']],
  ['Master', 'jadwal_kerja', 'Skema kerja: Kantor 8 jam, Perusahaan 6-1, Freeport roster 6-1', ['id:PK', 'kode, nama, kategori', 'pola:ENUM(mingguan, siklus)', 'hari_kerja:SET(0..6) — untuk pola mingguan', 'siklus_kerja, siklus_libur:TINYINT, tgl_acuan:DATE — untuk pola siklus', 'jam_masuk, jam_pulang:TIME', 'istirahat_menit:SMALLINT', 'jam_reguler:DECIMAL — 7 atau 8 jam', 'minggu_kerja:TINYINT — 5/6 (menentukan pengali lembur hari libur)', 'hari_kerja_bulan:TINYINT — pembagi upah harian']],
  ['Master', 'hari_libur', 'Kalender libur nasional & cuti bersama', ['tanggal:DATE PK', 'nama:VARCHAR']],
  ['Absensi', 'perangkat_scanner', 'Scanner barcode / terminal absensi di tiap pos', ['id:PK (kode scanner)', 'nama, lokasi_kerja_id:FK', 'serial_number:VARCHAR UNIQUE', 'ip_address', 'status_online:BOOLEAN', 'terakhir_sinkron:DATETIME']],
  ['Absensi', 'kartu_absensi', 'Kartu ID karyawan berbarcode (riwayat penerbitan)', ['id:PK', 'karyawan_id:FK', 'no_kartu:VARCHAR UNIQUE — isi barcode (YBM + ID absensi + versi)', 'versi:TINYINT — naik saat kartu diganti', 'status:ENUM(Aktif, Hilang, Diblokir)', 'tgl_terbit, tgl_blokir:DATE', 'alasan_ganti']],
  ['Absensi', 'log_absensi', 'Log mentah dari scanner (push / import file / manual)', ['id:PK', 'no_kartu:VARCHAR — kode yang dipindai', 'karyawan_id:FK', 'waktu_scan:DATETIME', 'scanner_id:FK', 'metode:ENUM(Kartu, Manual)', 'sumber:ENUM(Push scanner, Import file, Manual)', 'diinput_oleh:FK users (jika manual)']],
  ['Absensi', 'absensi_harian', 'Hasil olah log per karyawan per hari (view/materialized)', ['karyawan_id + tanggal:PK', 'jenis_hari:ENUM(Kerja, Libur, Libur Nasional)', 'jam_masuk, jam_pulang:TIME', 'terlambat_menit, jam_kerja_menit', 'status:ENUM(Hadir, Terlambat, Tidak Lengkap, Alpa, Izin, Sakit, Cuti, Dinas, Libur)', 'lembur_aktual_jam:DECIMAL', 'lembur_disetujui_jam:DECIMAL']],
  ['Absensi', 'pengajuan_izin', 'Izin, sakit, cuti, dinas', ['id:PK', 'karyawan_id:FK', 'jenis:ENUM(Izin, Sakit, Cuti, Dinas)', 'dari, sampai:DATE', 'keterangan, lampiran', 'status:ENUM(Menunggu, Disetujui, Ditolak)', 'disetujui_oleh:FK users, waktu']],
  ['Absensi', 'persetujuan_lembur', 'Surat Perintah Lembur (SPL) / persetujuan', ['karyawan_id + tanggal:PK', 'jam_diajukan:DECIMAL', 'jam_disetujui:DECIMAL', 'status:ENUM(Menunggu, Disetujui, Ditolak)', 'catatan', 'disetujui_oleh:FK users, waktu']],
  ['Payroll', 'aturan_payroll', 'Parameter rumus (versi berlaku)', ['id:PK', 'berlaku_mulai:DATE', 'tgl_cutoff:TINYINT', 'toleransi_terlambat', 'lembur_pembagi (173), lembur_dasar, pembulatan, minimal, maks_harian', 'pengali_hari_kerja:JSON [{s/d jam, kali}]', 'pengali_libur_6hk, pengali_libur_5hk:JSON', 'tarif BPJS (Kes, JHT, JP, JKK, JKM) & batas upah', 'metode_pph:ENUM(gross, ditanggung)', 'upah_minimum_acuan']],
  ['Payroll', 'tarif_ter', 'Tabel Tarif Efektif Rata-rata PPh 21 (PP 58/2023)', ['kategori:ENUM(A,B,C)', 'batas_bawah, batas_atas:DECIMAL', 'tarif_persen:DECIMAL']],
  ['Payroll', 'penyesuaian_gaji', 'Insentif, bonus, kasbon, potongan lain per periode', ['id:PK', 'periode:CHAR(7)', 'karyawan_id:FK', 'jenis:ENUM(Pendapatan, Potongan)', 'nama, nilai']],
  ['Payroll', 'payroll_periode', 'Satu kali proses payroll (batch)', ['id:PK', 'periode:CHAR(7) UNIQUE', 'tgl_dari, tgl_sampai:DATE', 'status:ENUM(Draft, Diajukan, Disetujui, Dibayar)', 'dibuat_oleh, dihitung_pada', 'tgl_bayar', 'snapshot_aturan:JSON', 'total_pendapatan, total_potongan, total_thp, total_biaya_perusahaan']],
  ['Payroll', 'payroll_detail', 'Slip gaji per karyawan per periode (snapshot)', ['id:PK', 'payroll_periode_id:FK', 'karyawan_id:FK', 'snapshot data karyawan (nama, jabatan, unit, rekening, PTKP)', 'hari_jadwal, hadir, terlambat, alpa, izin, sakit, cuti', 'jam_lembur, jam_ekuivalen, upah_per_jam', 'bruto_pajak, kategori_ter, tarif_ter, pph21', 'total_pendapatan, total_potongan, take_home_pay', 'kode_verifikasi_slip']],
  ['Payroll', 'payroll_komponen', 'Rincian baris slip (pendapatan / potongan / beban perusahaan)', ['id:PK', 'payroll_detail_id:FK', 'kelompok:ENUM(Pendapatan, Potongan, Perusahaan)', 'kode:VARCHAR(5) — GP, TJ, TL, TM, TT, LB, BK, JHT, JP, PPH, ...', 'nama, keterangan', 'nilai:DECIMAL']],
  ['Payroll', 'payroll_lembur', 'Rincian perhitungan lembur per hari', ['id:PK', 'payroll_detail_id:FK', 'tanggal, jenis_hari', 'jam_aktual', 'rincian_pengali:JSON', 'jam_ekuivalen', 'nilai']],
  ['Payroll', 'payroll_riwayat', 'Jejak persetujuan (audit trail)', ['id:PK', 'payroll_periode_id:FK', 'status', 'oleh:FK users', 'peran', 'waktu', 'catatan']],
  ['Sistem', 'users', 'Akun pengguna aplikasi', ['id:PK', 'email:UNIQUE', 'nama', 'password_hash', 'peran:ENUM(admin, operator, keuangan, pimpinan, karyawan)', 'karyawan_id:FK (opsional)', 'aktif:BOOLEAN', 'login_terakhir']],
  ['Sistem', 'log_aktivitas', 'Audit log seluruh perubahan data', ['id:PK', 'waktu', 'user_id:FK', 'peran', 'aksi / pesan', 'data_lama, data_baru:JSON']],
];

// ------------------------------------------------------------ utilitas
const csvEsc = (v) => { const s = v == null ? '' : String(v); return /[";\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
function downloadCSV(name, rows) {
  const blob = new Blob(['﻿' + rows.map((r) => r.map(csvEsc).join(';')).join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

let _ctx = null, _ctxKey = '';

document.addEventListener('alpine:init', () => {
  Alpine.data('hris', () => ({
    db: null, rev: 0,
    session: { nama: '', email: '', role: '', empId: '' },
    route: 'dashboard', routes: ROUTES, menu: MENU, roles: H.ROLES, perms: PERMS, schema: SCHEMA, kodeMap: KODE, cardCls: CARD_STATUS,
    sidebar: false, isDesktop: window.matchMedia('(min-width: 1024px)').matches,
    collapsed: (() => { try { return localStorage.getItem('ybm-hris-sidebar') === 'hidden'; } catch (e) { return false; } })(),
    userMenu: false, now: new Date(), today: E.todayISO(), toasts: [], confirmBox: { show: false, text: '', action: null },
    flash: {},

    // filter
    period: '', empQ: '', empKat: '', empUnit: '', empStatus: 'Aktif',
    absKat: '', absUnit: '', absView: 'matriks', absDate: '', absQ: '',
    otStatus: 'Menunggu', otKat: '', otQ: '',
    lvStatus: '', fpQ: '',
    runId: '', runQ: '', newPeriod: '',
    slipRun: '', slipEmp: '', slipQ: '', slipDoc: 'slip',
    repRun: '', repTab: 'ringkasan',
    sayaTab: 'kehadiran', sayaPeriod: '',
    ruleTab: 'lembur', simForm: null, terCat: 'A',

    // modal
    empModal: false, empForm: null, empTab: 'pribadi', detail: null, detailTab: 'profil',
    dayModal: null, manualTime: '', leaveModal: false, leaveForm: null,
    jadwalModal: false, jadwalForm: null, liburForm: { tanggal: '', nama: '' },
    userModal: false, userForm: null, importModal: false, importText: '', importDev: 'SC01',
    adjModal: false, adjForm: null, noteModal: null, rulesDraft: null, lineDetail: null,

    // ---------------------------------------------------------- init
    init() {
      let s = null;
      try { s = JSON.parse(localStorage.getItem(H.SESSION_KEY) || 'null'); } catch (e) { s = null; }
      if (!s || !H.ROLES[s.role]) { location.replace('login.html'); return; }
      this.session = s;
      this.db = H.loadDB();
      this.period = E.periodOf(this.today, this.db.rules.cutoff);
      this.sayaPeriod = this.period;
      this.absDate = this.today;
      this.newPeriod = this.period;
      this.rulesDraft = H.clone(this.db.rules);
      this.simForm = { pokok: 6500000, tetap: 500000, jamKerja: 3, jamLibur: 0, mingguKerja: 6, ptkp: 'K/1', makan: 40000, hari: 25 };
      this.pullInbox(true);
      const go = () => {
        let r = location.hash.replace('#', '').split('/')[0] || this.home();
        if (!ROUTES[r] || !this.allowed(r)) r = this.home();
        this.route = r;
        this.sidebar = false; this.userMenu = false; this.detail = null; this.dayModal = null; this.lineDetail = null;
        document.title = `${ROUTES[r][0]} — HRIS & Payroll YBM`;
        if (r === 'rumus') this.rulesDraft = H.clone(this.db.rules);
        window.scrollTo(0, 0);
      };
      window.addEventListener('hashchange', go);
      go();
      const mq = window.matchMedia('(min-width: 1024px)');
      mq.addEventListener('change', (e) => { this.isDesktop = e.matches; if (e.matches) this.sidebar = false; });
      // sinkronisasi dengan scanner kartu (tab / iframe lain) & tab aplikasi lain
      window.addEventListener('storage', (ev) => {
        if (ev.key === H.INBOX_KEY) this.pullInbox();
        else if (ev.key === H.DB_KEY && ev.newValue) { this.db = H.loadDB(); this.rev++; }
      });
      setInterval(() => { this.now = new Date(); const t = E.todayISO(); if (t !== this.today) { this.today = t; this.rev++; } }, 1000);
      setInterval(() => this.pullInbox(), 2500);
    },
    home() { return this.session.role === 'karyawan' ? 'saya' : 'dashboard'; },
    allowed(r) { return ROUTES[r] && ROUTES[r][2].includes(this.session.role); },
    can(p) { return !!PERMS[p] && PERMS[p][1].includes(this.session.role); },
    get roleInfo() { return H.ROLES[this.session.role] || {}; },

    pullInbox(silent = false) {
      const got = H.consumeInbox(Alpine.raw(this.db));
      if (!got.length) return;
      this.save();
      got.forEach((s) => { this.flash[s.id] = true; setTimeout(() => { delete this.flash[s.id]; }, 6000); });
      if (!silent) got.slice(-3).forEach((s) => this.toast(`Scan kartu ${s.dev}: ${this.empById(s.empId).nama} — ${s.t.slice(11, 16)}`, 'scan'));
      this.log(`${got.length} log absensi diterima dari scanner ${got[0].dev} (push)`, 'Scanner Kartu');
    },

    save(msg = '') {
      try { H.saveDB(Alpine.raw(this.db)); } catch (e) { this.toast('Penyimpanan browser penuh.', 'error'); }
      this.rev++;
      if (msg) { this.log(msg); this.toast(msg); }
    },
    log(msg, user) {
      this.db.activity.unshift({ t: new Date().toISOString(), user: user || this.session.nama, role: user ? 'sistem' : this.session.role, msg });
      this.db.activity = this.db.activity.slice(0, 200);
      try { H.saveDB(Alpine.raw(this.db)); } catch (e) { /* abaikan */ }
    },
    toast(text, type = 'success') {
      const id = H.uid('t'); this.toasts.push({ id, text, type });
      setTimeout(() => { this.toasts = this.toasts.filter((t) => t.id !== id); }, type === 'error' ? 4500 : 3500);
    },
    ask(text, action) { this.confirmBox = { show: true, text, action }; },
    confirmYes() { const a = this.confirmBox.action; this.confirmBox.show = false; if (a) a(); },
    logout() { localStorage.removeItem(H.SESSION_KEY); location.href = 'login.html'; },
    get sidebarVisible() { return this.sidebar || (this.isDesktop && !this.collapsed); },
    toggleSidebar() {
      if (!this.isDesktop) { this.sidebar = !this.sidebar; return; }
      this.collapsed = !this.collapsed;
      try { localStorage.setItem('ybm-hris-sidebar', this.collapsed ? 'hidden' : 'shown'); } catch (e) { /* abaikan */ }
    },
    resetData() {
      this.ask('Reset seluruh database simulasi ke data awal? Semua perubahan akan hilang.', () => {
        localStorage.removeItem(H.DB_KEY); localStorage.removeItem(H.INBOX_KEY);
        this.db = H.loadDB(); this.rev++; this.toast('Database simulasi dikembalikan ke data awal.');
      });
    },

    // ---------------------------------------------------------- konteks perhitungan (memo)
    ctx() {
      const key = this.rev + '|' + this.today;
      if (_ctxKey !== key) { _ctx = E.buildContext(Alpine.raw(this.db)); _ctxKey = key; }
      return _ctx;
    },
    range(p) { return E.periodRange(p, this.db.rules.cutoff); },
    get curPeriod() { return E.periodOf(this.today, this.db.rules.cutoff); },
    get periodOptions() { const out = []; for (let i = 1; i >= -5; i--) out.push(E.shiftPeriod(this.curPeriod, i)); return out; },
    pLabel(p) { return E.periodLabel(p); },
    pRange(p) { const r = this.range(p); return this.fmtDate(r.from) + ' – ' + this.fmtDate(r.to); },
    runOf(p) { return this.db.runs.find((r) => r.period === p); },
    locked(p) { const r = this.runOf(p); return r && r.status !== 'Draft'; },

    // ---------------------------------------------------------- format
    fmt, num,
    get pageTitle() { return ROUTES[this.route][0]; },
    get clock() { return this.now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(/\./g, ':'); },
    get dateLong() { return this.now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }); },
    fmtDate(s) { return s ? parseISO(s.slice(0, 10)).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'; },
    fmtDay(s) { return parseISO(s).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' }); },
    fmtTime(t) { return t ? new Date(t).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'; },
    dow(s) { return ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'][parseISO(s).getDay()]; },
    initials(n) { return (n || '?').split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase(); },
    jt(n) { return (Number(n) / 1e6).toLocaleString('id-ID', { maximumFractionDigits: 1 }) + ' jt'; },
    stCls(s) { return STATUS_CLS[s] || 'bg-slate-100 text-slate-600 ring-slate-500/20'; },
    runSt(s) { return RUN_STATUS[s] || RUN_STATUS.Draft; },
    kode(k) { return KODE[k] || KODE['']; },
    roleName(r) { return (H.ROLES[r] || {}).nama || r; },

    // ---------------------------------------------------------- lookup
    empById(id) { return this.db.employees.find((e) => e.id === id) || { nama: '(tidak dikenal)', id: '', nik: '—', jabatan: '', gaji: {} }; },
    unitById(id) { return this.db.units.find((u) => u.id === id) || { nama: '—', kode: '—' }; },
    lokById(id) { return this.db.lokasi.find((l) => l.id === id) || { nama: '—', kode: '—', tunjangan: 0 }; },
    jadwalById(id) { return this.db.jadwal.find((j) => j.id === id) || { nama: '—', kode: '—' }; },
    devById(id) { return this.db.devices.find((d) => d.id === id) || { nama: id || 'Manual', id }; },
    get activeEmps() { return this.db.employees.filter((e) => e.status === 'Aktif'); },
    get me() { return this.session.empId ? this.empById(this.session.empId) : null; },
    upahJam(e) {
      const L = this.db.rules.lembur;
      const j = this.jadwalById(e.jadwalId);
      const bulan = e.tipeGaji === 'Harian' ? (e.gaji.upahHarian || 0) * (j.hariKerjaBulan || 25) : e.gaji.pokok || 0;
      const tetap = (e.gaji.tunjJabatan || 0) + (this.lokById(e.lokasiId).tunjangan || 0);
      return (L.dasar === 'pokok' ? bulan : bulan + tetap) / L.pembagi;
    },

    // ---------------------------------------------------------- dashboard
    get todayStats() {
      this.rev; const c = this.ctx();
      const s = { jadwal: 0, hadir: 0, terlambat: 0, belum: 0, izin: 0, libur: 0, lapangan: 0, kantor: 0, total: 0 };
      this.activeEmps.forEach((e) => {
        s.total++; s[e.kategori === 'Lapangan' ? 'lapangan' : 'kantor']++;
        const r = E.dayRecord(e, this.today, c);
        if (!r) return;
        if (r.sched) s.jadwal++;
        if (['Hadir', 'Sedang Bekerja', 'Tidak Lengkap', 'Masuk Hari Libur'].includes(r.status)) s.hadir++;
        if (r.status === 'Terlambat') { s.hadir++; s.terlambat++; }
        if (r.status === 'Belum Absen') s.belum++;
        if (['Izin', 'Sakit', 'Cuti', 'Dinas'].includes(r.status)) s.izin++;
        if (!r.sched) s.libur++;
      });
      return s;
    },
    get liveScans() { this.rev; return [...this.db.scans].sort((a, b) => b.t.localeCompare(a.t)).slice(0, 10); },
    get chart14() {
      this.rev; const c = this.ctx(); const out = [];
      for (let i = 13; i >= 0; i--) {
        const ds = iso(addDays(parseISO(this.today), -i));
        const x = { ds, hadir: 0, absen: 0, alpa: 0, jadwal: 0 };
        this.activeEmps.forEach((e) => {
          const r = E.dayRecord(e, ds, c); if (!r) return;
          if (r.sched) x.jadwal++;
          if (['Hadir', 'Terlambat', 'Tidak Lengkap', 'Sedang Bekerja', 'Masuk Hari Libur', 'Dinas'].includes(r.status)) x.hadir++;
          else if (['Izin', 'Sakit', 'Cuti'].includes(r.status)) x.absen++;
          else if (r.status === 'Alpa') x.alpa++;
        });
        out.push(x);
      }
      const max = Math.max(...out.map((x) => x.hadir + x.absen + x.alpa), 1);
      return { rows: out, max: Math.ceil(max / 5) * 5 };
    },
    get runsSorted() { this.rev; return [...this.db.runs].sort((a, b) => b.period.localeCompare(a.period)); },
    get costTrend() {
      const rs = [...this.db.runs].sort((a, b) => a.period.localeCompare(b.period)).slice(-6);
      const max = Math.max(...rs.map((r) => r.totals.biaya), 1);
      return rs.map((r) => ({ r, pct: (r.totals.biaya / max) * 100, thpPct: (r.totals.thp / max) * 100 }));
    },
    get tasks() {
      this.rev; const t = []; const role = this.session.role;
      const ot = this.otRowsFor(this.curPeriod).concat(this.otRowsFor(E.shiftPeriod(this.curPeriod, -1))).filter((r) => r.otStatus === 'Menunggu').length;
      const lv = this.db.leaves.filter((l) => l.status === 'Menunggu').length;
      const tl = this.absRowsAll(this.curPeriod).reduce((a, r) => a + r.sum.tidakLengkap, 0);
      if (['admin', 'operator'].includes(role)) {
        if (ot) t.push({ icon: 'fa-business-time', text: `${ot} lembur menunggu persetujuan`, href: '#lembur', go: () => { this.otStatus = 'Menunggu'; } });
        if (lv) t.push({ icon: 'fa-envelope-open-text', text: `${lv} pengajuan izin/sakit/cuti menunggu`, href: '#pengajuan', go: () => { this.lvStatus = 'Menunggu'; } });
        if (tl) t.push({ icon: 'fa-barcode', text: `${tl} absensi tidak lengkap periode ini perlu dikoreksi`, href: '#absensi' });
        const off = this.db.devices.filter((d) => !d.online).length;
        if (off) t.push({ icon: 'fa-plug-circle-xmark', text: `${off} scanner kartu offline`, href: '#scanner' });
        const nc = this.activeEmps.filter((e) => e.kartu.status !== 'Aktif').length;
        if (nc) t.push({ icon: 'fa-id-card', text: `${nc} karyawan belum memiliki kartu ID aktif`, href: '#scanner' });
      }
      this.db.runs.forEach((r) => {
        if (r.status === 'Diajukan' && ['admin', 'pimpinan'].includes(role)) t.push({ icon: 'fa-stamp', text: `Payroll ${this.pLabel(r.period)} menunggu persetujuan Anda`, href: '#payroll', go: () => { this.runId = r.id; } });
        if (r.status === 'Disetujui' && ['admin', 'keuangan'].includes(role)) t.push({ icon: 'fa-money-bill-transfer', text: `Payroll ${this.pLabel(r.period)} disetujui — siap dibayar`, href: '#payroll', go: () => { this.runId = r.id; } });
        if (r.status === 'Draft' && ['admin', 'keuangan'].includes(role)) t.push({ icon: 'fa-pen-ruler', text: `Payroll ${this.pLabel(r.period)} masih draft`, href: '#payroll', go: () => { this.runId = r.id; } });
      });
      const prev = E.shiftPeriod(this.curPeriod, -1);
      if (!this.runOf(prev) && ['admin', 'keuangan'].includes(role)) t.push({ icon: 'fa-calculator', text: `Payroll ${this.pLabel(prev)} belum diproses`, href: '#payroll', go: () => { this.newPeriod = prev; } });
      return t;
    },

    // ---------------------------------------------------------- karyawan
    get filteredEmps() {
      this.rev; const q = this.empQ.toLowerCase();
      return this.db.employees.filter((e) => (!this.empKat || e.kategori === this.empKat) && (!this.empUnit || e.unitId === this.empUnit) && (!this.empStatus || e.status === this.empStatus)
        && (!q || [e.nama, e.nik, e.jabatan, e.pin, e.kartu.no].join(' ').toLowerCase().includes(q)));
    },
    blankEmp() {
      const n = Math.max(...this.db.employees.map((e) => Number(e.pin) || 1000)) + 1;
      return {
        id: '', nik: 'YBM-' + n, pin: String(n), nama: '', jk: 'L', ktp: '', npwp: '', ptkp: 'TK/0', kategori: 'Lapangan', unitId: this.db.units[0].id, jabatan: '', lokasiId: 'l2', jadwalId: 'j2', rosterOffset: 0,
        statusKerja: 'PKWT', tipeGaji: 'Bulanan', tglMasuk: this.today, status: 'Aktif', telp: '', email: '', bank: 'Bank Papua', rekening: '', atasNama: '',
        gaji: { pokok: this.db.rules.umk, upahHarian: 0, tunjJabatan: 0, makan: 40000, transport: 25000 }, bpjs: { kes: true, tk: true, jp: true }, kartu: { no: '', versi: 0, status: 'Belum Diterbitkan', terbit: '' },
      };
    },
    openEmp(e = null) { this.empForm = e ? H.clone(e) : this.blankEmp(); this.empTab = 'pribadi'; this.empModal = true; },
    saveEmp() {
      const f = this.empForm;
      if (!f.nama.trim() || !f.nik.trim() || !f.pin.trim()) { this.empTab = 'pribadi'; this.toast('Nama, NIK dan ID absensi wajib diisi.', 'error'); return; }
      if (this.db.employees.some((e) => e.id !== f.id && (e.nik === f.nik || e.pin === f.pin))) { this.toast('NIK atau ID absensi sudah dipakai karyawan lain.', 'error'); return; }
      ['pokok', 'upahHarian', 'tunjJabatan', 'makan', 'transport'].forEach((k) => { f.gaji[k] = Number(f.gaji[k]) || 0; });
      f.rosterOffset = Number(f.rosterOffset) || 0;
      if (!f.atasNama) f.atasNama = f.nama;
      if (f.id) { const i = this.db.employees.findIndex((e) => e.id === f.id); this.db.employees[i] = f; if (this.detail && this.detail.id === f.id) this.detail = f; this.save(`Data karyawan ${f.nama} diperbarui`); }
      else {
        f.id = H.uid('e');
        f.kartu = { no: H.cardNo(f.pin, 1), versi: 1, status: 'Aktif', terbit: this.today };
        this.db.employees.push(f);
        this.save(`Karyawan baru ${f.nama} ditambahkan — kartu ${f.kartu.no} diterbitkan`);
      }
      this.empModal = false;
    },
    toggleEmpStatus(e) {
      e.status = e.status === 'Aktif' ? 'Nonaktif' : 'Aktif';
      this.save(`Status ${e.nama} diubah menjadi ${e.status}`);
    },
    openDetail(e, tab = 'profil') { this.detail = e; this.detailTab = tab; },
    empSummary(e, p = this.period) { this.rev; const r = this.range(p); return E.attendanceSummary(e, r.from, r.to > this.today ? this.today : r.to, this.ctx()); },
    empSlips(e) { return this.runsSorted.filter((r) => r.lines.some((l) => l.empId === e.id)).map((r) => ({ run: r, line: r.lines.find((l) => l.empId === e.id) })); },

    // ---------------------------------------------------------- jadwal
    rosterPreview(j) {
      const days = []; for (let i = 0; i < 14; i++) days.push(iso(addDays(parseISO(this.today), i)));
      const groups = j.pola === 'siklus' ? [...Array(j.siklusKerja + j.siklusLibur).keys()] : [0];
      return { days, rows: groups.map((g) => ({ g, emps: this.db.employees.filter((e) => e.jadwalId === j.id && (j.pola !== 'siklus' || (Number(e.rosterOffset) || 0) === g) && e.status === 'Aktif').length, cells: days.map((ds) => ({ ds, work: !this.ctx().hol[ds] && E.isScheduled({ rosterOffset: g }, j, ds), hol: this.ctx().hol[ds] })) })) };
    },
    openJadwal(j = null) {
      this.jadwalForm = j ? H.clone(j) : { id: '', kode: '', nama: '', kategori: 'Lapangan', pola: 'mingguan', hari: [1, 2, 3, 4, 5, 6], siklusKerja: 6, siklusLibur: 1, anchor: this.today, masuk: '07:00', pulang: '15:00', istirahat: 60, jamReguler: 7, mingguKerja: 6, hariKerjaBulan: 25, keterangan: '' };
      this.jadwalModal = true;
    },
    jadwalJam(f) { return Math.max(0, (E.toMin(f.pulang) - E.toMin(f.masuk) - Number(f.istirahat || 0)) / 60); },
    toggleHari(f, i) { f.hari = f.hari.includes(i) ? f.hari.filter((x) => x !== i) : [...f.hari, i].sort(); },
    saveJadwal() {
      const f = this.jadwalForm;
      if (!f.kode.trim() || !f.nama.trim()) { this.toast('Kode dan nama jadwal wajib diisi.', 'error'); return; }
      ['istirahat', 'jamReguler', 'mingguKerja', 'hariKerjaBulan', 'siklusKerja', 'siklusLibur'].forEach((k) => { f[k] = Number(f[k]) || 0; });
      f.jamReguler = this.jadwalJam(f);
      if (f.id) { const i = this.db.jadwal.findIndex((x) => x.id === f.id); this.db.jadwal[i] = f; this.save(`Jadwal ${f.kode} diperbarui`); }
      else { f.id = H.uid('j'); this.db.jadwal.push(f); this.save(`Jadwal baru ${f.kode} ditambahkan`); }
      this.jadwalModal = false;
    },
    addLibur() {
      const f = this.liburForm;
      if (!f.tanggal || !f.nama.trim()) { this.toast('Tanggal dan nama hari libur wajib diisi.', 'error'); return; }
      if (this.db.libur.some((l) => l.tanggal === f.tanggal)) { this.toast('Tanggal sudah terdaftar.', 'error'); return; }
      this.db.libur.push({ tanggal: f.tanggal, nama: f.nama.trim() }); this.db.libur.sort((a, b) => a.tanggal.localeCompare(b.tanggal));
      this.save(`Hari libur ${f.nama.trim()} (${this.fmtDate(f.tanggal)}) ditambahkan`); this.liburForm = { tanggal: '', nama: '' };
    },
    removeLibur(l) { this.ask(`Hapus hari libur "${l.nama}"?`, () => { this.db.libur = this.db.libur.filter((x) => x !== l); this.save(`Hari libur ${l.nama} dihapus`); }); },

    // ---------------------------------------------------------- absensi
    get periodDays() { const r = this.range(this.period); return E.rangeDays(r.from, r.to); },
    absRowsAll(p) {
      const c = this.ctx(); const r = this.range(p); const to = r.to > this.today ? this.today : r.to;
      return this.db.employees.filter((e) => e.status === 'Aktif').map((e) => {
        const days = {}; E.rangeDays(r.from, r.to).forEach((ds) => { days[ds] = E.dayRecord(e, ds, c); });
        return { emp: e, days, sum: E.attendanceSummary(e, r.from, to, c) };
      });
    },
    get absRows() {
      this.rev; const q = this.absQ.toLowerCase();
      return this.absRowsAll(this.period).filter((x) => (!this.absKat || x.emp.kategori === this.absKat) && (!this.absUnit || x.emp.unitId === this.absUnit) && (!q || (x.emp.nama + ' ' + x.emp.nik).toLowerCase().includes(q)));
    },
    get dailyRows() {
      this.rev; const c = this.ctx(); const q = this.absQ.toLowerCase();
      return this.activeEmps.filter((e) => (!this.absKat || e.kategori === this.absKat) && (!this.absUnit || e.unitId === this.absUnit) && (!q || (e.nama + ' ' + e.nik).toLowerCase().includes(q)))
        .map((e) => ({ emp: e, r: E.dayRecord(e, this.absDate, c) })).filter((x) => x.r);
    },
    openDay(e, ds) { this.manualTime = ''; this.dayModal = { emp: e, ds }; },
    get dayInfo() {
      this.rev; if (!this.dayModal) return null;
      const { emp, ds } = this.dayModal;
      return { r: E.dayRecord(emp, ds, this.ctx()), scans: this.db.scans.filter((s) => s.empId === emp.id && s.t.startsWith(ds)).sort((a, b) => a.t.localeCompare(b.t)), j: this.jadwalById(emp.jadwalId), ot: this.db.otApprovals[emp.id + '|' + ds], leave: this.db.leaves.find((l) => l.empId === emp.id && ds >= l.dari && ds <= l.sampai) };
    },
    addManualScan() {
      const { emp, ds } = this.dayModal;
      if (!/^\d{2}:\d{2}$/.test(this.manualTime)) { this.toast('Isi jam scan (JJ:MM).', 'error'); return; }
      const jam = this.manualTime;
      this.db.scans.push({ id: H.uid('s'), pin: emp.pin, kode: '', empId: emp.id, t: `${ds} ${jam}:00`, dev: 'MANUAL', verify: 'Manual', src: 'Manual', oleh: this.session.nama });
      this.manualTime = '';
      this.save(`Koreksi absensi manual ${emp.nama} ${this.fmtDate(ds)} pukul ${jam}`);
    },
    removeScan(s) { this.ask('Hapus log scan ini?', () => { this.db.scans = this.db.scans.filter((x) => x.id !== s.id); this.save(`Log scan ${this.empById(s.empId).nama} ${s.t} dihapus`); }); },
    setDayLeave(jenis) {
      const { emp, ds } = this.dayModal;
      this.db.leaves.push({ id: H.uid('lv'), empId: emp.id, jenis, dari: ds, sampai: ds, ket: 'Diinput oleh operator', status: 'Disetujui', oleh: this.session.nama, diajukan: this.today });
      this.save(`${jenis} untuk ${emp.nama} tanggal ${this.fmtDate(ds)} dicatat`);
    },
    exportAbsensi() {
      const days = this.periodDays;
      const rows = [['NIK', 'Nama', 'Kategori', 'Unit', ...days.map((d) => d.slice(5)), 'Hari Jadwal', 'Hadir', 'Terlambat', 'Alpa', 'Izin', 'Sakit', 'Cuti', 'Tidak Lengkap', 'Lembur (jam aktual)']];
      this.absRows.forEach((x) => rows.push([x.emp.nik, x.emp.nama, x.emp.kategori, this.unitById(x.emp.unitId).kode, ...days.map((d) => (x.days[d] ? x.days[d].kode + (x.days[d].ot ? '+' + x.days[d].ot : '') : '')), x.sum.jadwal, x.sum.hadir, x.sum.terlambat, x.sum.alpa, x.sum.izin, x.sum.sakit, x.sum.cuti, x.sum.tidakLengkap, x.sum.lembur.reduce((a, r) => a + r.ot, 0)]));
      downloadCSV(`rekap-absensi-${this.period}.csv`, rows);
    },

    // ---------------------------------------------------------- lembur
    otRowsFor(p) {
      const c = this.ctx(); const r = this.range(p); const out = [];
      this.activeEmps.forEach((e) => E.rangeDays(r.from, r.to > this.today ? this.today : r.to).forEach((ds) => {
        const d = E.dayRecord(e, ds, c);
        if (d && d.ot) out.push({ ...d, emp: e, key: e.id + '|' + ds, ap: this.db.otApprovals[e.id + '|' + ds] });
      }));
      return out;
    },
    get otRows() {
      this.rev; const q = this.otQ.toLowerCase();
      return this.otRowsFor(this.period).filter((r) => (!this.otStatus || r.otStatus === this.otStatus) && (!this.otKat || r.emp.kategori === this.otKat) && (!q || r.emp.nama.toLowerCase().includes(q)))
        .sort((a, b) => b.ds.localeCompare(a.ds) || a.emp.nama.localeCompare(b.emp.nama));
    },
    otCalc(r, jam) {
      const j = this.jadwalById(r.emp.jadwalId);
      const t = E.overtimeTiers(jam, r.otJenis, j.mingguKerja, this.db.rules);
      return { ...t, nilai: Math.round(t.ekuivalen * this.upahJam(r.emp)), text: t.rincian.map((x) => `${num(x.jam)}j×${num(x.kali)}`).join(' + ') };
    },
    get otSummary() {
      const all = this.otRowsFor(this.period);
      const sum = (f) => all.filter(f).reduce((a, r) => a + r.ot, 0);
      return { total: sum(() => true), menunggu: sum((r) => r.otStatus === 'Menunggu'), disetujui: all.filter((r) => r.otStatus === 'Disetujui').reduce((a, r) => a + r.otJam, 0), ditolak: sum((r) => r.otStatus === 'Ditolak'), n: all.filter((r) => r.otStatus === 'Menunggu').length,
        nilai: all.filter((r) => r.otStatus === 'Disetujui').reduce((a, r) => a + this.otCalc(r, r.otJam).nilai, 0) };
    },
    setOT(r, status, jam = null) {
      if (this.locked(E.periodOf(r.ds, this.db.rules.cutoff))) { this.toast('Payroll periode ini sudah diajukan/terkunci.', 'error'); return; }
      const j = status === 'Disetujui' ? Math.min(Number(jam ?? r.ot) || 0, r.ot) : 0;
      this.db.otApprovals[r.key] = { status, jam: j, oleh: this.session.nama, at: new Date().toISOString() };
      this.save(`Lembur ${r.emp.nama} ${this.fmtDate(r.ds)} ${status.toLowerCase()}${status === 'Disetujui' ? ` (${num(j)} jam)` : ''}`);
    },
    approveAllOT() {
      const rows = this.otRows.filter((r) => r.otStatus === 'Menunggu');
      if (!rows.length) return;
      this.ask(`Setujui ${rows.length} lembur yang menunggu sesuai jam aktual (maks. ${this.db.rules.lembur.maksHarian} jam untuk hari kerja)?`, () => {
        rows.forEach((r) => { this.db.otApprovals[r.key] = { status: 'Disetujui', jam: r.otJenis === 'Hari Kerja' ? Math.min(r.ot, this.db.rules.lembur.maksHarian) : r.ot, oleh: this.session.nama, at: new Date().toISOString() }; });
        this.save(`${rows.length} lembur disetujui sekaligus`);
      });
    },

    // ---------------------------------------------------------- izin / cuti
    get leaveRows() { this.rev; return [...this.db.leaves].filter((l) => !this.lvStatus || l.status === this.lvStatus).sort((a, b) => b.dari.localeCompare(a.dari)); },
    leaveDays(l) { return E.daysBetween(l.dari, l.sampai) + 1; },
    openLeave(empId = '') { this.leaveForm = { empId: empId || (this.activeEmps[0] || {}).id, jenis: 'Izin', dari: this.today, sampai: this.today, ket: '' }; this.leaveModal = true; },
    saveLeave() {
      const f = this.leaveForm;
      if (!f.empId || !f.dari || !f.sampai || f.sampai < f.dari) { this.toast('Periksa karyawan dan tanggal.', 'error'); return; }
      const self = this.session.role === 'karyawan' || !this.can('leave.approve');
      this.db.leaves.push({ id: H.uid('lv'), ...f, status: self ? 'Menunggu' : 'Disetujui', oleh: self ? '' : this.session.nama, diajukan: this.today });
      this.save(self ? `Pengajuan ${f.jenis.toLowerCase()} dikirim, menunggu persetujuan` : `${f.jenis} ${this.empById(f.empId).nama} dicatat`);
      this.leaveModal = false;
    },
    setLeave(l, status) { l.status = status; l.oleh = this.session.nama; this.save(`Pengajuan ${l.jenis.toLowerCase()} ${this.empById(l.empId).nama} ${status.toLowerCase()}`); },

    // ---------------------------------------------------------- kartu & scanner barcode
    devToday(id) { this.rev; return this.db.scans.filter((s) => s.dev === id && s.t.startsWith(this.today)).length; },
    toggleDevice(d) { d.online = !d.online; if (d.online) d.lastSync = new Date().toISOString(); this.save(`Scanner ${d.id} ${d.online ? 'online' : 'offline'}`); },
    get cardRows() { this.rev; const q = this.fpQ.toLowerCase(); return this.activeEmps.filter((e) => !q || (e.nama + e.pin + e.kartu.no).toLowerCase().includes(q)); },
    cardUrl(e) { return 'cetak.html?doc=kartu' + (e ? '&emp=' + e.id : ''); },
    // terbitkan kartu baru / kartu pengganti: versi naik, kartu lama otomatis tidak berlaku
    issueCard(e) {
      const ganti = e.kartu.versi > 0;
      const go = () => {
        const v = (e.kartu.versi || 0) + 1;
        const lama = e.kartu.no;
        e.kartu = { no: H.cardNo(e.pin, v), versi: v, status: 'Aktif', terbit: this.today };
        this.save(ganti ? `Kartu pengganti ${e.kartu.no} untuk ${e.nama} diterbitkan, kartu ${lama} tidak berlaku` : `Kartu ${e.kartu.no} untuk ${e.nama} diterbitkan`);
      };
      if (ganti) this.ask(`Terbitkan kartu pengganti untuk ${e.nama}? Kartu lama (${e.kartu.no}) tidak dapat dipakai lagi.`, go); else go();
    },
    blockCard(e, status = 'Hilang') { e.kartu.status = status; this.save(`Kartu ${e.kartu.no} milik ${e.nama} ditandai ${status.toLowerCase()} — tidak dapat dipakai absen`); },
    activateCard(e) { e.kartu.status = 'Aktif'; this.save(`Kartu ${e.kartu.no} milik ${e.nama} diaktifkan kembali`); },
    get importPreview() {
      const db = Alpine.raw(this.db);
      return H.parseAttlog(this.importText).map((x) => {
        if (!x.ok) return x;
        const o = H.cardOwner(db, x.pin);
        return { ...x, emp: o.alasan ? null : o.emp, alasan: o.alasan, dup: !!o.emp && this.db.scans.some((s) => s.empId === o.emp.id && s.t === x.t) };
      });
    },
    sampleAttlog() {
      const ds = this.today; const lines = [];
      this.activeEmps.filter((e) => e.lokasiId === 'l4').forEach((e, i) => { lines.push(`${e.kartu.no};${ds} 05:${String(40 + i * 3).padStart(2, '0')}:12`); });
      lines.push(`YBM999901;${ds} 05:58:40`);
      this.importText = lines.join('\n'); this.importDev = 'SC04';
    },
    async importFile(ev) { const f = ev.target.files[0]; ev.target.value = ''; if (f) this.importText = await f.text(); },
    doImport() {
      const ok = this.importPreview.filter((x) => x.ok && x.emp && !x.dup);
      if (!ok.length) { this.toast('Tidak ada baris valid yang baru.', 'error'); return; }
      ok.forEach((x) => this.db.scans.push({ id: H.uid('s'), pin: x.emp.pin, kode: /^YBM/.test(x.pin) ? x.pin : '', empId: x.emp.id, t: x.t, dev: this.importDev, verify: 'Kartu', src: 'Import file', oleh: this.session.nama }));
      const d = this.devById(this.importDev); d.lastSync = new Date().toISOString();
      this.save(`${ok.length} log absensi diimpor dari file scanner ${this.importDev}`);
      this.importModal = false; this.importText = '';
    },

    // ---------------------------------------------------------- payroll
    get run() { this.rev; return this.db.runs.find((r) => r.id === this.runId) || null; },
    get runLines() {
      if (!this.run) return [];
      const q = this.runQ.toLowerCase();
      return this.run.lines.filter((l) => !q || (l.nama + l.nik + l.unit).toLowerCase().includes(q));
    },
    get availablePeriods() { return this.periodOptions.filter((p) => !this.runOf(p) && p <= this.curPeriod); },
    createRun() {
      const p = this.newPeriod;
      if (this.runOf(p)) { this.toast('Payroll periode tersebut sudah ada.', 'error'); return; }
      const r = this.range(p);
      const go = () => {
        const run = H.buildRun(Alpine.raw(this.db), p, this.session.nama);
        run.history.push({ status: 'Draft', oleh: this.session.nama, role: this.session.role, at: new Date().toISOString(), catatan: 'Payroll dihitung dari data absensi' });
        this.db.runs.push(run); this.runId = run.id;
        this.save(`Payroll ${this.pLabel(p)} dihitung untuk ${run.lines.length} karyawan`);
      };
      if (r.to >= this.today) this.ask(`Periode ${this.pLabel(p)} belum selesai (s/d ${this.fmtDate(r.to)}). Hitung sebagai draft sementara?`, go); else go();
    },
    recalc(run) {
      const fresh = H.buildRun(Alpine.raw(this.db), run.period, this.session.nama);
      Object.assign(run, { lines: fresh.lines, totals: fresh.totals, calculatedAt: fresh.calculatedAt, rulesSnapshot: fresh.rulesSnapshot });
      this.save(`Payroll ${this.pLabel(run.period)} dihitung ulang`);
    },
    setRunStatus(run, status, catatan = '') {
      const entry = { status, oleh: this.session.nama, role: this.session.role, at: new Date().toISOString(), catatan };
      run.history.push(entry);
      run.status = status === 'Ditolak' ? 'Draft' : status;
      if (status === 'Ditolak') run.rejectNote = catatan; else if (status !== 'Draft') run.rejectNote = '';
      if (status === 'Dibayar') run.paidAt = this.today;
      this.save(`Payroll ${this.pLabel(run.period)}: ${status.toLowerCase()}${catatan ? ' — ' + catatan : ''}`);
    },
    askNote(run, status) { this.noteModal = { run, status, text: status === 'Disetujui' ? 'Disetujui untuk dibayarkan.' : status === 'Dibayar' ? 'Transfer bank batch #' + run.period.replace('-', '') : '' }; },
    submitNote() {
      const n = this.noteModal;
      if (n.status === 'Ditolak' && !n.text.trim()) { this.toast('Alasan penolakan wajib diisi.', 'error'); return; }
      this.setRunStatus(n.run, n.status, n.text.trim()); this.noteModal = null;
    },
    deleteRun(run) { this.ask(`Hapus draft payroll ${this.pLabel(run.period)}?`, () => { this.db.runs = this.db.runs.filter((r) => r.id !== run.id); this.runId = ''; this.save(`Draft payroll ${this.pLabel(run.period)} dihapus`); }); },
    runAdjustments(run) { this.rev; return this.db.adjustments.filter((a) => a.period === run.period); },
    openAdj(run) { this.adjForm = { period: run.period, empId: run.lines[0]?.empId || '', jenis: 'Pendapatan', nama: '', nilai: '' }; this.adjModal = true; },
    saveAdj() {
      const f = this.adjForm;
      if (!f.empId || !f.nama.trim() || !(Number(f.nilai) > 0)) { this.toast('Lengkapi karyawan, nama komponen dan nilai.', 'error'); return; }
      this.db.adjustments.push({ id: H.uid('adj'), ...f, nilai: Number(f.nilai) });
      this.adjModal = false;
      const run = this.runOf(f.period); if (run && run.status === 'Draft') this.recalc(run);
      this.save(`Penyesuaian "${f.nama}" ${this.empById(f.empId).nama} ditambahkan`);
    },
    removeAdj(a) { this.db.adjustments = this.db.adjustments.filter((x) => x.id !== a.id); const run = this.runOf(a.period); if (run && run.status === 'Draft') this.recalc(run); this.save(`Penyesuaian "${a.nama}" dihapus`); },
    stepIndex(s) { return ['Draft', 'Diajukan', 'Disetujui', 'Dibayar'].indexOf(s); },
    get previewRun() { this.rev; return H.buildRun(Alpine.raw(this.db), this.curPeriod, ''); },
    printUrl(doc, run, emp = '') { return `cetak.html?doc=${doc}&run=${run ? run.id : ''}${emp ? '&emp=' + emp : ''}`; },
    exportRun(run) {
      const head = ['NIK', 'Nama', 'Kategori', 'Unit', 'Jabatan', 'PTKP', 'Hari Jadwal', 'Hadir', 'Alpa', 'Jam Lembur', 'Gaji Pokok', 'Tunj. Jabatan', 'Tunj. Lokasi', 'Tunj. Makan', 'Tunj. Transport', 'Upah Lembur', 'Penyesuaian (+)', 'Total Pendapatan', 'BPJS Kes', 'JHT', 'JP', 'PPh 21', 'Potongan Lain', 'Total Potongan', 'Take Home Pay', 'Beban BPJS Perusahaan', 'Bank', 'No. Rekening'];
      const g = (arr, k) => arr.filter((x) => x.kode === k).reduce((a, x) => a + x.nilai, 0);
      const rows = [head, ...run.lines.map((l) => [l.nik, l.nama, l.kategori, l.unit, l.jabatan, l.ptkp, l.hadir.jadwal, l.hadir.hadir, l.hadir.alpa, l.jamLembur, g(l.pendapatan, 'GP'), g(l.pendapatan, 'TJ'), g(l.pendapatan, 'TL'), g(l.pendapatan, 'TM'), g(l.pendapatan, 'TT'), g(l.pendapatan, 'LB'), g(l.pendapatan, 'ADJ'), l.totalPendapatan, g(l.potongan, 'BK'), g(l.potongan, 'JHT'), g(l.potongan, 'JP'), g(l.potongan, 'PPH'), g(l.potongan, 'ADJ') + g(l.potongan, 'PA'), l.totalPotongan, l.thp, l.totalPerusahaan - (l.pph.metode === 'ditanggung' ? l.pph.nilai : 0), l.bank, l.rekening])];
      downloadCSV(`payroll-${run.period}.csv`, rows);
    },

    // ---------------------------------------------------------- slip
    get slipRuns() { return this.runsSorted; },
    get slipRunObj() { return this.db.runs.find((r) => r.id === this.slipRun) || this.runsSorted[0] || null; },
    get slipLines() { const r = this.slipRunObj; if (!r) return []; const q = this.slipQ.toLowerCase(); return r.lines.filter((l) => !q || (l.nama + l.nik).toLowerCase().includes(q)); },
    get slipSrc() {
      const r = this.slipRunObj; if (!r) return '';
      if (this.slipDoc === 'slip') return this.printUrl('slip', r, this.slipEmp || (r.lines[0] || {}).empId) + '&embed=1';
      if (this.slipDoc === 'absensi') return this.printUrl('absensi', r, this.slipEmp || (r.lines[0] || {}).empId) + '&embed=1';
      return this.printUrl(this.slipDoc, r) + '&embed=1';
    },

    // ---------------------------------------------------------- laporan
    get repRunObj() { return this.db.runs.find((r) => r.id === this.repRun) || this.runsSorted[0] || null; },
    groupBy(lines, keyFn) {
      const m = {};
      lines.forEach((l) => {
        const k = keyFn(l); const g = m[k] = m[k] || { k, n: 0, pokok: 0, tunjangan: 0, lembur: 0, jamLembur: 0, pendapatan: 0, bpjsPekerja: 0, bpjsPerusahaan: 0, pph: 0, thp: 0, biaya: 0 };
        g.n++; g.pokok += (l.pendapatan.find((p) => p.kode === 'GP') || {}).nilai || 0;
        g.tunjangan += l.pendapatan.filter((p) => ['TJ', 'TL', 'TM', 'TT'].includes(p.kode)).reduce((a, p) => a + p.nilai, 0);
        g.lembur += l.nilaiLembur; g.jamLembur += l.jamLembur; g.pendapatan += l.totalPendapatan;
        g.bpjsPekerja += l.potongan.filter((p) => ['BK', 'JHT', 'JP'].includes(p.kode)).reduce((a, p) => a + p.nilai, 0);
        g.bpjsPerusahaan += l.perusahaan.filter((p) => p.kode !== 'PPH').reduce((a, p) => a + p.nilai, 0);
        g.pph += l.pph.nilai; g.thp += l.thp; g.biaya += l.biaya;
      });
      return Object.values(m).sort((a, b) => b.biaya - a.biaya);
    },
    get repByKat() { const r = this.repRunObj; return r ? this.groupBy(r.lines, (l) => l.kategori) : []; },
    get repByUnit() { const r = this.repRunObj; return r ? this.groupBy(r.lines, (l) => l.unit) : []; },
    get repByLok() { const r = this.repRunObj; return r ? this.groupBy(r.lines, (l) => l.lokasi) : []; },
    get repComposition() {
      const r = this.repRunObj; if (!r) return [];
      const t = this.groupBy(r.lines, () => 'all')[0] || {};
      const parts = [['Gaji pokok', t.pokok, 'bg-navy'], ['Tunjangan', t.tunjangan, 'bg-sky'], ['Lembur', t.lembur, 'bg-accent'], ['Penyesuaian', t.pendapatan - t.pokok - t.tunjangan - t.lembur, 'bg-violet-500'], ['BPJS perusahaan', t.bpjsPerusahaan, 'bg-slate-400']];
      const total = parts.reduce((a, p) => a + Math.max(0, p[1]), 0) || 1;
      return parts.map(([label, v, cls]) => ({ label, v, cls, pct: (Math.max(0, v) / total) * 100 }));
    },
    get repOT() { const r = this.repRunObj; return r ? [...r.lines].filter((l) => l.jamLembur).sort((a, b) => b.nilaiLembur - a.nilaiLembur) : []; },
    sumLines(lines, f) { return lines.reduce((a, l) => a + f(l), 0); },
    comp(l, grp, kode) { return (l[grp] || []).filter((x) => x.kode === kode).reduce((a, x) => a + x.nilai, 0); },
    exportRep(kind) {
      const r = this.repRunObj; if (!r) return;
      const c = (l, g, k) => this.comp(l, g, k);
      let rows;
      if (kind === 'bpjs') rows = [['NIK', 'Nama', 'Upah BPJS', 'Kes Pekerja', 'Kes Perusahaan', 'JHT Pekerja', 'JHT Perusahaan', 'JP Pekerja', 'JP Perusahaan', 'JKK', 'JKM'], ...r.lines.map((l) => [l.nik, l.nama, l.upahTetap, c(l, 'potongan', 'BK'), c(l, 'perusahaan', 'BKP'), c(l, 'potongan', 'JHT'), c(l, 'perusahaan', 'JHTP'), c(l, 'potongan', 'JP'), c(l, 'perusahaan', 'JPP'), c(l, 'perusahaan', 'JKK'), c(l, 'perusahaan', 'JKM')])];
      else if (kind === 'pph') rows = [['NIK', 'Nama', 'NPWP', 'PTKP', 'Kategori TER', 'Bruto', 'Tarif %', 'PPh 21', 'Metode'], ...r.lines.map((l) => [l.nik, l.nama, l.npwp, l.ptkp, l.pph.kategori, l.pph.bruto, l.pph.tarif, l.pph.nilai, l.pph.metode])];
      else if (kind === 'lembur') rows = [['NIK', 'Nama', 'Unit', 'Tanggal', 'Jenis Hari', 'Jam Aktual', 'Rincian Pengali', 'Jam Ekuivalen', 'Nilai'], ...r.lines.flatMap((l) => l.lembur.map((o) => [l.nik, l.nama, l.unit, o.ds, o.jenis, o.jam, o.rincian.map((x) => `${x.jam}x${x.kali}`).join(' + '), o.ekuivalen, o.nilai]))];
      else if (kind === 'transfer') rows = [['No', 'Bank', 'No. Rekening', 'Atas Nama', 'NIK', 'Nominal', 'Berita'], ...r.lines.map((l, i) => [i + 1, l.bank, l.rekening, l.atasNama, l.nik, l.thp, 'GAJI ' + r.period])];
      else rows = [['Kelompok', 'Karyawan', 'Gaji Pokok', 'Tunjangan', 'Lembur', 'Jam Lembur', 'Total Pendapatan', 'BPJS Pekerja', 'BPJS Perusahaan', 'PPh 21', 'Take Home Pay', 'Total Biaya'], ...[...this.repByKat, ...this.repByUnit].map((g) => [g.k, g.n, g.pokok, g.tunjangan, g.lembur, g.jamLembur, g.pendapatan, g.bpjsPekerja, g.bpjsPerusahaan, g.pph, g.thp, g.biaya])];
      downloadCSV(`laporan-${kind}-${r.period}.csv`, rows);
    },

    // ---------------------------------------------------------- rumus
    saveRules() {
      const d = this.rulesDraft;
      const n = (o, keys) => keys.forEach((k) => { o[k] = Number(o[k]) || 0; });
      n(d, ['cutoff', 'toleransiTerlambat', 'umk']); n(d.lembur, ['pembagi', 'minimal', 'pembulatan', 'maksHarian']);
      n(d.bpjs, Object.keys(d.bpjs));
      ['kerja', 'libur6', 'libur5'].forEach((k) => d.lembur[k].forEach((t) => { t.sd = Number(t.sd) || 0; t.kali = Number(t.kali) || 0; }));
      this.db.rules = H.clone(d);
      this.save('Rumus & parameter payroll diperbarui (berlaku untuk perhitungan berikutnya)');
    },
    resetRules() { this.ask('Kembalikan seluruh rumus & parameter ke nilai bawaan?', () => { this.rulesDraft = E.defaultRules(); this.saveRules(); }); },
    get sim() {
      const f = this.simForm; const rules = this.db.rules;
      const pokok = Number(f.pokok) || 0, tetap = Number(f.tetap) || 0;
      const dasar = rules.lembur.dasar === 'pokok' ? pokok : pokok + tetap;
      const upahJam = dasar / rules.lembur.pembagi;
      const k = E.overtimeTiers(Number(f.jamKerja) || 0, 'Hari Kerja', Number(f.mingguKerja), rules);
      const l = E.overtimeTiers(Number(f.jamLibur) || 0, 'Hari Libur', Number(f.mingguKerja), rules);
      const lembur = Math.round((k.ekuivalen + l.ekuivalen) * upahJam);
      const makan = (Number(f.makan) || 0) * (Number(f.hari) || 0);
      const B = rules.bpjs; const upah = pokok + tetap;
      const kes = Math.round(Math.min(upah, B.kesMaks) * B.kesPekerja / 100), jht = Math.round(upah * B.jhtPekerja / 100), jp = Math.round(Math.min(upah, B.jpMaks) * B.jpPekerja / 100);
      const natura = Math.round(Math.min(upah, B.kesMaks) * B.kesPerusahaan / 100 + upah * (B.jkkLapangan + B.jkm) / 100);
      const bruto = pokok + tetap + makan + lembur;
      const ter = E.terRate(f.ptkp, bruto + natura);
      const pph = Math.floor((bruto + natura) * ter.tarif / 100);
      return { upahJam, k, l, lembur, makan, bruto, kes, jht, jp, natura, ter, pph, thp: bruto - kes - jht - jp - (rules.pph.metode === 'gross' ? pph : 0) };
    },
    tierText(t) { return t.rincian.map((x) => `${num(x.jam)} jam × ${num(x.kali)}`).join(' + ') || '—'; },
    get terTable() { let prev = 0; return E.TER[this.terCat].map(([max, t]) => { const row = { from: prev, to: max, t }; prev = max; return row; }); },

    // ---------------------------------------------------------- pengguna
    openUser(u = null) { this.userForm = u ? H.clone(u) : { id: '', email: '', nama: '', role: 'operator', empId: '', aktif: true, password: 'demo123' }; this.userModal = true; },
    saveUser() {
      const f = this.userForm;
      if (!f.email.trim() || !f.nama.trim()) { this.toast('Email dan nama wajib diisi.', 'error'); return; }
      if (f.role === 'karyawan' && !f.empId) { this.toast('Akun karyawan harus ditautkan ke data karyawan.', 'error'); return; }
      if (this.db.users.some((u) => u.id !== f.id && u.email.toLowerCase() === f.email.toLowerCase())) { this.toast('Email sudah dipakai.', 'error'); return; }
      if (f.id) { const i = this.db.users.findIndex((u) => u.id === f.id); this.db.users[i] = f; this.save(`Akun ${f.email} diperbarui`); }
      else { f.id = H.uid('usr'); this.db.users.push(f); this.save(`Akun baru ${f.email} (${this.roleName(f.role)}) dibuat`); }
      this.userModal = false;
    },
    switchUser(u) {
      localStorage.setItem(H.SESSION_KEY, JSON.stringify({ id: u.id, nama: u.nama, email: u.email, role: u.role, empId: u.empId, t: Date.now() }));
      location.hash = ''; location.reload();
    },

    // ---------------------------------------------------------- portal karyawan
    get mySummary() { return this.me ? this.empSummary(this.me, this.sayaPeriod) : null; },
    get mySlips() { return this.me ? this.empSlips(this.me).filter((x) => ['Disetujui', 'Dibayar'].includes(x.run.status)) : []; },
    get myLeaves() { this.rev; return this.me ? this.db.leaves.filter((l) => l.empId === this.me.id).sort((a, b) => b.dari.localeCompare(a.dari)) : []; },
    get myScans() { this.rev; return this.me ? this.db.scans.filter((s) => s.empId === this.me.id).sort((a, b) => b.t.localeCompare(a.t)).slice(0, 12) : []; },
  }));
});
