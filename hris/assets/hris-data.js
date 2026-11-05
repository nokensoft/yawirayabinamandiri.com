/* =====================================================================
   DATA & PENYIMPANAN — Sistem HRIS, Absensi & Payroll YBM (PROTOTYPE)
   ---------------------------------------------------------------------
   Seluruh data disimpan di localStorage browser (simulasi database).
   Data karyawan, gaji, absensi dan payroll adalah DATA DUMMY.

   Absensi memakai KARTU ID BERBARCODE. Scanner di setiap pos membaca
   kartu karyawan lalu mengirim log ke server ("push") lewat jaringan:
     scanner ──POST log scan────►  "inbox" (localStorage: ybm-hris-inbox)
     web    ──ambil & proses────►  tabel scans (db.scans)
   ===================================================================== */
(function (g) {
  'use strict';
  const E = g.PayrollEngine;
  const { iso, parseISO, addDays, pad } = E;

  const DB_KEY = 'ybm-hris-db-v2';
  const SESSION_KEY = 'ybm-hris-session';
  const INBOX_KEY = 'ybm-hris-inbox';

  const uid = (p = 'id') => p + '_' + Math.random().toString(36).slice(2, 9);
  const clone = (o) => JSON.parse(JSON.stringify(o));

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // ------------------------------------------------------------ peran pengguna
  const ROLES = {
    admin: { nama: 'Admin Master', icon: 'fa-user-shield', desc: 'Akses penuh: pengguna, hak akses, aturan, skema database & seluruh modul.', cls: 'bg-ink text-white' },
    operator: { nama: 'Operator HR & Absensi', icon: 'fa-barcode', desc: 'Kelola data karyawan, kartu ID & scanner barcode, kehadiran, lembur & izin/cuti.', cls: 'bg-sky text-white' },
    keuangan: { nama: 'Keuangan / Payroll', icon: 'fa-money-check-dollar', desc: 'Komponen gaji, proses payroll, slip gaji, pembayaran & laporan.', cls: 'bg-emerald-600 text-white' },
    pimpinan: { nama: 'Pimpinan / Direksi', icon: 'fa-user-tie', desc: 'Dashboard eksekutif, persetujuan payroll & laporan analisa.', cls: 'bg-accent text-white' },
    karyawan: { nama: 'Karyawan', icon: 'fa-helmet-safety', desc: 'Portal pribadi: kehadiran, slip gaji & pengajuan izin/cuti.', cls: 'bg-navy text-white' },
  };

  // ------------------------------------------------------------ seed
  function seedDatabase() {
    const rnd = mulberry32(1996);
    const between = (a, b) => Math.round(a + rnd() * (b - a));
    const now = new Date();
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const rules = E.defaultRules();

    const lokasi = [
      { id: 'l1', kode: 'TMK', nama: 'Kantor Timika', tunjangan: 0, keterangan: 'Kantor pusat Jl. Pendidikan' },
      { id: 'l2', kode: 'LWL', nama: 'Lowland (Kuala Kencana / LIP)', tunjangan: 500000, keterangan: 'Area dataran rendah' },
      { id: 'l3', kode: 'HGL', nama: 'Highland (Tembagapura)', tunjangan: 1500000, keterangan: 'Area dataran tinggi' },
      { id: 'l4', kode: 'UGR', nama: 'Underground (Grasberg Block Cave)', tunjangan: 2000000, keterangan: 'Tambang bawah tanah' },
    ];
    const units = [
      { id: 'u1', kode: 'MGT', nama: 'Manajemen & Administrasi' },
      { id: 'u2', kode: 'KEU', nama: 'Keuangan' },
      { id: 'u3', kode: 'HSE', nama: 'K3 / HSE' },
      { id: 'u4', kode: 'SCF', nama: 'Scaffolding' },
      { id: 'u5', kode: 'PCC', nama: 'Painting, Civil & Carpenter' },
      { id: 'u6', kode: 'KON', nama: 'Konstruksi' },
      { id: 'u7', kode: 'MNT', nama: 'Maintenance' },
      { id: 'u8', kode: 'LOG', nama: 'Logistics' },
      { id: 'u9', kode: 'TRN', nama: 'Transportasi / Driver' },
      { id: 'u10', kode: 'IPH', nama: 'Manpower IPHMC' },
      { id: 'u11', kode: 'UGR', nama: 'Underground (RUC)' },
    ];
    const jadwal = [
      { id: 'j1', kode: 'KTR-8', nama: 'Kantor — Basic 8 jam', kategori: 'Kantor', pola: 'mingguan', hari: [1, 2, 3, 4, 5], siklusKerja: 5, siklusLibur: 2, anchor: '2026-01-05', masuk: '08:00', pulang: '17:00', istirahat: 60, jamReguler: 8, mingguKerja: 5, hariKerjaBulan: 21, keterangan: 'Senin–Jumat, 8 jam/hari (basic), istirahat 1 jam.' },
      { id: 'j2', kode: 'PRS-6.1', nama: 'Perusahaan — 6 hari kerja, 1 libur', kategori: 'Lapangan', pola: 'mingguan', hari: [1, 2, 3, 4, 5, 6], siklusKerja: 6, siklusLibur: 1, anchor: '2026-01-05', masuk: '07:00', pulang: '15:00', istirahat: 60, jamReguler: 7, mingguKerja: 6, hariKerjaBulan: 25, keterangan: 'Senin–Sabtu, reguler 7 jam/hari, Minggu libur.' },
      { id: 'j3', kode: 'FCX-6.1', nama: 'Freeport — Roster 6 kerja, 1 libur', kategori: 'Lapangan', pola: 'siklus', hari: [], siklusKerja: 6, siklusLibur: 1, anchor: '2026-01-05', masuk: '06:00', pulang: '14:00', istirahat: 60, jamReguler: 7, mingguKerja: 6, hariKerjaBulan: 26, keterangan: 'Siklus bergulir 6 hari kerja & 1 hari libur, reguler 7 jam/hari. Hari libur tiap karyawan diatur lewat grup roster.' },
    ];
    const y = now.getFullYear();
    const libur = [];
    [y, y + 1].forEach((yr) => [['01-01', 'Tahun Baru Masehi'], ['05-01', 'Hari Buruh Internasional'], ['06-01', 'Hari Lahir Pancasila'], ['08-17', 'Hari Kemerdekaan RI'], ['12-25', 'Hari Raya Natal']]
      .forEach(([md, nama]) => libur.push({ tanggal: `${yr}-${md}`, nama })));
    libur.push({ tanggal: '2026-08-25', nama: 'Maulid Nabi Muhammad SAW (contoh)' });
    libur.push({ tanggal: '2026-04-03', nama: 'Wafat Yesus Kristus' });
    libur.sort((a, b) => a.tanggal.localeCompare(b.tanggal));

    const devices = [
      { id: 'SC01', nama: 'Kantor Timika — Lobi', lokasiId: 'l1', sn: 'BCS-2401-0001', ip: '192.168.10.21', online: true, lastSync: '' },
      { id: 'SC02', nama: 'Workshop Lowland — Pos Security', lokasiId: 'l2', sn: 'BCS-2401-0002', ip: '10.20.1.15', online: true, lastSync: '' },
      { id: 'SC03', nama: 'Camp Tembagapura — Barrack', lokasiId: 'l3', sn: 'BCS-2401-0003', ip: '10.30.5.40', online: true, lastSync: '' },
      { id: 'SC04', nama: 'Portal Underground — Lift Station', lokasiId: 'l4', sn: 'BCS-2401-0004', ip: '10.40.2.11', online: false, lastSync: '' },
    ];

    // [nama, jk, kategori, unit, jabatan, lokasi, jadwal, ptkp, tipe, pokok/upahHarian, tunjJabatan, makan, transport, statusKerja, roster]
    const rows = [
      ['Rina Kurniawati', 'P', 'Kantor', 'u1', 'Manajer HRD & Umum', 'l1', 'j1', 'K/1', 'Bulanan', 11500000, 2000000, 40000, 30000, 'PKWTT'],
      ['Herlina Sitorus', 'P', 'Kantor', 'u2', 'Staf Keuangan / Payroll', 'l1', 'j1', 'TK/0', 'Bulanan', 7200000, 500000, 40000, 30000, 'PKWTT'],
      ['Kevin Manuputty', 'L', 'Kantor', 'u1', 'Staf Administrasi', 'l1', 'j1', 'K/0', 'Bulanan', 6000000, 0, 40000, 30000, 'PKWT'],
      ['Agustina Murib', 'P', 'Kantor', 'u1', 'HR Officer / Operator Absensi', 'l1', 'j1', 'TK/0', 'Bulanan', 6300000, 300000, 40000, 30000, 'PKWT'],
      ['Andi Saputra', 'L', 'Kantor', 'u8', 'Admin Gudang', 'l1', 'j1', 'K/2', 'Bulanan', 5600000, 0, 40000, 30000, 'PKWT'],
      ['Martha Waker', 'P', 'Kantor', 'u2', 'Kasir', 'l1', 'j1', 'K/0', 'Bulanan', 5400000, 0, 40000, 30000, 'PKWT'],
      ['Yohanes Wenda', 'L', 'Lapangan', 'u4', 'Scaffolder Supervisor', 'l3', 'j3', 'K/2', 'Bulanan', 8800000, 1500000, 50000, 0, 'PKWT', 0],
      ['Markus Tabuni', 'L', 'Lapangan', 'u4', 'Scaffolder', 'l3', 'j3', 'K/1', 'Bulanan', 6200000, 0, 50000, 0, 'PKWT', 1],
      ['Petrus Kogoya', 'L', 'Lapangan', 'u4', 'Scaffolder', 'l3', 'j3', 'TK/0', 'Bulanan', 5900000, 0, 50000, 0, 'PKWT', 2],
      ['Daniel Magai', 'L', 'Lapangan', 'u11', 'Miner', 'l4', 'j3', 'K/3', 'Bulanan', 7500000, 0, 50000, 0, 'PKWT', 3],
      ['Yakob Beanal', 'L', 'Lapangan', 'u11', 'Welder', 'l4', 'j3', 'K/1', 'Bulanan', 7800000, 0, 50000, 0, 'PKWT', 4],
      ['Simon Wanimbo', 'L', 'Lapangan', 'u11', 'Operator Alat Berat', 'l4', 'j3', 'K/0', 'Bulanan', 8200000, 0, 50000, 0, 'PKWT', 5],
      ['Obet Tsenawatme', 'L', 'Lapangan', 'u3', 'Safety Officer', 'l3', 'j3', 'TK/1', 'Bulanan', 8500000, 1000000, 50000, 0, 'PKWT', 6],
      ['Frans Rumbiak', 'L', 'Lapangan', 'u6', 'Pengawas Lapangan', 'l2', 'j2', 'K/2', 'Bulanan', 8000000, 1000000, 40000, 25000, 'PKWT'],
      ['Rudi Hartono', 'L', 'Lapangan', 'u6', 'Tukang Sipil', 'l2', 'j2', 'K/1', 'Harian', 220000, 0, 40000, 25000, 'Harian Lepas'],
      ['Budi Santoso', 'L', 'Lapangan', 'u6', 'Operator Alat Berat', 'l2', 'j2', 'K/0', 'Bulanan', 6800000, 0, 40000, 25000, 'PKWT'],
      ['Nikolas Yoman', 'L', 'Lapangan', 'u5', 'Painter', 'l2', 'j2', 'TK/0', 'Harian', 200000, 0, 40000, 25000, 'Harian Lepas'],
      ['Paulus Degei', 'L', 'Lapangan', 'u5', 'Carpenter', 'l2', 'j2', 'K/1', 'Bulanan', 5200000, 0, 40000, 25000, 'PKWT'],
      ['Stevanus Pigai', 'L', 'Lapangan', 'u7', 'Teknisi Listrik', 'l2', 'j2', 'K/0', 'Bulanan', 6500000, 0, 40000, 25000, 'PKWT'],
      ['Thomas Mote', 'L', 'Lapangan', 'u7', 'Teknisi AC', 'l2', 'j2', 'TK/0', 'Bulanan', 5800000, 0, 40000, 25000, 'PKWT'],
      ['Yulianus Gobai', 'L', 'Lapangan', 'u9', 'Driver Bus', 'l2', 'j2', 'K/2', 'Bulanan', 5500000, 0, 40000, 0, 'PKWT'],
      ['Elisa Kum', 'P', 'Lapangan', 'u10', 'Field Officer IPHMC', 'l2', 'j2', 'TK/0', 'Bulanan', 5700000, 0, 40000, 25000, 'PKWT'],
      ['Zakarias Tekege', 'L', 'Lapangan', 'u10', 'Analis Laboratorium', 'l2', 'j2', 'K/1', 'Bulanan', 6400000, 0, 40000, 25000, 'PKWT'],
      ['Lukas Enumbi', 'L', 'Lapangan', 'u9', 'Driver Operasional', 'l2', 'j2', 'TK/0', 'Harian', 210000, 0, 40000, 0, 'Harian Lepas'],
    ];
    const banks = ['Bank Papua', 'BRI', 'Mandiri', 'BNI'];
    const employees = rows.map((r, i) => {
      const [nama, jk, kategori, unitId, jabatan, lokasiId, jadwalId, ptkp, tipeGaji, nominal, tunjJabatan, makan, transport, statusKerja, roster] = r;
      const masuk = i === 23 ? addDays(today, -9) : addDays(today, -between(400, 3600));
      const bank = banks[i % banks.length];
      return {
        id: 'e' + (i + 1), nik: 'YBM-' + (1001 + i), pin: String(1001 + i), nama, jk,
        ktp: '9109' + String(between(10000000, 99999999)) + String(between(1000, 9999)),
        npwp: i % 4 === 3 ? '' : `${between(10, 99)}.${between(100, 999)}.${between(100, 999)}.${between(1, 9)}-953.000`,
        ptkp, kategori, unitId, jabatan, lokasiId, jadwalId, rosterOffset: roster || 0,
        statusKerja, tipeGaji, tglMasuk: iso(masuk), status: 'Aktif',
        telp: '08' + between(11, 13) + between(10000000, 99999999),
        email: nama.split(' ')[0].toLowerCase() + '.' + nama.split(' ')[1].toLowerCase() + '@yawirayabinamandiri.com',
        bank, rekening: String(between(1000000000, 9999999999)), atasNama: nama,
        gaji: { pokok: tipeGaji === 'Bulanan' ? nominal : 0, upahHarian: tipeGaji === 'Harian' ? nominal : 0, tunjJabatan, makan, transport },
        bpjs: { kes: true, tk: true, jp: tipeGaji === 'Bulanan' },
        kartu: i === 23 ? { no: '', versi: 0, status: 'Belum Diterbitkan', terbit: '' } : { no: cardNo(String(1001 + i), 1), versi: 1, status: 'Aktif', terbit: iso(addDays(masuk, 1)) },
      };
    });

    // pengajuan izin / sakit / cuti
    const cur = E.periodOf(iso(today), rules.cutoff);
    const pPrev = E.periodRange(E.shiftPeriod(cur, -1), rules.cutoff);
    const pPrev2 = E.periodRange(E.shiftPeriod(cur, -2), rules.cutoff);
    const pCur = E.periodRange(cur, rules.cutoff);
    const dPrev = (n) => iso(addDays(parseISO(pPrev.from), n));
    const leaves = [
      { id: uid('lv'), empId: 'e9', jenis: 'Sakit', dari: dPrev(8), sampai: dPrev(9), ket: 'Demam, surat dokter klinik terlampir', status: 'Disetujui', oleh: 'Agustina Murib', diajukan: dPrev(8) },
      { id: uid('lv'), empId: 'e20', jenis: 'Cuti', dari: dPrev(15), sampai: dPrev(17), ket: 'Cuti tahunan — urusan keluarga di Wamena', status: 'Disetujui', oleh: 'Agustina Murib', diajukan: dPrev(5) },
      { id: uid('lv'), empId: 'e3', jenis: 'Izin', dari: iso(addDays(parseISO(pPrev2.from), 12)), sampai: iso(addDays(parseISO(pPrev2.from), 12)), ket: 'Mengurus dokumen kependudukan', status: 'Disetujui', oleh: 'Agustina Murib', diajukan: iso(addDays(parseISO(pPrev2.from), 10)) },
      { id: uid('lv'), empId: 'e17', jenis: 'Izin', dari: iso(addDays(parseISO(pCur.from), 3)), sampai: iso(addDays(parseISO(pCur.from), 3)), ket: 'Acara adat keluarga', status: 'Disetujui', oleh: 'Agustina Murib', diajukan: iso(addDays(parseISO(pCur.from), 1)) },
      { id: uid('lv'), empId: 'e5', jenis: 'Cuti', dari: iso(addDays(today, 4)), sampai: iso(addDays(today, 6)), ket: 'Cuti tahunan', status: 'Disetujui', oleh: 'Agustina Murib', diajukan: iso(addDays(today, -3)) },
      { id: uid('lv'), empId: 'e11', jenis: 'Sakit', dari: iso(addDays(today, -1)), sampai: iso(addDays(today, -1)), ket: 'Sakit gigi, berobat ke RS', status: 'Menunggu', oleh: '', diajukan: iso(today) },
      { id: uid('lv'), empId: 'e22', jenis: 'Izin', dari: iso(addDays(today, 2)), sampai: iso(addDays(today, 2)), ket: 'Mengantar anak ke rumah sakit', status: 'Menunggu', oleh: '', diajukan: iso(today) },
    ];
    const onLeave = (empId, ds) => leaves.some((l) => l.empId === empId && l.status === 'Disetujui' && ds >= l.dari && ds <= l.sampai);

    // log scanner kartu barcode
    const devByLok = { l1: 'SC01', l2: 'SC02', l3: 'SC03', l4: 'SC04' };
    const jById = Object.fromEntries(jadwal.map((j) => [j.id, j]));
    const hol = Object.fromEntries(libur.map((l) => [l.tanggal, l.nama]));
    const scans = [];
    let sid = 0;
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const tstr = (ds, m) => `${ds} ${pad(Math.floor(m / 60))}:${pad(Math.floor(m % 60))}:${pad(between(0, 59))}`;
    const push = (e, ds, m) => {
      if (ds === iso(today) && m > nowMin) return;
      scans.push({ id: 's' + (++sid), pin: e.pin, kode: e.kartu.no, empId: e.id, t: tstr(ds, m), dev: devByLok[e.lokasiId], verify: 'Kartu', src: 'Scanner' });
    };
    for (let d = parseISO(pPrev2.from); d <= today; d = addDays(d, 1)) {
      const ds = iso(d);
      employees.forEach((e) => {
        if (ds < e.tglMasuk || onLeave(e.id, ds)) return;
        const j = jById[e.jadwalId];
        const sched = !hol[ds] && E.isScheduled(e, j, ds);
        const lap = e.kategori === 'Lapangan';
        if (sched) {
          if (rnd() < 0.012 && ds !== iso(today)) return; // alpa
          const masuk = E.toMin(j.masuk), pulang = E.toMin(j.pulang);
          const inM = rnd() < 0.07 ? masuk + between(11, 45) : masuk - between(5, 35);
          let outM = pulang + between(1, 14);
          if (rnd() < (lap ? 0.24 : 0.08)) outM = pulang + between(2, lap ? 8 : 4) * 30 + between(0, 20);
          push(e, ds, inM);
          if (rnd() < 0.004 && ds !== iso(today)) return; // lupa absen pulang
          push(e, ds, outM);
        } else if (lap && rnd() < 0.06) {
          const inM = E.toMin(j.masuk) - between(0, 20);
          push(e, ds, inM);
          push(e, ds, inM + 60 + between(4, 9) * 60 + between(0, 25));
        }
      });
    }
    scans.sort((a, b) => a.t.localeCompare(b.t));
    devices.forEach((dv) => { const last = [...scans].reverse().find((s) => s.dev === dv.id); dv.lastSync = dv.online ? new Date().toISOString() : (last ? last.t.replace(' ', 'T') : ''); });

    const users = [
      { id: 'usr1', email: 'admin@yawirayabinamandiri.com', nama: 'Administrator Sistem', role: 'admin', empId: '', aktif: true, password: 'demo123' },
      { id: 'usr2', email: 'operator@yawirayabinamandiri.com', nama: 'Agustina Murib', role: 'operator', empId: 'e4', aktif: true, password: 'demo123' },
      { id: 'usr3', email: 'keuangan@yawirayabinamandiri.com', nama: 'Herlina Sitorus', role: 'keuangan', empId: 'e2', aktif: true, password: 'demo123' },
      { id: 'usr4', email: 'pimpinan@yawirayabinamandiri.com', nama: 'Direktur Utama', role: 'pimpinan', empId: '', aktif: true, password: 'demo123' },
      { id: 'usr5', email: 'yohanes.wenda@yawirayabinamandiri.com', nama: 'Yohanes Wenda', role: 'karyawan', empId: 'e7', aktif: true, password: 'demo123' },
    ];

    const db = {
      version: 2, createdAt: new Date().toISOString(),
      perusahaan: { nama: 'PT. Yawiraya Bina Mandiri', alamat: 'Jl. Pendidikan Jalur 1-5a, Otomona, Mimika Baru, Timika, Papua 99910', telp: '(0901) 3265824', email: 'pt.yawiraya@yahoo.com', npwp: '01.234.567.8-953.000 (contoh)' },
      rules, users, units, lokasi, jadwal, libur, devices, employees, scans, leaves,
      otApprovals: {}, adjustments: [], runs: [], activity: [], pushLog: [],
    };

    // persetujuan lembur: periode lalu semua disetujui; periode berjalan sebagian
    const ctx = E.buildContext(db);
    const curFrom = pCur.from;
    const recent = iso(addDays(today, -3));
    employees.forEach((e) => {
      E.rangeDays(pPrev2.from, iso(today)).forEach((ds) => {
        const r = E.dayRecord(e, ds, ctx);
        if (!r || !r.ot) return;
        const by = 'Agustina Murib';
        if (ds < curFrom) db.otApprovals[e.id + '|' + ds] = { status: 'Disetujui', jam: Math.min(r.ot, r.otJenis === 'Hari Kerja' ? 4 : r.ot), oleh: by, at: ds + 'T17:30:00' };
        else if (ds < recent) {
          const x = rnd();
          if (x < 0.85) db.otApprovals[e.id + '|' + ds] = { status: 'Disetujui', jam: Math.min(r.ot, 4), oleh: by, at: ds + 'T17:30:00' };
          else if (x < 0.92) db.otApprovals[e.id + '|' + ds] = { status: 'Ditolak', jam: 0, oleh: by, at: ds + 'T17:30:00', catatan: 'Tidak ada SPL / perintah lembur' };
        }
      });
    });

    // penyesuaian (insentif / kasbon)
    const p1 = E.shiftPeriod(cur, -1), p2 = E.shiftPeriod(cur, -2);
    db.adjustments.push(
      { id: uid('adj'), period: p2, empId: 'e7', jenis: 'Pendapatan', nama: 'Insentif Kinerja Proyek', nilai: 750000 },
      { id: uid('adj'), period: p1, empId: 'e7', jenis: 'Pendapatan', nama: 'Insentif Kinerja Proyek', nilai: 750000 },
      { id: uid('adj'), period: p1, empId: 'e15', jenis: 'Potongan', nama: 'Cicilan Kasbon', nilai: 500000 },
      { id: uid('adj'), period: p1, empId: 'e13', jenis: 'Pendapatan', nama: 'Bonus Safety Award', nilai: 1000000 },
      { id: uid('adj'), period: cur, empId: 'e12', jenis: 'Pendapatan', nama: 'Insentif Shift Underground', nilai: 600000 },
      { id: uid('adj'), period: cur, empId: 'e15', jenis: 'Potongan', nama: 'Cicilan Kasbon', nilai: 500000 },
    );

    // payroll: 2 periode lalu sudah dibayar, 1 periode lalu menunggu persetujuan pimpinan
    const mk = (period, status) => {
      const run = buildRun(db, period, 'Herlina Sitorus');
      const r = E.periodRange(period, rules.cutoff);
      const t0 = r.to + 'T10:00:00';
      run.createdAt = t0;
      run.history = [{ status: 'Draft', oleh: 'Herlina Sitorus', role: 'keuangan', at: t0, catatan: 'Payroll dihitung dari data absensi kartu barcode' }];
      run.history.push({ status: 'Diajukan', oleh: 'Herlina Sitorus', role: 'keuangan', at: iso(addDays(parseISO(r.to), 1)) + 'T09:00:00', catatan: 'Mohon persetujuan' });
      if (status === 'Dibayar') {
        run.history.push({ status: 'Disetujui', oleh: 'Direktur Utama', role: 'pimpinan', at: iso(addDays(parseISO(r.to), 2)) + 'T14:00:00', catatan: 'Disetujui' });
        run.history.push({ status: 'Dibayar', oleh: 'Herlina Sitorus', role: 'keuangan', at: iso(addDays(parseISO(r.to), 5)) + 'T10:00:00', catatan: 'Transfer bank batch #' + period.replace('-', '') });
        run.paidAt = iso(addDays(parseISO(r.to), 5));
      }
      run.status = status;
      return run;
    };
    db.runs.push(mk(p1, 'Diajukan'), mk(p2, 'Dibayar'));
    db.activity.push({ t: new Date().toISOString(), user: 'Sistem', role: 'admin', msg: 'Database simulasi dibuat dengan data dummy' });
    return db;
  }

  // ------------------------------------------------------------ payroll run
  function buildRun(db, period, oleh) {
    const ctx = E.buildContext(db);
    const r = E.periodRange(period, db.rules.cutoff);
    const lines = db.employees
      .filter((e) => e.status === 'Aktif' && e.tglMasuk <= r.to)
      .map((e) => E.calcSlip(e, r.from, r.to, ctx, db.adjustments.filter((a) => a.period === period && a.empId === e.id)));
    return { id: uid('run'), period, from: r.from, to: r.to, status: 'Draft', createdBy: oleh, createdAt: new Date().toISOString(), calculatedAt: new Date().toISOString(), history: [], lines, totals: runTotals(lines), rulesSnapshot: clone(db.rules), paidAt: '' };
  }
  function runTotals(lines) {
    const sum = (f) => lines.reduce((a, l) => a + f(l), 0);
    return {
      karyawan: lines.length,
      pendapatan: sum((l) => l.totalPendapatan), potongan: sum((l) => l.totalPotongan), thp: sum((l) => l.thp),
      perusahaan: sum((l) => l.totalPerusahaan), biaya: sum((l) => l.biaya), lembur: sum((l) => l.nilaiLembur), jamLembur: sum((l) => l.jamLembur),
      pph: sum((l) => l.pph.nilai), pokok: sum((l) => (l.pendapatan.find((p) => p.kode === 'GP') || {}).nilai || 0),
    };
  }

  // ------------------------------------------------------------ simpan / muat
  function loadDB() {
    let db = null;
    try { db = JSON.parse(localStorage.getItem(DB_KEY) || 'null'); } catch (e) { db = null; }
    if (!db || db.version !== 2 || !Array.isArray(db.employees) || !Array.isArray(db.scans)) {
      db = seedDatabase();
      saveDB(db);
    }
    db.rules = Object.assign(E.defaultRules(), db.rules || {});
    ['otApprovals'].forEach((k) => { if (!db[k]) db[k] = {}; });
    ['adjustments', 'runs', 'activity', 'leaves', 'pushLog'].forEach((k) => { if (!Array.isArray(db[k])) db[k] = []; });
    return db;
  }
  function saveDB(db) { localStorage.setItem(DB_KEY, JSON.stringify(db)); }

  // ------------------------------------------------------------ kartu ID berbarcode
  // Nomor kartu = YBM + ID absensi + versi kartu (2 digit). Kartu pengganti menaikkan versi,
  // sehingga kartu lama yang hilang otomatis tidak berlaku.
  function cardNo(pin, versi) { return 'YBM' + pin + String(versi).padStart(2, '0'); }
  // pemilik kartu berdasarkan kode barcode (atau ID absensi untuk input manual) + alasan bila ditolak
  function cardOwner(db, kode) {
    const k = String(kode || '').trim().toUpperCase();
    if (!k) return { emp: null, alasan: 'Kode kosong' };
    const e = db.employees.find((x) => x.kartu && x.kartu.no === k);
    if (e) {
      if (e.status !== 'Aktif') return { emp: e, alasan: 'Karyawan nonaktif' };
      if (e.kartu.status !== 'Aktif') return { emp: e, alasan: 'Kartu ' + e.kartu.status.toLowerCase() };
      return { emp: e, alasan: '' };
    }
    const old = db.employees.find((x) => x.kartu && x.kartu.no && k.startsWith('YBM' + x.pin) && k.length === x.kartu.no.length);
    if (old) return { emp: old, alasan: 'Kartu lama sudah diganti' };
    const byPin = db.employees.find((x) => x.pin === k && x.status === 'Aktif');
    if (byPin) return { emp: byPin, alasan: '' };
    return { emp: null, alasan: 'Kartu tidak terdaftar' };
  }

  // ------------------------------------------------------------ "API" scanner kartu
  // Mesin mengirim log (push) → disimpan ke inbox; aplikasi web mengambil & memprosesnya.
  function readInbox() { try { return JSON.parse(localStorage.getItem(INBOX_KEY) || '[]'); } catch (e) { return []; } }
  function devicePush(records) {
    const box = readInbox();
    records.forEach((r) => box.push(r));
    localStorage.setItem(INBOX_KEY, JSON.stringify(box));
  }
  // dipanggil aplikasi web: pindahkan isi inbox ke db.scans; kembalikan log yang diterima
  function consumeInbox(db) {
    const box = readInbox();
    if (!box.length) return [];
    const have = new Set(db.scans.map((s) => s.id));
    const got = [];
    box.forEach((r) => {
      if (have.has(r.id)) return;
      const e = cardOwner(db, r.kode || r.pin).emp;
      const s = { id: r.id, pin: e ? e.pin : r.pin || '', kode: r.kode || '', empId: e ? e.id : '', t: r.t, dev: r.dev, verify: r.verify || 'Kartu', src: 'Push scanner' };
      db.scans.push(s); have.add(s.id); got.push(s);
      const dv = db.devices.find((d) => d.id === r.dev);
      if (dv) dv.lastSync = new Date().toISOString();
    });
    if (got.length) {
      db.pushLog.unshift({ at: new Date().toISOString(), dev: got[0].dev, n: got.length, payload: box.slice(-3) });
      db.pushLog = db.pushLog.slice(0, 20);
    }
    // hapus hanya yang sudah diproses (mesin bisa menambah log di saat bersamaan)
    const done = new Set(box.map((r) => r.id));
    localStorage.setItem(INBOX_KEY, JSON.stringify(readInbox().filter((r) => !done.has(r.id))));
    return got;
  }

  // Log scanner offline (file .csv/.txt dari scanner genggam): KODE_KARTU;YYYY-MM-DD HH:MM:SS
  // pemisah boleh titik koma, koma atau tab. Kolom pertama boleh kode kartu atau ID absensi.
  function parseAttlog(text) {
    return text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).map((l) => {
      const p = l.split(/\t|,|;|\s{2,}/).map((x) => x.trim());
      let pin = (p[0] || '').toUpperCase(), t = p[1];
      if (p.length >= 3 && /^\d{4}-\d{2}-\d{2}$/.test(p[1]) && /^\d{2}:\d{2}/.test(p[2])) t = p[1] + ' ' + p[2];
      if (!/^[A-Z0-9-]+$/.test(pin || '') || !/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}(:\d{2})?$/.test(t || '')) return { ok: false, raw: l };
      if (t.length === 16) t += ':00';
      return { ok: true, pin, t, raw: l };
    });
  }

  g.HRIS = { DB_KEY, SESSION_KEY, INBOX_KEY, ROLES, uid, clone, seedDatabase, buildRun, runTotals, loadDB, saveDB, readInbox, devicePush, consumeInbox, parseAttlog, cardNo, cardOwner };
})(window);
