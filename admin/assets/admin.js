/* =====================================================================
   SIMULASI Panel Admin & Sistem Database — PT. Yawiraya Bina Mandiri
   ---------------------------------------------------------------------
   Seluruh data disimpan di localStorage browser (bukan server).
   Data karyawan, laporan dan dokumen adalah DATA DUMMY untuk demo.
   ===================================================================== */

const DB_KEY = 'ybm-admin-db-v2';
const SESSION_KEY = 'ybm-admin-session';

// ---------------------------------------------------------------- utilitas
const uid = (p = 'id') => p + '_' + Math.random().toString(36).slice(2, 9);
const clone = (o) => JSON.parse(JSON.stringify(o));
const pad = (n) => String(n).padStart(2, '0');
const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const parseISO = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const daysBetween = (a, b) => Math.round((parseISO(b) - parseISO(a)) / 86400000);
const todayISO = () => iso(new Date());

// ---------------------------------------------------------------- kalender kerja
const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const EXCUSED = ['Izin', 'Sakit', 'Cuti']; // tidak mengurangi skor kehadiran

function defaultCalendar() {
  const y = new Date().getFullYear();
  const fixed = [['01-01', 'Tahun Baru Masehi'], ['05-01', 'Hari Buruh Internasional'], ['06-01', 'Hari Lahir Pancasila'], ['08-17', 'Hari Kemerdekaan RI'], ['12-25', 'Hari Raya Natal']];
  const libur = [];
  [y, y + 1].forEach((yr) => fixed.forEach(([md, nama]) => libur.push({ tanggal: `${yr}-${md}`, nama })));
  return { hariKerja: [1, 2, 3, 4, 5, 6], jamGenerate: '07:00', otomatis: true, libur, lastGenerated: '' };
}
const holidayName = (cal, ds) => (cal.libur.find((l) => l.tanggal === ds) || {}).nama || '';
const isWorkday = (cal, ds) => cal.hariKerja.includes(parseISO(ds).getDay()) && !cal.libur.some((l) => l.tanggal === ds);
const nowHM = () => { const d = new Date(); return pad(d.getHours()) + ':' + pad(d.getMinutes()); };

// Draft daily report kosong yang dibuat otomatis oleh sistem
function draftReport(e, ds) {
  const cuti = e.status === 'Cuti';
  return {
    id: uid('r'), tanggal: ds, empId: e.id, unitId: e.unitId,
    kehadiran: cuti ? 'Cuti' : 'Hadir', draft: !cuti, auto: true,
    lokasi: '', kegiatan: '', jam: cuti ? 0 : 8, progress: 0, kualitas: 0, k3: 'Aman', status: cuti ? '' : 'Proses',
    catatan: cuti ? 'Dibuat otomatis — karyawan berstatus cuti' : '', verified: cuti,
  };
}

// Generator: buat draft untuk setiap karyawan aktif pada setiap hari kerja kalender
function generateReports(db, opts = {}) {
  const cal = db.kalender;
  const today = todayISO();
  const start = cal.lastGenerated || iso(addDays(new Date(), -30));
  const existing = new Set(db.reports.map((r) => r.empId + '|' + r.tanggal));
  let created = 0;
  for (let d = parseISO(start); iso(d) <= today; d = addDays(d, 1)) {
    const ds = iso(d);
    if (!isWorkday(cal, ds)) continue;
    if (ds === today && nowHM() < cal.jamGenerate && !opts.force) continue;
    db.employees.forEach((e) => {
      if (e.status !== 'Aktif' && e.status !== 'Cuti') return;
      if (e.tglMasuk && ds < e.tglMasuk) return;
      if (existing.has(e.id + '|' + ds)) return;
      db.reports.push(draftReport(e, ds));
      existing.add(e.id + '|' + ds);
      created++;
    });
  }
  cal.lastGenerated = today;
  return created;
}

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------- data awal (dummy)
function seedDatabase() {
  const rnd = mulberry32(1996);
  const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
  const between = (a, b) => Math.round(a + rnd() * (b - a));
  const today = new Date(); today.setHours(0, 0, 0, 0);

  const units = [
    { id: 'u1', kode: 'MGT', nama: 'Manajemen & Administrasi', lokasi: 'Kantor Timika', deskripsi: 'Pengelolaan perusahaan, keuangan, HR dan administrasi proyek.', kegiatan: ['Rekap absensi & payroll', 'Administrasi kontrak proyek', 'Koordinasi dengan klien', 'Penyusunan laporan bulanan'] },
    { id: 'u2', kode: 'HSE', nama: 'K3 / HSE', lokasi: 'Lowland', deskripsi: 'Pengawasan Keselamatan, Kesehatan Kerja dan Lingkungan.', kegiatan: ['Safety talk pagi', 'Inspeksi APD lapangan', 'Inspeksi scaffolding', 'Investigasi near miss'] },
    { id: 'u3', kode: 'SCF', nama: 'Scaffolding', lokasi: 'Highland', deskripsi: 'Pemasangan dan pembongkaran perancah bersertifikat.', kegiatan: ['Erection scaffolding', 'Dismantle scaffolding', 'Inspeksi tag scaffold', 'Mobilisasi material scaffold'] },
    { id: 'u4', kode: 'PCC', nama: 'Painting, Civil & Carpenter', lokasi: 'Lowland', deskripsi: 'Pengecatan, pekerjaan sipil ringan dan carpenter.', kegiatan: ['Pengecatan dinding barrack', 'Perbaikan kusen & pintu', 'Pengecoran tempat duduk', 'Persiapan permukaan (sanding)'] },
    { id: 'u5', kode: 'KON', nama: 'Konstruksi', lokasi: 'Lowland', deskripsi: 'Konstruksi jalan, jembatan, drainase dan bangunan.', kegiatan: ['Pekerjaan lapen jalan', 'Pemasangan drainase', 'Pembesian & bekisting', 'Penimbunan & pemadatan'] },
    { id: 'u6', kode: 'MNT', nama: 'Maintenance', lokasi: 'Lowland', deskripsi: 'Pemeliharaan fasilitas: plumbing, AC, kelistrikan.', kegiatan: ['Perawatan AC kantor', 'Perbaikan plumbing', 'Pengecekan instalasi listrik', 'Preventive maintenance genset'] },
    { id: 'u7', kode: 'LOG', nama: 'Logistics', lokasi: 'Kantor Timika', deskripsi: 'Pengadaan, gudang dan distribusi material.', kegiatan: ['Penerimaan material gudang', 'Stock opname', 'Distribusi APD ke site', 'Pengadaan produk 3M'] },
    { id: 'u8', kode: 'TRN', nama: 'Transportasi / Driver', lokasi: 'Lowland', deskripsi: 'Operasional bus karyawan dan kendaraan operasional.', kegiatan: ['Antar-jemput karyawan rute LIP–KK', 'Pengecekan harian kendaraan', 'Rute bus kota RW-A', 'Servis berkala bus'] },
    { id: 'u9', kode: 'IPH', nama: 'Manpower IPHMC', lokasi: 'Lowland', deskripsi: 'Industrial Public Health & Malaria Control.', kegiatan: ['Fogging area permukiman', 'Larvasida genangan air', 'Sampling nyamuk', 'Pemeriksaan sampel laboratorium'] },
    { id: 'u10', kode: 'UGR', nama: 'Underground (RUC)', lokasi: 'Highland', deskripsi: 'Tenaga kerja tambang bawah tanah untuk PT. RUC.', kegiatan: ['Support drilling underground', 'Pengelasan struktur underground', 'Operasional alat berat', 'Housekeeping area kerja'] },
  ];

  const jabatanByUnit = {
    u1: ['Staf Administrasi', 'Staf Keuangan', 'HR Officer'],
    u2: ['Safety Officer', 'Ahli K3 Umum'],
    u3: ['Scaffolder', 'Scaffolder Supervisor'],
    u4: ['Painter', 'Carpenter', 'Mason'],
    u5: ['Pengawas Lapangan', 'Tukang Sipil', 'Operator Alat Berat'],
    u6: ['Teknisi AC', 'Teknisi Listrik', 'Plumber'],
    u7: ['Staf Logistik', 'Admin Gudang'],
    u8: ['Driver Bus', 'Driver Operasional'],
    u9: ['Field Officer IPHMC', 'Analis Laboratorium'],
    u10: ['Miner', 'Welder', 'Operator Alat Berat'],
  };

  const names = [
    ['Yohanes Wenda', 'L'], ['Markus Tabuni', 'L'], ['Petrus Kogoya', 'L'], ['Daniel Magai', 'L'],
    ['Agustina Murib', 'P'], ['Yakob Beanal', 'L'], ['Simon Wanimbo', 'L'], ['Elisa Kum', 'P'],
    ['Martha Waker', 'P'], ['Obet Tsenawatme', 'L'], ['Frans Rumbiak', 'L'], ['Rudi Hartono', 'L'],
    ['Andi Saputra', 'L'], ['Budi Santoso', 'L'], ['Herlina Sitorus', 'P'], ['Kevin Manuputty', 'L'],
    ['Nikolas Yoman', 'L'], ['Paulus Degei', 'L'], ['Rina Kurniawati', 'P'], ['Stevanus Pigai', 'L'],
    ['Thomas Mote', 'L'], ['Yulianus Gobai', 'L'], ['Zakarias Tekege', 'L'], ['Lukas Enumbi', 'L'],
  ];
  const unitOrder = ['u1', 'u2', 'u3', 'u3', 'u4', 'u4', 'u5', 'u5', 'u6', 'u7', 'u8', 'u8', 'u9', 'u9', 'u10', 'u10', 'u3', 'u4', 'u1', 'u5', 'u6', 'u9', 'u10', 'u2'];
  const statusOverride = { 6: 'Cuti', 13: 'Cuti', 17: 'Kontrak Berakhir', 22: 'Nonaktif' };
  const kota = ['Timika', 'Paniai', 'Jayapura', 'Wamena', 'Nabire', 'Biak', 'Ambon', 'Makassar'];
  const sertifikat = { u2: 'Sertifikat Ahli K3 Umum', u3: 'Sertifikat Scaffolder Kemnaker', u5: 'SIO Operator Alat Berat', u10: 'Sertifikat Welder', u8: 'SIM B1 Umum', u6: 'Sertifikat Teknisi Listrik' };

  const employees = names.map(([nama, jk], i) => {
    const unitId = unitOrder[i];
    const status = statusOverride[i] || 'Aktif';
    const masuk = addDays(today, -between(300, 3600));
    let selesai;
    if (status === 'Kontrak Berakhir') selesai = addDays(today, -12);
    else if ([2, 9, 15].includes(i)) selesai = addDays(today, between(5, 28)); // segera berakhir
    else selesai = addDays(today, between(60, 540));
    const mulaiKontrak = addDays(selesai, -365);
    const first = nama.split(' ')[0].toLowerCase();
    const id = 'e' + (i + 1);
    const dokumen = [
      { id: uid('d'), jenis: 'KTP', nama: 'KTP ' + nama, berlaku: '', file: { name: `ktp_${first}.pdf`, size: between(90, 400) * 1024, type: 'application/pdf', data: null } },
      { id: uid('d'), jenis: 'BPJS', nama: 'Kartu BPJS Ketenagakerjaan', berlaku: '', file: { name: `bpjs_${first}.pdf`, size: between(60, 250) * 1024, type: 'application/pdf', data: null } },
    ];
    if (sertifikat[unitId]) {
      dokumen.push({ id: uid('d'), jenis: 'Sertifikat', nama: sertifikat[unitId], berlaku: iso(addDays(today, [4, 10].includes(i) ? between(-20, 20) : between(90, 720))), file: { name: `sertifikat_${first}.pdf`, size: between(150, 900) * 1024, type: 'application/pdf', data: null } });
    }
    return {
      id,
      nik: 'YBM-' + String(1001 + i),
      nama, jk,
      foto: null,
      tempatLahir: pick(kota),
      tglLahir: iso(new Date(between(1970, 2001), between(0, 11), between(1, 28))),
      oap: i % 3 !== 0 && i < 12 ? true : rnd() > 0.45,
      unitId,
      jabatan: pick(jabatanByUnit[unitId]),
      status,
      tglMasuk: iso(masuk),
      telp: '08' + between(11, 13) + between(10000000, 99999999),
      email: `${first}.${i + 1}@yawirayabinamandiri.com`,
      alamat: `${pick(['Jl. Hasanuddin', 'Jl. Budi Utomo', 'Jl. Cenderawasih', 'Jl. Yos Sudarso', 'Jl. Pendidikan', 'SP 2', 'Kwamki Narama'])} No. ${between(1, 120)}, Timika`,
      kontakDarurat: { nama: pick(['Maria', 'Yosina', 'Natalia', 'Benny', 'Kornelis', 'Sarah']) + ' ' + nama.split(' ')[1], hubungan: pick(['Istri', 'Suami', 'Orang Tua', 'Saudara']), telp: '08' + between(11, 13) + between(10000000, 99999999) },
      kontrak: {
        nomor: `${pad(between(1, 300))}/PKWT/YBM/${mulaiKontrak.getFullYear()}`,
        jenis: i < 2 ? 'PKWTT' : 'PKWT',
        mulai: iso(mulaiKontrak),
        selesai: i < 2 ? '' : iso(selesai),
        gaji: '',
        file: { name: `kontrak_${first}.pdf`, size: between(200, 800) * 1024, type: 'application/pdf', data: null },
      },
      dokumen,
      _base: 62 + rnd() * 34, // karakter kinerja (hanya untuk generator)
    };
  });

  // Daily report 21 hari terakhir — setiap HARI KERJA kalender, setiap karyawan aktif
  // mendapat 1 entri otomatis (terisi / tidak hadir / masih draft untuk hari ini & kemarin)
  const kalender = defaultCalendar();
  const reports = [];
  const lokasiByUnit = { 'Kantor Timika': ['Kantor Jl. Pendidikan'], Lowland: ['Kuala Kencana', 'LIP', 'Timika', 'SP 1 – GSI'], Highland: ['Tembagapura', 'Mile 74', 'Grasberg Block Cave'] };
  for (let d = 20; d >= 0; d--) {
    const date = addDays(today, -d);
    const ds = iso(date);
    if (!isWorkday(kalender, ds)) continue;
    employees.forEach((e) => {
      if (e.status === 'Nonaktif' || e.status === 'Kontrak Berakhir') return;
      if (e.status === 'Cuti' && d < 6) { reports.push(draftReport(e, ds)); return; }
      const fillProb = d === 0 ? 0.45 : d === 1 ? 0.85 : 1;
      if (rnd() > fillProb) { reports.push(draftReport(e, ds)); return; }
      const a = rnd();
      const absen = a < 0.03 ? 'Sakit' : a < 0.05 ? 'Izin' : a < 0.065 ? 'Alpa' : '';
      if (absen) {
        reports.push({
          ...draftReport(e, ds), kehadiran: absen, draft: false, jam: 0, status: '',
          catatan: absen === 'Sakit' ? 'Surat keterangan dokter terlampir' : absen === 'Izin' ? 'Izin keperluan keluarga' : 'Tidak hadir tanpa keterangan',
          verified: d > 2,
        });
        return;
      }
      const unit = units.find((u) => u.id === e.unitId);
      const progress = Math.max(20, Math.min(100, Math.round(e._base + (rnd() - 0.5) * 30)));
      const r = rnd();
      const k3 = r < 0.012 ? 'Insiden' : r < 0.045 ? 'Near Miss' : 'Aman';
      const kendala = rnd() < 0.06;
      reports.push({
        id: uid('r'),
        tanggal: ds,
        empId: e.id,
        unitId: e.unitId,
        kehadiran: 'Hadir', draft: false, auto: true,
        lokasi: pick(lokasiByUnit[unit.lokasi]),
        kegiatan: pick(unit.kegiatan),
        jam: Math.round((7 + rnd() * 3) * 2) / 2,
        progress,
        kualitas: Math.max(1, Math.min(5, Math.round(e._base / 20 + (rnd() - 0.5) * 1.6))),
        k3,
        status: kendala ? 'Kendala' : progress >= 90 ? 'Selesai' : 'Proses',
        catatan: kendala ? pick(['Hujan deras, pekerjaan dihentikan sementara', 'Material terlambat datang', 'Menunggu izin kerja (work permit)']) : k3 !== 'Aman' ? pick(['Tersandung material di jalur akses, sudah dilakukan housekeeping', 'Tangan tergores, P3K diberikan di lokasi']) : '',
        verified: d > 2 ? true : rnd() > 0.5,
      });
    });
  }
  employees.forEach((e) => delete e._base);

  const content = {
    beranda: {
      judul: 'Yawiraya Bina Mandiri',
      subjudul: 'Kontraktor Putra Daerah Papua',
      deskripsi: 'Konstruksi, pemeliharaan fasilitas & bangunan, penyediaan tenaga kerja dan perdagangan umum — dengan mutu yang berkualitas.',
      visi: 'Menjadi salah satu Perusahaan Kontraktor Putra Daerah Papua terbaik dan menghasilkan Tenaga Kerja berskala Nasional, lebih khusus Tenaga Kerja lokal Papua yang berkualitas dan berhasil guna.',
      statistik: [{ label: 'Tenaga Kerja Terlatih', nilai: '184' }, { label: 'Tahun Pengalaman', nilai: '30+' }, { label: 'Set Scaffolding', nilai: '600' }],
    },
    layanan: [
      { id: uid('s'), judul: 'Contractors', deskripsi: 'Konstruksi jalan, jembatan, gedung, drainase, pemeliharaan fasilitas & proyek pengelasan.', ikon: 'fa-helmet-safety', aktif: true },
      { id: uid('s'), judul: 'Labour Supplier', deskripsi: 'Tenaga konstruksi & underground: mason, carpenter, welder, rigger, miner, operator alat berat.', ikon: 'fa-people-group', aktif: true },
      { id: uid('s'), judul: 'Proyek Conveyor', deskripsi: 'Penggantian roller, pulley, gear box, chute liner, re-lagging & belt splices.', ikon: 'fa-gears', aktif: true },
      { id: uid('s'), judul: 'General Supplier', deskripsi: 'Produk 3M: APD, respirator, fall protection, alat ukur kebisingan & kualitas udara.', ikon: 'fa-boxes-stacked', aktif: true },
    ],
    galeri: [
      { id: uid('g'), judul: 'Pengecatan & Scaffolding Barrack BQ Garden, Tembagapura', kategori: 'Scaffolding & Painting', gambar: '../assets/img/scaffolding-barrack.jpg', tampil: true },
      { id: uid('g'), judul: 'Baliho Atrium Kuala Kencana — Persiapan PON XX', kategori: 'Carpenter & Mason', gambar: '../assets/img/baliho-pon.jpg', tampil: true },
      { id: uid('g'), judul: 'Labor supply ke PT. RUC Underground', kategori: 'Labor Supplier', gambar: '../assets/img/underground-ruc.jpg', tampil: true },
      { id: uid('g'), judul: 'Labor supply IPHMC — Malaria Control', kategori: 'Labor Supplier', gambar: '../assets/img/iphmc-fogging.jpg', tampil: true },
      { id: uid('g'), judul: 'Bus transportasi karyawan LIP – KK', kategori: 'Rental Bus', gambar: '../assets/img/bus-karyawan.jpg', tampil: true },
      { id: uid('g'), judul: 'Pekerjaan Lapen Jl. SP 1 sepanjang 1.897 m', kategori: 'Konstruksi', gambar: '../assets/img/jalan-lapen.jpg', tampil: false },
    ],
    kontak: {
      alamat: 'Jl. Pendidikan Jalur 1-5a, Otomona, Mimika Baru, Timika, Papua 99910',
      telp: '(0901) 3265824',
      email: 'pt.yawiraya@yahoo.com',
      maps: 'https://maps.google.com/maps?q=Jl.%20Pendidikan%2C%20Otomona%2C%20Timika&output=embed',
      instagram: '#', facebook: '#', youtube: '#', whatsapp: '#',
    },
  };

  kalender.lastGenerated = iso(today);
  return { version: 2, createdAt: new Date().toISOString(), units, employees, reports, kalender, content, activity: [] };
}

// ---------------------------------------------------------------- konstanta tampilan
const EMP_STATUS = {
  Aktif: { cls: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20', icon: 'fa-circle-check', bar: '#059669' },
  Cuti: { cls: 'bg-amber-50 text-amber-800 ring-amber-600/20', icon: 'fa-umbrella-beach', bar: '#d97706' },
  'Kontrak Berakhir': { cls: 'bg-red-50 text-red-700 ring-red-600/20', icon: 'fa-file-circle-xmark', bar: '#dc2626' },
  Nonaktif: { cls: 'bg-slate-100 text-slate-600 ring-slate-500/20', icon: 'fa-circle-minus', bar: '#94a3b8' },
};
const REPORT_STATUS = {
  Selesai: { cls: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20', icon: 'fa-circle-check' },
  Proses: { cls: 'bg-blue-50 text-blue-700 ring-blue-600/20', icon: 'fa-person-digging' },
  Kendala: { cls: 'bg-red-50 text-red-700 ring-red-600/20', icon: 'fa-triangle-exclamation' },
};
const KEHADIRAN = {
  Hadir: { cls: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20', icon: 'fa-user-check' },
  Izin: { cls: 'bg-blue-50 text-blue-700 ring-blue-600/20', icon: 'fa-envelope-open-text' },
  Sakit: { cls: 'bg-amber-50 text-amber-800 ring-amber-600/20', icon: 'fa-briefcase-medical' },
  Cuti: { cls: 'bg-amber-50 text-amber-800 ring-amber-600/20', icon: 'fa-umbrella-beach' },
  Alpa: { cls: 'bg-red-50 text-red-700 ring-red-600/20', icon: 'fa-user-xmark' },
};
const K3_STATUS = {
  Aman: { cls: 'text-emerald-700', icon: 'fa-shield-halved' },
  'Near Miss': { cls: 'text-amber-700', icon: 'fa-triangle-exclamation' },
  Insiden: { cls: 'text-red-700', icon: 'fa-kit-medical' },
};
const DOC_STATUS = {
  Berlaku: { cls: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20', icon: 'fa-circle-check' },
  'Segera Berakhir': { cls: 'bg-amber-50 text-amber-800 ring-amber-600/20', icon: 'fa-clock' },
  Kedaluwarsa: { cls: 'bg-red-50 text-red-700 ring-red-600/20', icon: 'fa-circle-xmark' },
  'Tanpa Masa Berlaku': { cls: 'bg-slate-100 text-slate-600 ring-slate-500/20', icon: 'fa-infinity' },
};
const GRADE = (s) => (s >= 85 ? { label: 'Sangat Baik', cls: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20', icon: 'fa-star' }
  : s >= 70 ? { label: 'Baik', cls: 'bg-blue-50 text-blue-700 ring-blue-600/20', icon: 'fa-thumbs-up' }
  : s >= 55 ? { label: 'Cukup', cls: 'bg-amber-50 text-amber-800 ring-amber-600/20', icon: 'fa-minus' }
  : { label: 'Perlu Pembinaan', cls: 'bg-red-50 text-red-700 ring-red-600/20', icon: 'fa-arrow-trend-down' });

const ROUTES = {
  dashboard: ['Dashboard', 'fa-gauge-high'],
  kinerja: ['Monitoring Kinerja', 'fa-chart-simple'],
  karyawan: ['Database Karyawan', 'fa-id-card'],
  unit: ['Unit Kerja', 'fa-sitemap'],
  laporan: ['Daily Report', 'fa-clipboard-list'],
  dokumen: ['Dokumen & Kontrak', 'fa-folder-open'],
  kontak: ['Direktori Kontak', 'fa-address-book'],
  'konten-beranda': ['Konten: Beranda', 'fa-house'],
  'konten-layanan': ['Konten: Layanan', 'fa-briefcase'],
  'konten-galeri': ['Konten: Galeri Proyek', 'fa-images'],
  'konten-kontak': ['Konten: Kontak & Sosmed', 'fa-location-dot'],
  pengaturan: ['Pengaturan', 'fa-gear'],
};

// ---------------------------------------------------------------- komponen Alpine
document.addEventListener('alpine:init', () => {
  Alpine.data('admin', () => ({
    db: null,
    session: { nama: "", email: "", role: "" },
    repLimit: 50,
    route: 'dashboard',
    routes: ROUTES,
    sidebar: false,
    collapsed: (() => { try { return localStorage.getItem('ybm-admin-sidebar') === 'hidden'; } catch (e) { return false; } })(),
    userMenu: false,
    now: new Date(),
    toasts: [],
    tip: { show: false, x: 0, y: 0, title: '', value: '' },
    confirmBox: { show: false, text: '', action: null },

    // filter
    period: 14,
    kinerjaUnit: '',
    kinerjaSort: 'skor',
    empQ: '', empUnit: '', empStatus: '', empView: 'tabel',
    repFrom: '', repTo: '', repUnit: '', repStatus: '', repVerified: '', repQ: '', repKehadiran: '',
    repTab: 'daftar', calMonth: '', liburForm: { tanggal: '', nama: '' },
    docQ: '', docJenis: '', docStatus: '',
    kontakQ: '',
    globalQ: '',

    // modal & form
    empModal: false, empForm: null, empTab: 'pribadi',
    detail: null, detailTab: 'profil',
    repModal: false, repForm: null,
    unitModal: false, unitForm: null,
    docModal: false, docForm: null,
    preview: null,
    draft: null,

    // ---------------------------------------------------------- init
    init() {
      let session = null;
      try { session = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); } catch (e) { /* abaikan */ }
      if (!session) { location.replace('login.html'); return; }
      this.session = session;
      try { this.db = JSON.parse(localStorage.getItem(DB_KEY) || 'null'); } catch (e) { this.db = null; }
      if (!this.db) { this.db = seedDatabase(); this.save(false); }
      this.draft = clone(this.db.content);
      this.repFrom = iso(addDays(new Date(), -6));
      this.repTo = todayISO();
      this.calMonth = todayISO().slice(0, 8) + '01';
      this.runGenerator();
      const go = () => {
        const r = location.hash.replace('#', '') || 'dashboard';
        this.route = ROUTES[r] ? r : 'dashboard';
        this.sidebar = false;
        if (this.route.startsWith('konten')) this.draft = clone(this.db.content);
        window.scrollTo(0, 0);
      };
      window.addEventListener('hashchange', go);
      go();
      setInterval(() => { this.now = new Date(); }, 1000);
      // Generator otomatis dicek setiap menit (mis. saat jam generate tercapai / berganti hari)
      setInterval(() => this.runGenerator(), 60 * 1000);
    },

    // ---------------------------------------------------------- generator daily report otomatis
    runGenerator(force = false) {
      if (!this.db.kalender.otomatis && !force) return 0;
      const n = generateReports(this.db, { force });
      if (n) this.save(true, `Sistem membuat ${n} draft daily report otomatis`);
      else this.save(false);
      return n;
    },
    generateNow() {
      const n = this.runGenerator(true);
      if (!n) this.toast(isWorkday(this.db.kalender, todayISO()) ? 'Semua daily report hari kerja sudah tersedia.' : 'Hari ini bukan hari kerja — tidak ada draft yang dibuat.', 'info');
    },
    isWork(ds) { return isWorkday(this.db.kalender, ds); },
    holiday(ds) { return holidayName(this.db.kalender, ds); },
    kehadiranOf(k) { return KEHADIRAN[k] || KEHADIRAN.Hadir; },

    // ---------------------------------------------------------- kalender kerja
    get calTitle() { return parseISO(this.calMonth).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }); },
    calShift(n) { const m = parseISO(this.calMonth); this.calMonth = iso(new Date(m.getFullYear(), m.getMonth() + n, 1)); },
    get calDays() {
      const first = parseISO(this.calMonth);
      const offset = (first.getDay() + 6) % 7; // minggu dimulai Senin
      const dim = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
      const cells = Math.ceil((offset + dim) / 7) * 7;
      const t = todayISO();
      const out = [];
      for (let i = -offset; i < cells - offset; i++) {
        const d = addDays(first, i); const ds = iso(d);
        const rs = this.db.reports.filter((r) => r.tanggal === ds);
        out.push({
          ds, day: d.getDate(), inMonth: d.getMonth() === first.getMonth(), work: this.isWork(ds), libur: this.holiday(ds),
          total: rs.length, filled: rs.filter((r) => !r.draft).length, future: ds > t, today: ds === t,
        });
      }
      return out;
    },
    get todayProgress() {
      const rs = this.db.reports.filter((r) => r.tanggal === todayISO());
      const filled = rs.filter((r) => !r.draft).length;
      return { total: rs.length, filled, draft: rs.length - filled, pct: rs.length ? Math.round((filled / rs.length) * 100) : 0, work: this.isWork(todayISO()) };
    },
    openDay(ds) { this.repFrom = ds; this.repTo = ds; this.repStatus = ''; this.repKehadiran = ''; this.repTab = 'daftar'; },
    showDrafts() { this.repStatus = 'Belum Diisi'; this.repFrom = iso(addDays(new Date(), -30)); this.repTo = todayISO(); this.repTab = 'daftar'; location.hash = 'laporan'; },
    toggleWorkday(i) {
      const k = this.db.kalender.hariKerja;
      this.db.kalender.hariKerja = k.includes(i) ? k.filter((x) => x !== i) : [...k, i].sort();
      this.save(true, `Hari kerja diperbarui: ${this.db.kalender.hariKerja.map((x) => HARI[x]).join(', ')}`);
    },
    addLibur() {
      const f = this.liburForm;
      if (!f.tanggal || !f.nama.trim()) { this.toast('Tanggal dan nama hari libur wajib diisi.', 'error'); return; }
      if (this.db.kalender.libur.some((l) => l.tanggal === f.tanggal)) { this.toast('Tanggal tersebut sudah terdaftar sebagai hari libur.', 'error'); return; }
      this.db.kalender.libur.push({ tanggal: f.tanggal, nama: f.nama.trim() });
      this.db.kalender.libur.sort((a, b) => a.tanggal.localeCompare(b.tanggal));
      // draft yang belum diisi pada hari libur baru tidak diperlukan lagi
      const before = this.db.reports.length;
      this.db.reports = this.db.reports.filter((r) => !(r.tanggal === f.tanggal && r.draft));
      const removed = before - this.db.reports.length;
      this.save(true, `Hari libur ${f.nama.trim()} (${this.fmtDate(f.tanggal)}) ditambahkan` + (removed ? ` — ${removed} draft dihapus` : ''));
      this.liburForm = { tanggal: '', nama: '' };
    },
    removeLibur(l) {
      this.ask(`Hapus hari libur "${l.nama}"? Tanggal ${this.fmtDate(l.tanggal)} akan menjadi hari kerja.`, () => {
        this.db.kalender.libur = this.db.kalender.libur.filter((x) => x !== l);
        if (l.tanggal <= todayISO() && (!this.db.kalender.lastGenerated || l.tanggal < this.db.kalender.lastGenerated)) this.db.kalender.lastGenerated = l.tanggal;
        this.save(true, `Hari libur ${l.nama} dihapus`);
        this.runGenerator();
      });
    },
    get upcomingLibur() { const t = todayISO(); return this.db.kalender.libur.filter((l) => l.tanggal >= t).slice(0, 8); },

    save(log = true, msg = '') {
      try {
        localStorage.setItem(DB_KEY, JSON.stringify(this.db));
        if (msg) this.toast(msg);
      } catch (e) {
        this.toast('Penyimpanan browser penuh. Hapus beberapa file/foto berukuran besar.', 'error');
      }
      if (log && msg) {
        this.db.activity.unshift({ t: new Date().toISOString(), user: this.session.nama, msg });
        this.db.activity = this.db.activity.slice(0, 30);
        try { localStorage.setItem(DB_KEY, JSON.stringify(this.db)); } catch (e) { /* abaikan */ }
      }
    },

    toast(text, type = 'success') {
      const id = uid('t');
      this.toasts.push({ id, text, type });
      setTimeout(() => { this.toasts = this.toasts.filter((t) => t.id !== id); }, 3200);
    },

    // Sidebar: desktop = tampil/sembunyi (diingat), mobile = buka drawer
    toggleSidebar() {
      if (window.innerWidth < 1024) { this.sidebar = true; return; }
      this.collapsed = !this.collapsed;
      try { localStorage.setItem('ybm-admin-sidebar', this.collapsed ? 'hidden' : 'shown'); } catch (e) { /* abaikan */ }
    },

    ask(text, action) { this.confirmBox = { show: true, text, action }; },
    confirmYes() { const a = this.confirmBox.action; this.confirmBox.show = false; if (a) a(); },

    logout() { localStorage.removeItem(SESSION_KEY); location.href = 'login.html'; },

    // ---------------------------------------------------------- format
    get pageTitle() { return ROUTES[this.route][0]; },
    get clock() { return this.now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Asia/Jayapura' }).replace(/\./g, ':') + ' WIT'; },
    get dateLong() { return this.now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jayapura' }); },
    fmtDate(s) { return s ? parseISO(s).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'; },
    fmtDay(s) { return parseISO(s).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' }); },
    fmtSize(b) { return !b ? '—' : b > 1048576 ? (b / 1048576).toFixed(1) + ' MB' : Math.round(b / 1024) + ' KB'; },
    fmtTime(t) { return new Date(t).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); },
    initials(n) { return (n || '?').split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase(); },
    age(s) { if (!s) return '—'; const b = parseISO(s), n = new Date(); let a = n.getFullYear() - b.getFullYear(); if (n < new Date(n.getFullYear(), b.getMonth(), b.getDate())) a--; return a + ' th'; },
    tenure(s) { const d = daysBetween(s, todayISO()); const y = Math.floor(d / 365), m = Math.floor((d % 365) / 30); return (y ? y + ' th ' : '') + m + ' bln'; },
    empSt(s) { return EMP_STATUS[s] || EMP_STATUS.Nonaktif; },
    repSt(s) { return REPORT_STATUS[s]; },
    k3Status(s) { return K3_STATUS[s]; },
    docStatusOf(s) { return DOC_STATUS[s]; },
    grade(s) { return GRADE(s); },

    // ---------------------------------------------------------- lookup
    unitById(id) { return this.db.units.find((u) => u.id === id) || { nama: '—', kode: '—', kegiatan: [] }; },
    empById(id) { return this.db.employees.find((e) => e.id === id) || { nama: '(terhapus)', id: '' }; },
    empCountIn(unitId) { return this.db.employees.filter((e) => e.unitId === unitId && e.status !== 'Nonaktif').length; },

    // ---------------------------------------------------------- KPI
    periodStart() { return iso(addDays(new Date(), -(this.period - 1))); },
    workdays() { let n = 0; for (let i = 0; i < this.period; i++) if (this.isWork(iso(addDays(new Date(), -i)))) n++; return n; },

    kpi(emp, period = this.period) {
      const from = iso(addDays(new Date(), -(period - 1)));
      const t = todayISO();
      const all = this.db.reports.filter((r) => r.empId === emp.id && r.tanggal >= from);
      const filled = all.filter((r) => !r.draft);
      const rs = filled.filter((r) => r.kehadiran === 'Hadir');
      const absen = { Izin: 0, Sakit: 0, Cuti: 0, Alpa: 0 };
      filled.forEach((r) => { if (absen[r.kehadiran] !== undefined) absen[r.kehadiran]++; });
      const draft = all.filter((r) => r.draft).length;
      // hari kerja kalender dalam periode; hari ini dihitung hanya jika laporannya sudah diisi
      let wd = 0;
      for (let i = 0; i < period; i++) {
        const ds = iso(addDays(new Date(), -i));
        if (!this.isWork(ds) || (emp.tglMasuk && ds < emp.tglMasuk)) continue;
        if (ds === t && !filled.some((r) => r.tanggal === t)) continue;
        wd++;
      }
      const base = Math.max(1, wd - absen.Izin - absen.Sakit - absen.Cuti);
      if (!rs.length) return { n: 0, hadir: 0, prod: 0, kual: 0, k3: 100, skor: 0, insiden: 0, nearmiss: 0, jam: 0, draft, absen, wd };
      const days = new Set(rs.map((r) => r.tanggal)).size;
      const hadir = Math.min(100, (days / base) * 100);
      const prod = rs.reduce((a, r) => a + r.progress, 0) / rs.length;
      const kual = (rs.reduce((a, r) => a + r.kualitas, 0) / rs.length / 5) * 100;
      const insiden = rs.filter((r) => r.k3 === 'Insiden').length;
      const nearmiss = rs.filter((r) => r.k3 === 'Near Miss').length;
      const k3 = Math.max(0, 100 - insiden * 25 - nearmiss * 10);
      const skor = 0.35 * prod + 0.25 * kual + 0.25 * hadir + 0.15 * k3;
      const jam = rs.reduce((a, r) => a + r.jam, 0);
      return { n: rs.length, hadir: Math.round(hadir), prod: Math.round(prod), kual: Math.round(kual), k3, skor: Math.round(skor), insiden, nearmiss, jam, draft, absen, wd };
    },

    get monitoredEmps() { return this.db.employees.filter((e) => e.status === 'Aktif' || e.status === 'Cuti'); },

    get kpiRows() {
      const rows = this.monitoredEmps
        .filter((e) => !this.kinerjaUnit || e.unitId === this.kinerjaUnit)
        .map((e) => ({ emp: e, ...this.kpi(e) }));
      const k = this.kinerjaSort;
      return rows.sort((a, b) => (k === 'nama' ? a.emp.nama.localeCompare(b.emp.nama) : b[k] - a[k]));
    },

    get avgKpi() { const r = this.kpiRows.filter((x) => x.n); return r.length ? Math.round(r.reduce((a, x) => a + x.skor, 0) / r.length) : 0; },

    get unitKpi() {
      return this.db.units.map((u) => {
        const rows = this.monitoredEmps.filter((e) => e.unitId === u.id).map((e) => this.kpi(e)).filter((x) => x.n);
        return { unit: u, n: rows.length, skor: rows.length ? Math.round(rows.reduce((a, x) => a + x.skor, 0) / rows.length) : 0 };
      }).filter((x) => x.n).sort((a, b) => b.skor - a.skor);
    },

    get gradeDist() {
      const order = ['Sangat Baik', 'Baik', 'Cukup', 'Perlu Pembinaan'];
      const rows = this.kpiRows.filter((x) => x.n);
      return order.map((g) => ({ g, n: rows.filter((r) => GRADE(r.skor).label === g).length, info: GRADE(g === 'Sangat Baik' ? 90 : g === 'Baik' ? 75 : g === 'Cukup' ? 60 : 0) }));
    },

    // ---------------------------------------------------------- dashboard
    get stats() {
      const e = this.db.employees;
      const t = todayISO();
      const rt = this.db.reports.filter((r) => r.tanggal === t);
      return {
        total: e.length,
        aktif: e.filter((x) => x.status === 'Aktif').length,
        oap: e.filter((x) => x.oap && x.status !== 'Nonaktif').length,
        laporanHariIni: rt.filter((r) => !r.draft).length,
        expectedToday: rt.length,
        draftToday: rt.filter((r) => r.draft).length,
        draft: this.db.reports.filter((r) => r.draft).length,
        pending: this.db.reports.filter((r) => !r.draft && !r.verified).length,
        k3: this.db.reports.filter((r) => !r.draft && r.k3 !== 'Aman' && r.tanggal >= this.periodStart()).length,
      };
    },

    get dailyCounts() {
      const out = [];
      for (let i = 13; i >= 0; i--) {
        const d = iso(addDays(new Date(), -i));
        out.push({ d, n: this.db.reports.filter((r) => r.tanggal === d && !r.draft && r.kehadiran === 'Hadir').length, sunday: !this.isWork(d), libur: this.holiday(d) || (this.isWork(d) ? '' : 'Bukan hari kerja') });
      }
      const max = Math.max(...out.map((x) => x.n), 1);
      const ceil = Math.ceil(max / 10) * 10;
      return { rows: out, max: ceil };
    },

    get statusCounts() {
      const total = this.db.employees.length || 1;
      return Object.keys(EMP_STATUS).map((s) => {
        const n = this.db.employees.filter((e) => e.status === s).length;
        return { s, n, pct: (n / total) * 100, ...EMP_STATUS[s] };
      });
    },

    get expiring() {
      const t = todayISO();
      return this.db.employees
        .filter((e) => e.status !== 'Nonaktif' && e.kontrak.selesai)
        .map((e) => ({ emp: e, sisa: daysBetween(t, e.kontrak.selesai) }))
        .filter((x) => x.sisa <= 30)
        .sort((a, b) => a.sisa - b.sisa);
    },

    get recentReports() { return this.db.reports.filter((r) => !r.draft && r.kehadiran === 'Hadir').sort((a, b) => b.tanggal.localeCompare(a.tanggal)).slice(0, 6); },

    // ---------------------------------------------------------- tooltip grafik
    showTip(ev, title, value) {
      const r = ev.currentTarget.getBoundingClientRect();
      this.tip = { show: true, x: r.left + r.width / 2, y: r.top, title, value };
    },
    hideTip() { this.tip.show = false; },

    // ---------------------------------------------------------- karyawan
    get filteredEmps() {
      const q = this.empQ.toLowerCase();
      return this.db.employees.filter((e) =>
        (!this.empUnit || e.unitId === this.empUnit) &&
        (!this.empStatus || e.status === this.empStatus) &&
        (!q || [e.nama, e.nik, e.jabatan, e.telp, e.email].join(' ').toLowerCase().includes(q)));
    },

    blankEmp() {
      return {
        id: '', nik: 'YBM-' + (1001 + this.db.employees.length + Math.floor(Math.random() * 50)), nama: '', jk: 'L', foto: null,
        tempatLahir: '', tglLahir: '', oap: true, unitId: this.db.units[0]?.id || '', jabatan: '', status: 'Aktif', tglMasuk: todayISO(),
        telp: '', email: '', alamat: '', kontakDarurat: { nama: '', hubungan: '', telp: '' },
        kontrak: { nomor: '', jenis: 'PKWT', mulai: todayISO(), selesai: iso(addDays(new Date(), 365)), gaji: '', file: null },
        dokumen: [],
      };
    },
    openEmp(emp = null) {
      this.empForm = emp ? clone(emp) : this.blankEmp();
      this.empTab = 'pribadi';
      this.empModal = true;
    },
    saveEmp() {
      const f = this.empForm;
      if (!f.nama.trim() || !f.unitId) { this.empTab = 'pribadi'; this.toast('Nama dan unit kerja wajib diisi.', 'error'); return; }
      if (f.id) {
        const i = this.db.employees.findIndex((e) => e.id === f.id);
        this.db.employees[i] = f;
        if (this.detail && this.detail.id === f.id) this.detail = f;
        this.save(true, `Data karyawan ${f.nama} diperbarui`);
      } else {
        f.id = uid('e');
        this.db.employees.unshift(f);
        this.save(true, `Karyawan baru ${f.nama} ditambahkan`);
        this.runGenerator();
      }
      this.empModal = false;
    },
    deleteEmp(emp) {
      this.ask(`Hapus karyawan "${emp.nama}" beserta laporan hariannya?`, () => {
        this.db.employees = this.db.employees.filter((e) => e.id !== emp.id);
        this.db.reports = this.db.reports.filter((r) => r.empId !== emp.id);
        this.detail = null;
        this.save(true, `Karyawan ${emp.nama} dihapus`);
      });
    },
    openDetail(emp, tab = 'profil') { this.detail = emp; this.detailTab = tab; },
    empReports(emp) { return this.db.reports.filter((r) => r.empId === emp.id).sort((a, b) => b.tanggal.localeCompare(a.tanggal)); },
    empTrend(emp) {
      const out = [];
      for (let i = 13; i >= 0; i--) {
        const d = iso(addDays(new Date(), -i));
        const r = this.db.reports.find((x) => x.empId === emp.id && x.tanggal === d);
        const ok = r && !r.draft && r.kehadiran === 'Hadir';
        const note = !this.isWork(d) ? (this.holiday(d) || 'Bukan hari kerja') : !r ? 'Tidak ada laporan' : r.draft ? 'Belum diisi' : r.kehadiran !== 'Hadir' ? r.kehadiran : '';
        out.push({ d, v: ok ? r.progress : null, sunday: !this.isWork(d), note, miss: this.isWork(d) && (!r || r.draft || r.kehadiran === 'Alpa') });
      }
      return out;
    },

    async uploadPhoto(ev) {
      const file = ev.target.files[0]; ev.target.value = '';
      if (!file) return;
      if (!file.type.startsWith('image/')) { this.toast('File harus berupa gambar.', 'error'); return; }
      this.empForm.foto = await resizeImage(file, 320);
    },

    async attachContract(ev) {
      const file = ev.target.files[0]; ev.target.value = '';
      if (file) this.empForm.kontrak.file = await readFile(file);
    },

    addEmpDoc() { this.empForm.dokumen.push({ id: uid('d'), jenis: 'Sertifikat', nama: '', berlaku: '', file: null }); },
    async attachEmpDoc(ev, doc) {
      const file = ev.target.files[0]; ev.target.value = '';
      if (file) { doc.file = await readFile(file); if (!doc.nama) doc.nama = file.name.replace(/\.[^.]+$/, ''); }
    },

    // ---------------------------------------------------------- unit kerja
    openUnit(u = null) {
      this.unitForm = u ? clone(u) : { id: '', kode: '', nama: '', lokasi: 'Lowland', deskripsi: '', kegiatan: [] };
      this.unitForm.kegiatanText = (this.unitForm.kegiatan || []).join('\n');
      this.unitModal = true;
    },
    saveUnit() {
      const f = this.unitForm;
      if (!f.nama.trim() || !f.kode.trim()) { this.toast('Kode dan nama unit wajib diisi.', 'error'); return; }
      f.kegiatan = f.kegiatanText.split('\n').map((s) => s.trim()).filter(Boolean);
      delete f.kegiatanText;
      if (f.id) { this.db.units[this.db.units.findIndex((u) => u.id === f.id)] = f; this.save(true, `Unit ${f.nama} diperbarui`); }
      else { f.id = uid('u'); this.db.units.push(f); this.save(true, `Unit ${f.nama} ditambahkan`); }
      this.unitModal = false;
    },
    deleteUnit(u) {
      const n = this.db.employees.filter((e) => e.unitId === u.id).length;
      if (n) { this.toast(`Unit masih memiliki ${n} karyawan. Pindahkan dulu karyawannya.`, 'error'); return; }
      this.ask(`Hapus unit kerja "${u.nama}"?`, () => {
        this.db.units = this.db.units.filter((x) => x.id !== u.id);
        this.save(true, `Unit ${u.nama} dihapus`);
      });
    },
    unitHead(u) {
      const rank = ['Supervisor', 'Pengawas', 'Safety Officer', 'HR Officer', 'Staf Logistik', 'Field Officer'];
      const emps = this.db.employees.filter((e) => e.unitId === u.id && e.status === 'Aktif');
      return emps.find((e) => rank.some((r) => e.jabatan.includes(r))) || emps[0];
    },

    // ---------------------------------------------------------- daily report
    get filteredReports() {
      const q = this.repQ.toLowerCase();
      return this.db.reports.filter((r) =>
        (!this.repFrom || r.tanggal >= this.repFrom) && (!this.repTo || r.tanggal <= this.repTo) &&
        (!this.repUnit || r.unitId === this.repUnit) &&
        (!this.repStatus || (this.repStatus === 'Belum Diisi' ? r.draft : !r.draft && r.status === this.repStatus)) &&
        (!this.repKehadiran || (!r.draft && r.kehadiran === this.repKehadiran)) &&
        (this.repVerified === '' || String(r.verified) === this.repVerified) &&
        (!q || [this.empById(r.empId).nama, r.kegiatan, r.lokasi, r.catatan].join(' ').toLowerCase().includes(q)))
        .sort((a, b) => b.tanggal.localeCompare(a.tanggal) || this.empById(a.empId).nama.localeCompare(this.empById(b.empId).nama));
    },
    openReport(r = null, empId = '') {
      const firstEmp = empId || this.monitoredEmps[0]?.id || '';
      this.repForm = r ? clone(r) : { id: '', tanggal: todayISO(), empId: firstEmp, unitId: '', kehadiran: 'Hadir', draft: false, auto: false, lokasi: '', kegiatan: '', jam: 8, progress: 80, kualitas: 4, k3: 'Aman', status: 'Proses', catatan: '', verified: false };
      if (r && r.draft) {
        const last = this.empReports(this.empById(r.empId)).find((x) => !x.draft && x.kehadiran === 'Hadir');
        Object.assign(this.repForm, { lokasi: last ? last.lokasi : '', progress: 80, kualitas: 4 });
      }
      this.repModal = true;
    },
    saveReport() {
      const f = this.repForm;
      const hadir = f.kehadiran === 'Hadir';
      if (!f.empId) { this.toast('Pilih karyawan.', 'error'); return false; }
      if (hadir && !f.kegiatan.trim()) { this.toast('Kegiatan wajib diisi untuk karyawan yang hadir.', 'error'); return false; }
      if (!f.id && this.db.reports.some((r) => r.empId === f.empId && r.tanggal === f.tanggal)) {
        this.toast('Laporan karyawan ini pada tanggal tersebut sudah dibuat sistem. Isi dari daftar laporan.', 'error'); return false;
      }
      const wasDraft = f.draft;
      f.unitId = this.empById(f.empId).unitId;
      f.progress = Number(f.progress); f.kualitas = Number(f.kualitas); f.jam = Number(f.jam);
      if (!hadir) Object.assign(f, { kegiatan: '', lokasi: '', jam: 0, progress: 0, kualitas: 0, k3: 'Aman', status: '' });
      f.draft = false;
      const nama = this.empById(f.empId).nama, tgl = this.fmtDate(f.tanggal);
      if (f.id) { this.db.reports[this.db.reports.findIndex((r) => r.id === f.id)] = f; this.save(true, wasDraft ? `Daily report ${nama} (${tgl}) diisi` : `Daily report ${nama} (${tgl}) diperbarui`); }
      else { f.id = uid('r'); this.db.reports.push(f); this.save(true, `Laporan manual ${nama} (${tgl}) ditambahkan`); }
      this.repModal = false;
      return true;
    },
    // Isi draft berikutnya (urut tanggal lama → baru) — mempercepat pengisian massal
    fillNextDraft() {
      const next = this.db.reports.filter((r) => r.draft).sort((a, b) => a.tanggal.localeCompare(b.tanggal))[0];
      if (next) this.openReport(next); else this.toast('Semua daily report sudah diisi.', 'info');
    },
    verifyReport(r) {
      if (r.draft) { this.toast('Laporan belum diisi — isi dulu sebelum diverifikasi.', 'error'); return; }
      r.verified = !r.verified; this.save(true, `Laporan ${this.empById(r.empId).nama} ${r.verified ? 'diverifikasi' : 'dibatalkan verifikasinya'}`);
    },
    verifyAllVisible() {
      const list = this.filteredReports.filter((r) => !r.verified && !r.draft);
      if (!list.length) { this.toast('Tidak ada laporan yang menunggu verifikasi.', 'info'); return; }
      list.forEach((r) => { r.verified = true; });
      this.save(true, `${list.length} laporan diverifikasi`);
    },
    deleteReport(r) { this.ask('Hapus laporan harian ini?', () => { this.db.reports = this.db.reports.filter((x) => x.id !== r.id); this.save(true, 'Laporan harian dihapus'); }); },
    exportReportsCSV() {
      const head = ['Tanggal', 'NIK', 'Nama', 'Unit', 'Kehadiran', 'Lokasi', 'Kegiatan', 'Jam', 'Progress', 'Kualitas', 'K3', 'Status', 'Terverifikasi', 'Catatan'];
      const rows = this.filteredReports.map((r) => { const e = this.empById(r.empId); return [r.tanggal, e.nik, e.nama, this.unitById(r.unitId).nama, r.draft ? 'Belum diisi' : r.kehadiran, r.lokasi, r.kegiatan, r.jam, r.progress, r.kualitas, r.k3, r.status, r.verified ? 'Ya' : 'Belum', r.catatan]; });
      download(`daily-report_${this.repFrom}_${this.repTo}.csv`, [head, ...rows].map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n'), 'text/csv');
    },

    // ---------------------------------------------------------- dokumen
    docState(berlaku) {
      if (!berlaku) return 'Tanpa Masa Berlaku';
      const s = daysBetween(todayISO(), berlaku);
      return s < 0 ? 'Kedaluwarsa' : s <= 30 ? 'Segera Berakhir' : 'Berlaku';
    },
    get allDocs() {
      const out = [];
      this.db.employees.forEach((e) => {
        if (e.kontrak && (e.kontrak.nomor || e.kontrak.file)) {
          out.push({ key: e.id + '_k', emp: e, jenis: 'Surat Kontrak', nama: `${e.kontrak.jenis} ${e.kontrak.nomor}`, berlaku: e.kontrak.selesai, file: e.kontrak.file, kontrak: true });
        }
        e.dokumen.forEach((d) => out.push({ key: d.id, emp: e, jenis: d.jenis, nama: d.nama, berlaku: d.berlaku, file: d.file, ref: d }));
      });
      return out.map((d) => ({ ...d, state: this.docState(d.berlaku) }));
    },
    get filteredDocs() {
      const q = this.docQ.toLowerCase();
      return this.allDocs.filter((d) => (!this.docJenis || d.jenis === this.docJenis) && (!this.docStatus || d.state === this.docStatus) &&
        (!q || [d.emp.nama, d.nama, d.file?.name].join(' ').toLowerCase().includes(q)))
        .sort((a, b) => (a.berlaku || '9999').localeCompare(b.berlaku || '9999'));
    },
    get docSummary() {
      const all = this.allDocs;
      return Object.keys(DOC_STATUS).map((s) => ({ s, n: all.filter((d) => d.state === s).length, ...DOC_STATUS[s] }));
    },
    openDoc() { this.docForm = { empId: this.db.employees[0]?.id || '', jenis: 'Sertifikat', nama: '', berlaku: '', file: null }; this.docModal = true; },
    async attachDoc(ev) { const f = ev.target.files[0]; ev.target.value = ''; if (f) { this.docForm.file = await readFile(f); if (!this.docForm.nama) this.docForm.nama = f.name.replace(/\.[^.]+$/, ''); } },
    saveDoc() {
      const f = this.docForm;
      if (!f.empId || !f.nama.trim()) { this.toast('Karyawan dan nama dokumen wajib diisi.', 'error'); return; }
      const emp = this.empById(f.empId);
      if (f.jenis === 'Surat Kontrak') {
        emp.kontrak = { ...emp.kontrak, nomor: f.nama, selesai: f.berlaku, file: f.file || emp.kontrak.file };
      } else {
        emp.dokumen.push({ id: uid('d'), jenis: f.jenis, nama: f.nama, berlaku: f.berlaku, file: f.file });
      }
      this.save(true, `Dokumen "${f.nama}" untuk ${emp.nama} diunggah`);
      this.docModal = false;
    },
    deleteDoc(d) {
      if (d.kontrak) { this.toast('Surat kontrak diubah melalui form data karyawan (tab Kontrak).', 'info'); return; }
      this.ask(`Hapus dokumen "${d.nama}"?`, () => { d.emp.dokumen = d.emp.dokumen.filter((x) => x.id !== d.ref.id); this.save(true, `Dokumen "${d.nama}" dihapus`); });
    },
    openFile(file) {
      if (!file) return;
      if (file.data) this.preview = file;
      else this.toast(`Simulasi: "${file.name}" hanya tersimpan sebagai metadata (file contoh / > 400 KB).`, 'info');
    },

    // ---------------------------------------------------------- direktori kontak
    get contacts() {
      const q = this.kontakQ.toLowerCase();
      return this.db.employees.filter((e) => e.status !== 'Nonaktif')
        .filter((e) => !q || [e.nama, e.telp, e.email, this.unitById(e.unitId).nama, e.kontakDarurat.nama].join(' ').toLowerCase().includes(q))
        .sort((a, b) => a.nama.localeCompare(b.nama));
    },
    waLink(t) { return 'https://wa.me/' + String(t || '').replace(/\D/g, '').replace(/^0/, '62'); },

    // ---------------------------------------------------------- pencarian global
    get globalResults() {
      const q = this.globalQ.trim().toLowerCase();
      if (q.length < 2) return [];
      return this.db.employees.filter((e) => [e.nama, e.nik, e.jabatan].join(' ').toLowerCase().includes(q)).slice(0, 6);
    },

    // ---------------------------------------------------------- konten website
    saveContent(section) {
      this.db.content = clone(this.draft);
      this.save(true, `Konten ${section} disimpan`);
    },
    resetDraft() { this.draft = clone(this.db.content); this.toast('Perubahan dibatalkan.', 'info'); },
    addService() { this.draft.layanan.push({ id: uid('s'), judul: 'Layanan Baru', deskripsi: '', ikon: 'fa-briefcase', aktif: true }); },
    moveItem(list, i, dir) { const j = i + dir; if (j < 0 || j >= list.length) return; [list[i], list[j]] = [list[j], list[i]]; },
    async addGallery(ev) {
      const files = [...ev.target.files]; ev.target.value = '';
      for (const f of files) {
        if (!f.type.startsWith('image/')) continue;
        this.draft.galeri.unshift({ id: uid('g'), judul: f.name.replace(/\.[^.]+$/, ''), kategori: 'Konstruksi', gambar: await resizeImage(f, 900), tampil: true });
      }
    },

    // ---------------------------------------------------------- pengaturan
    exportBackup() { download(`backup-ybm-${todayISO()}.json`, JSON.stringify(this.db, null, 2), 'application/json'); this.toast('Backup database diunduh.'); },
    importBackup(ev) {
      const file = ev.target.files[0]; ev.target.value = '';
      if (!file) return;
      const rd = new FileReader();
      rd.onload = () => {
        try {
          const data = JSON.parse(rd.result);
          if (!data.employees || !data.units || !data.reports) throw new Error('format');
          this.db = data; this.draft = clone(data.content); this.save(true, 'Database dipulihkan dari file backup');
        } catch (e) { this.toast('File backup tidak valid.', 'error'); }
      };
      rd.readAsText(file);
    },
    resetDemo() {
      this.ask('Reset seluruh data ke data demo awal? Semua perubahan akan hilang.', () => {
        this.db = seedDatabase(); this.draft = clone(this.db.content); this.detail = null; this.save(true, 'Data demo direset');
      });
    },
    get storageUsed() { try { return this.fmtSize(new Blob([localStorage.getItem(DB_KEY) || '']).size); } catch (e) { return '—'; } },
  }));
});

// ---------------------------------------------------------------- helper file
function readFile(file, maxBytes = 400 * 1024) {
  return new Promise((resolve) => {
    const meta = { name: file.name, size: file.size, type: file.type || 'application/octet-stream', data: null };
    if (file.size > maxBytes) { resolve(meta); return; }
    const rd = new FileReader();
    rd.onload = () => resolve({ ...meta, data: rd.result });
    rd.onerror = () => resolve(meta);
    rd.readAsDataURL(file);
  });
}

function resizeImage(file, max) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const s = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL('image/jpeg', 0.82));
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
    img.src = url;
  });
}

function download(name, text, type) {
  const blob = new Blob(['﻿' + text], { type: type + ';charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
