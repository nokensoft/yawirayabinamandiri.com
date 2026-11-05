/* =====================================================================
   MESIN RUMUS PAYROLL & ABSENSI — PT. Yawiraya Bina Mandiri (PROTOTYPE)
   ---------------------------------------------------------------------
   Fungsi murni (tanpa UI) yang dipakai oleh aplikasi, simulator mesin
   scanner kartu dan halaman cetak. Semua parameter diambil dari db.rules
   sehingga dapat disesuaikan tanpa mengubah kode.

   Acuan umum (wajib diverifikasi ulang dengan HR / konsultan pajak):
   - Upah lembur  : PP 35/2021 & Kepmenakertrans 102/2004
                    upah sejam = 1/173 x upah sebulan
                    hari kerja  : jam ke-1 x1,5 ; jam berikutnya x2
                    hari libur (6 hari kerja/minggu): jam 1-7 x2, jam 8 x3, jam 9-10 x4
                    hari libur (5 hari kerja/minggu): jam 1-8 x2, jam 9 x3, jam 10-11 x4
   - BPJS         : Kesehatan 1% / 4%, JHT 2% / 3,7%, JP 1% / 2%, JKK, JKM 0,3%
   - PPh 21       : Tarif Efektif Rata-rata (TER) bulanan PP 58/2023
   ===================================================================== */
(function (g) {
  'use strict';

  // ------------------------------------------------------------ tanggal
  const pad = (n) => String(n).padStart(2, '0');
  const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parseISO = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const daysBetween = (a, b) => Math.round((parseISO(b) - parseISO(a)) / 86400000);
  const toMin = (hm) => { if (!hm) return 0; const [h, m, s] = hm.split(':').map(Number); return h * 60 + (m || 0) + (s || 0) / 60; };
  const fromMin = (m) => `${pad(Math.floor(m / 60))}:${pad(Math.round(m % 60))}`;
  const todayISO = () => iso(new Date());
  const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

  // Periode payroll "YYYY-MM". cutoff = 0 → 1 s/d akhir bulan;
  // cutoff = 20 → tgl 21 bulan sebelumnya s/d tgl 20 bulan berjalan.
  function periodRange(ym, cutoff) {
    const [y, m] = ym.split('-').map(Number);
    if (!cutoff) return { from: iso(new Date(y, m - 1, 1)), to: iso(new Date(y, m, 0)) };
    return { from: iso(new Date(y, m - 2, cutoff + 1)), to: iso(new Date(y, m - 1, cutoff)) };
  }
  function periodOf(ds, cutoff) {
    const d = parseISO(ds);
    if (cutoff && d.getDate() > cutoff) d.setMonth(d.getMonth() + 1, 1);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
  }
  const periodLabel = (ym) => { const [y, m] = ym.split('-').map(Number); return `${BULAN[m - 1]} ${y}`; };
  const shiftPeriod = (ym, n) => { const [y, m] = ym.split('-').map(Number); const d = new Date(y, m - 1 + n, 1); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`; };

  // ------------------------------------------------------------ PPh 21 TER (PP 58/2023)
  // [batas atas penghasilan bruto bulanan, tarif %]
  const TER = {
    A: [[5400000, 0], [5650000, 0.25], [5950000, 0.5], [6300000, 0.75], [6750000, 1], [7500000, 1.25], [8550000, 1.5], [9650000, 1.75], [10050000, 2], [10350000, 2.25], [10700000, 2.5], [11050000, 3], [11600000, 3.5], [12500000, 4], [13750000, 5], [15100000, 6], [16950000, 7], [19750000, 8], [24150000, 9], [26450000, 10], [28000000, 11], [30050000, 12], [32400000, 13], [35400000, 14], [39100000, 15], [43850000, 16], [47800000, 17], [51400000, 18], [56300000, 19], [62200000, 20], [68600000, 21], [77500000, 22], [89000000, 23], [103000000, 24], [125000000, 25], [157000000, 26], [206000000, 27], [337000000, 28], [454000000, 29], [550000000, 30], [695000000, 31], [910000000, 32], [1400000000, 33], [Infinity, 34]],
    B: [[6200000, 0], [6500000, 0.25], [6850000, 0.5], [7300000, 0.75], [9200000, 1], [10750000, 1.5], [11250000, 2], [11600000, 2.5], [12600000, 3], [13600000, 4], [14950000, 5], [16400000, 6], [18450000, 7], [21850000, 8], [26000000, 9], [27700000, 10], [29350000, 11], [31450000, 12], [33950000, 13], [37100000, 14], [41100000, 15], [45800000, 16], [49500000, 17], [53800000, 18], [58500000, 19], [64000000, 20], [71000000, 21], [80000000, 22], [93000000, 23], [109000000, 24], [129000000, 25], [163000000, 26], [211000000, 27], [374000000, 28], [459000000, 29], [555000000, 30], [704000000, 31], [957000000, 32], [1405000000, 33], [Infinity, 34]],
    C: [[6600000, 0], [6950000, 0.25], [7350000, 0.5], [7800000, 0.75], [8850000, 1], [9800000, 1.25], [10950000, 1.5], [11200000, 1.75], [12050000, 2], [12950000, 3], [14150000, 4], [15550000, 5], [17050000, 6], [19500000, 7], [22700000, 8], [26600000, 9], [28100000, 10], [30100000, 11], [32600000, 12], [35400000, 13], [38900000, 14], [43000000, 15], [47400000, 16], [51200000, 17], [55800000, 18], [60400000, 19], [66700000, 20], [74500000, 21], [83200000, 22], [95600000, 23], [110000000, 24], [134000000, 25], [169000000, 26], [221000000, 27], [390000000, 28], [463000000, 29], [561000000, 30], [709000000, 31], [965000000, 32], [1419000000, 33], [Infinity, 34]],
  };
  const PTKP_KATEGORI = { 'TK/0': 'A', 'TK/1': 'A', 'K/0': 'A', 'TK/2': 'B', 'TK/3': 'B', 'K/1': 'B', 'K/2': 'B', 'K/3': 'C' };
  function terRate(ptkp, bruto) {
    const cat = PTKP_KATEGORI[ptkp] || 'A';
    const row = TER[cat].find(([max]) => bruto <= max);
    return { kategori: cat, tarif: row[1] };
  }

  // ------------------------------------------------------------ aturan default
  function defaultRules() {
    return {
      cutoff: 20,                    // tanggal tutup buku absensi (0 = akhir bulan)
      toleransiTerlambat: 10,        // menit
      lembur: {
        pembagi: 173,                // upah sejam = upah sebulan / 173
        dasar: 'pokok+tetap',        // 'pokok' | 'pokok+tetap'
        minimal: 0.5,                // jam; di bawah ini tidak dihitung
        pembulatan: 0.5,             // dibulatkan ke bawah per 0,5 jam
        maksHarian: 4,               // batas PP 35/2021 (peringatan)
        butuhPersetujuan: true,      // lembur dibayar setelah disetujui (SPL)
        kerja: [{ sd: 1, kali: 1.5 }, { sd: 99, kali: 2 }],
        libur6: [{ sd: 7, kali: 2 }, { sd: 8, kali: 3 }, { sd: 99, kali: 4 }],
        libur5: [{ sd: 8, kali: 2 }, { sd: 9, kali: 3 }, { sd: 99, kali: 4 }],
      },
      bpjs: {
        kesPekerja: 1, kesPerusahaan: 4, kesMaks: 12000000,
        jhtPekerja: 2, jhtPerusahaan: 3.7,
        jpPekerja: 1, jpPerusahaan: 2, jpMaks: 10547400,
        jkm: 0.3, jkkKantor: 0.24, jkkLapangan: 1.27,
      },
      pph: { metode: 'gross' },      // 'gross' (dipotong dari karyawan) | 'ditanggung' (beban perusahaan)
      potongAlpa: true,              // potong upah per hari alpa
      umk: 4500000,                  // CONTOH upah minimum acuan — sesuaikan UMK Mimika berlaku
    };
  }

  // ------------------------------------------------------------ jadwal
  function isScheduled(emp, j, ds) {
    if (!j) return false;
    if (j.pola === 'siklus') {
      const c = j.siklusKerja + j.siklusLibur;
      const n = daysBetween(j.anchor, ds) + (Number(emp.rosterOffset) || 0);
      return ((n % c) + c) % c < j.siklusKerja;
    }
    return j.hari.includes(parseISO(ds).getDay());
  }

  // ------------------------------------------------------------ konteks perhitungan
  // Indeks sekali bangun agar perhitungan harian cepat.
  function buildContext(db) {
    const scans = {};
    db.scans.forEach((s) => {
      const k = s.empId + '|' + s.t.slice(0, 10);
      (scans[k] = scans[k] || []).push(s.t.slice(11));
    });
    Object.values(scans).forEach((a) => a.sort());
    const leaves = {};
    db.leaves.filter((l) => l.status === 'Disetujui').forEach((l) => (leaves[l.empId] = leaves[l.empId] || []).push(l));
    const hol = {}; db.libur.forEach((l) => { hol[l.tanggal] = l.nama; });
    const jadwal = {}; db.jadwal.forEach((j) => { jadwal[j.id] = j; });
    const now = new Date();
    return { db, scans, leaves, hol, jadwal, ot: db.otApprovals || {}, rules: db.rules, today: iso(now), nowMin: now.getHours() * 60 + now.getMinutes() };
  }

  // ------------------------------------------------------------ rekam kehadiran 1 hari
  function dayRecord(emp, ds, ctx) {
    if (emp.tglMasuk && ds < emp.tglMasuk) return null;
    const j = ctx.jadwal[emp.jadwalId];
    const hol = ctx.hol[ds] || '';
    const sched = !hol && isScheduled(emp, j, ds);
    const sc = ctx.scans[emp.id + '|' + ds] || [];
    const leave = (ctx.leaves[emp.id] || []).find((l) => ds >= l.dari && ds <= l.sampai);
    const r = {
      ds, sched, hol, jenisHari: hol ? 'Libur Nasional' : sched ? 'Kerja' : 'Libur',
      masuk: sc[0] ? sc[0].slice(0, 5) : '', pulang: sc.length > 1 ? sc[sc.length - 1].slice(0, 5) : '',
      scans: sc.length, late: 0, kerja: 0, otRaw: 0, ot: 0, otJenis: '', otStatus: '', otJam: 0, otWarn: false, status: '', kode: '',
    };
    if (ds > ctx.today) { r.status = sched ? 'Terjadwal' : r.jenisHari; r.kode = sched ? '' : hol ? 'LN' : 'L'; return r; }
    if (leave && sched) { r.status = leave.jenis; r.kode = { Izin: 'I', Sakit: 'S', Cuti: 'C', Dinas: 'D' }[leave.jenis] || 'I'; return r; }
    if (!sc.length) {
      if (!sched) { r.status = r.jenisHari; r.kode = hol ? 'LN' : 'L'; }
      else if (ds === ctx.today) { r.status = 'Belum Absen'; r.kode = '·'; }
      else { r.status = 'Alpa'; r.kode = 'A'; }
      return r;
    }
    const rules = ctx.rules;
    const inM = toMin(sc[0]);
    if (sched) r.late = Math.max(0, Math.round(inM - toMin(j.masuk)));
    if (sc.length === 1) {
      r.status = ds === ctx.today ? 'Sedang Bekerja' : 'Tidak Lengkap';
      r.kode = ds === ctx.today ? 'H' : 'TL';
      return r;
    }
    const outM = toMin(sc[sc.length - 1]);
    const dur = outM - inM;
    r.kerja = Math.max(0, Math.round(dur - (dur > 300 ? j.istirahat : 0)));
    if (sched) {
      r.status = r.late > rules.toleransiTerlambat ? 'Terlambat' : 'Hadir';
      r.kode = r.late > rules.toleransiTerlambat ? 'T' : 'H';
      r.otRaw = Math.max(0, outM - toMin(j.pulang)) / 60;
      r.otJenis = 'Hari Kerja';
    } else {
      r.status = 'Masuk Hari Libur'; r.kode = 'HL';
      r.otRaw = r.kerja / 60;
      r.otJenis = hol ? 'Libur Nasional' : 'Hari Libur';
    }
    const L = rules.lembur;
    r.ot = r.otRaw >= L.minimal ? Math.floor(r.otRaw / L.pembulatan + 1e-9) * L.pembulatan : 0;
    if (r.ot) {
      r.otWarn = sched && r.ot > L.maksHarian;
      const ap = ctx.ot[emp.id + '|' + ds];
      if (!L.butuhPersetujuan) { r.otStatus = 'Disetujui'; r.otJam = r.ot; }
      else if (ap) { r.otStatus = ap.status; r.otJam = ap.status === 'Disetujui' ? Number(ap.jam ?? r.ot) : 0; }
      else { r.otStatus = 'Menunggu'; r.otJam = 0; }
    }
    return r;
  }

  function rangeDays(from, to) { const out = []; for (let d = parseISO(from); iso(d) <= to; d = addDays(d, 1)) out.push(iso(d)); return out; }

  // ------------------------------------------------------------ lembur → jam ekuivalen
  function overtimeTiers(jam, jenis, mingguKerja, rules) {
    const L = rules.lembur;
    const tiers = jenis === 'Hari Kerja' ? L.kerja : mingguKerja === 5 ? L.libur5 : L.libur6;
    const rincian = []; let prev = 0;
    for (const t of tiers) {
      const h = Math.min(jam, t.sd) - prev;
      if (h > 0) rincian.push({ jam: h, kali: t.kali, ekuivalen: h * t.kali });
      prev = t.sd;
      if (jam <= t.sd) break;
    }
    return { rincian, ekuivalen: rincian.reduce((a, x) => a + x.ekuivalen, 0) };
  }

  // ------------------------------------------------------------ ringkasan kehadiran periode
  function attendanceSummary(emp, from, to, ctx) {
    const j = ctx.jadwal[emp.jadwalId];
    const s = { jadwalPeriode: 0, jadwal: 0, hadir: 0, terlambat: 0, menitTerlambat: 0, tidakLengkap: 0, alpa: 0, izin: 0, sakit: 0, cuti: 0, dinas: 0, libur: 0, hariLibur: 0, belum: 0, jamKerja: 0, days: [], lembur: [] };
    rangeDays(from, to).forEach((ds) => {
      if (!ctx.hol[ds] && isScheduled(emp, j, ds)) s.jadwalPeriode++;
      const r = dayRecord(emp, ds, ctx);
      if (!r) return;
      s.days.push(r);
      if (r.sched) s.jadwal++;
      switch (r.status) {
        case 'Hadir': s.hadir++; break;
        case 'Terlambat': s.hadir++; s.terlambat++; s.menitTerlambat += r.late; break;
        case 'Tidak Lengkap': s.hadir++; s.tidakLengkap++; break;
        case 'Sedang Bekerja': s.hadir++; break;
        case 'Alpa': s.alpa++; break;
        case 'Izin': s.izin++; break;
        case 'Sakit': s.sakit++; break;
        case 'Cuti': s.cuti++; break;
        case 'Dinas': s.dinas++; s.hadir++; break;
        case 'Masuk Hari Libur': s.hariLibur++; break;
        case 'Belum Absen': case 'Terjadwal': s.belum++; break;
        default: s.libur++;
      }
      s.jamKerja += r.kerja / 60;
      if (r.ot) s.lembur.push(r);
    });
    return s;
  }

  // ------------------------------------------------------------ slip gaji 1 karyawan
  const R = (n) => Math.round(n);
  function calcSlip(emp, from, to, ctx, adjustments = []) {
    const rules = ctx.rules;
    const db = ctx.db;
    const j = ctx.jadwal[emp.jadwalId] || {};
    const unit = db.units.find((u) => u.id === emp.unitId) || {};
    const lok = db.lokasi.find((l) => l.id === emp.lokasiId) || {};
    const gj = emp.gaji;
    const a = attendanceSummary(emp, from, to, ctx);
    const hariBayar = a.hadir; // hadir + terlambat + tidak lengkap + dinas
    const tunjLokasi = Number(lok.tunjangan) || 0;
    const tetap = (Number(gj.tunjJabatan) || 0) + tunjLokasi;

    // gaji pokok (bulanan pro-rata jika bergabung di tengah periode; harian x hari dibayar)
    let pokok, ketPokok;
    if (emp.tipeGaji === 'Harian') {
      pokok = (Number(gj.upahHarian) || 0) * (hariBayar + a.cuti + a.sakit);
      ketPokok = `${hariBayar + a.cuti + a.sakit} hari x ${fmt(gj.upahHarian)}`;
    } else {
      pokok = Number(gj.pokok) || 0;
      ketPokok = 'Bulanan';
      if (a.jadwal < a.jadwalPeriode && a.jadwalPeriode) {
        pokok = pokok * (a.jadwal / a.jadwalPeriode);
        ketPokok = `Pro-rata ${a.jadwal}/${a.jadwalPeriode} hari`;
      }
    }
    const upahBulanan = emp.tipeGaji === 'Harian' ? (Number(gj.upahHarian) || 0) * (j.hariKerjaBulan || 25) : Number(gj.pokok) || 0;
    const upahTetap = upahBulanan + tetap;
    const dasarLembur = rules.lembur.dasar === 'pokok' ? upahBulanan : upahTetap;
    const upahJam = dasarLembur / rules.lembur.pembagi;

    // lembur
    const lembur = a.lembur.filter((r) => r.otJam > 0).map((r) => {
      const t = overtimeTiers(r.otJam, r.otJenis, j.mingguKerja, rules);
      return { ds: r.ds, jenis: r.otJenis, masuk: r.masuk, pulang: r.pulang, jam: r.otJam, rincian: t.rincian, ekuivalen: t.ekuivalen, nilai: R(t.ekuivalen * upahJam) };
    });
    const nilaiLembur = lembur.reduce((x, l) => x + l.nilai, 0);
    const jamLembur = lembur.reduce((x, l) => x + l.jam, 0);
    const lemburPending = a.lembur.filter((r) => r.otStatus === 'Menunggu').reduce((x, r) => x + r.ot, 0);

    const pendapatan = [
      { kode: 'GP', nama: 'Gaji Pokok', nilai: R(pokok), ket: ketPokok },
    ];
    if (gj.tunjJabatan) pendapatan.push({ kode: 'TJ', nama: 'Tunjangan Jabatan', nilai: R(gj.tunjJabatan), ket: 'Tetap' });
    if (tunjLokasi) pendapatan.push({ kode: 'TL', nama: 'Tunjangan Lokasi / Remote Area', nilai: R(tunjLokasi), ket: lok.nama });
    if (gj.makan) pendapatan.push({ kode: 'TM', nama: 'Tunjangan Makan', nilai: R(gj.makan * hariBayar), ket: `${hariBayar} hari x ${fmt(gj.makan)}` });
    if (gj.transport) pendapatan.push({ kode: 'TT', nama: 'Tunjangan Transport', nilai: R(gj.transport * hariBayar), ket: `${hariBayar} hari x ${fmt(gj.transport)}` });
    if (nilaiLembur) pendapatan.push({ kode: 'LB', nama: 'Upah Lembur', nilai: nilaiLembur, ket: `${num(jamLembur)} jam aktual / ${num(lembur.reduce((x, l) => x + l.ekuivalen, 0))} jam ekuivalen` });
    adjustments.filter((x) => x.jenis === 'Pendapatan').forEach((x) => pendapatan.push({ kode: 'ADJ', nama: x.nama, nilai: R(x.nilai), ket: 'Penyesuaian' }));

    const potongan = [];
    if (rules.potongAlpa && a.alpa && emp.tipeGaji !== 'Harian') {
      const harian = upahTetap / (j.hariKerjaBulan || 25);
      potongan.push({ kode: 'PA', nama: 'Potongan Tidak Hadir (Alpa)', nilai: R(harian * a.alpa), ket: `${a.alpa} hari x ${fmt(R(harian))}` });
    }

    // BPJS
    const B = rules.bpjs;
    const upahKes = Math.min(upahTetap, B.kesMaks);
    const upahJp = Math.min(upahTetap, B.jpMaks);
    const ikut = emp.bpjs || { kes: true, tk: true, jp: true };
    const perusahaan = [];
    if (ikut.kes) {
      potongan.push({ kode: 'BK', nama: 'BPJS Kesehatan', nilai: R(upahKes * B.kesPekerja / 100), ket: `${num(B.kesPekerja, 2)}%` });
      perusahaan.push({ kode: 'BKP', nama: 'BPJS Kesehatan', nilai: R(upahKes * B.kesPerusahaan / 100), ket: `${num(B.kesPerusahaan, 2)}%`, pph: true });
    }
    if (ikut.tk) {
      potongan.push({ kode: 'JHT', nama: 'BPJS TK — JHT', nilai: R(upahTetap * B.jhtPekerja / 100), ket: `${num(B.jhtPekerja, 2)}%` });
      perusahaan.push({ kode: 'JHTP', nama: 'BPJS TK — JHT', nilai: R(upahTetap * B.jhtPerusahaan / 100), ket: `${num(B.jhtPerusahaan, 2)}%`, pph: false });
      const jkk = emp.kategori === 'Lapangan' ? B.jkkLapangan : B.jkkKantor;
      perusahaan.push({ kode: 'JKK', nama: 'BPJS TK — JKK', nilai: R(upahTetap * jkk / 100), ket: `${num(jkk, 2)}%`, pph: true });
      perusahaan.push({ kode: 'JKM', nama: 'BPJS TK — JKM', nilai: R(upahTetap * B.jkm / 100), ket: `${num(B.jkm, 2)}%`, pph: true });
    }
    if (ikut.jp) {
      potongan.push({ kode: 'JP', nama: 'BPJS TK — Jaminan Pensiun', nilai: R(upahJp * B.jpPekerja / 100), ket: `${num(B.jpPekerja, 2)}%` });
      perusahaan.push({ kode: 'JPP', nama: 'BPJS TK — Jaminan Pensiun', nilai: R(upahJp * B.jpPerusahaan / 100), ket: `${num(B.jpPerusahaan, 2)}%`, pph: false });
    }

    // PPh 21 TER
    const totalPendapatan = pendapatan.reduce((x, p) => x + p.nilai, 0);
    const brutoPajak = totalPendapatan + perusahaan.filter((p) => p.pph).reduce((x, p) => x + p.nilai, 0);
    const ter = terRate(emp.ptkp, brutoPajak);
    const nilaiPph = Math.floor(brutoPajak * ter.tarif / 100);
    const pph = { kategori: ter.kategori, tarif: ter.tarif, bruto: brutoPajak, nilai: nilaiPph, metode: rules.pph.metode };
    if (nilaiPph) {
      if (rules.pph.metode === 'ditanggung') perusahaan.push({ kode: 'PPH', nama: 'PPh 21 ditanggung perusahaan', nilai: nilaiPph, ket: `TER ${ter.kategori} ${num(ter.tarif, 2)}%`, pph: false });
      else potongan.push({ kode: 'PPH', nama: 'PPh 21 (TER)', nilai: nilaiPph, ket: `Kategori ${ter.kategori} · ${num(ter.tarif, 2)}%` });
    }
    adjustments.filter((x) => x.jenis === 'Potongan').forEach((x) => potongan.push({ kode: 'ADJ', nama: x.nama, nilai: R(x.nilai), ket: 'Penyesuaian' }));

    const totalPotongan = potongan.reduce((x, p) => x + p.nilai, 0);
    const totalPerusahaan = perusahaan.reduce((x, p) => x + p.nilai, 0);
    const thp = totalPendapatan - totalPotongan;
    const peringatan = [];
    if (emp.tipeGaji !== 'Harian' && upahBulanan < rules.umk) peringatan.push('Gaji pokok di bawah upah minimum acuan');
    if (lemburPending) peringatan.push(`${num(lemburPending)} jam lembur belum disetujui (tidak dibayar)`);
    if (a.tidakLengkap) peringatan.push(`${a.tidakLengkap} hari absen tidak lengkap`);
    if (lembur.some((l) => l.jenis === 'Hari Kerja' && l.jam > rules.lembur.maksHarian)) peringatan.push('Ada lembur melebihi batas harian');

    return {
      empId: emp.id, nik: emp.nik, nama: emp.nama, jabatan: emp.jabatan, unit: unit.nama || '—', unitId: emp.unitId, kategori: emp.kategori,
      lokasi: lok.nama || '—', jadwal: j.nama || '—', jadwalKode: j.kode || '', ptkp: emp.ptkp, npwp: emp.npwp, tipeGaji: emp.tipeGaji, statusKerja: emp.statusKerja,
      bank: emp.bank, rekening: emp.rekening, atasNama: emp.atasNama || emp.nama, tglMasuk: emp.tglMasuk,
      hadir: { jadwal: a.jadwal, jadwalPeriode: a.jadwalPeriode, hadir: a.hadir, terlambat: a.terlambat, menitTerlambat: a.menitTerlambat, tidakLengkap: a.tidakLengkap, alpa: a.alpa, izin: a.izin, sakit: a.sakit, cuti: a.cuti, dinas: a.dinas, hariLibur: a.hariLibur, belum: a.belum, jamKerja: Math.round(a.jamKerja * 10) / 10 },
      upahBulanan: R(upahBulanan), upahTetap: R(upahTetap), upahJam: Math.round(upahJam * 100) / 100, dasarLembur: rules.lembur.dasar,
      lembur, jamLembur, lemburPending, nilaiLembur,
      pendapatan, potongan, perusahaan, pph,
      totalPendapatan, totalPotongan, totalPerusahaan, thp, biaya: totalPendapatan + totalPerusahaan, peringatan,
    };
  }

  // ------------------------------------------------------------ format & terbilang
  function fmt(n) { return 'Rp ' + Math.round(Number(n) || 0).toLocaleString('id-ID'); }
  function num(n, d = 1) { return (Math.round((Number(n) || 0) * 10 ** d) / 10 ** d).toLocaleString('id-ID'); }
  function terbilang(n) {
    n = Math.floor(Math.abs(n));
    const s = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas'];
    const f = (x) => {
      if (x < 12) return s[x];
      if (x < 20) return f(x - 10) + ' belas';
      if (x < 100) return f(Math.floor(x / 10)) + ' puluh ' + f(x % 10);
      if (x < 200) return 'seratus ' + f(x - 100);
      if (x < 1000) return f(Math.floor(x / 100)) + ' ratus ' + f(x % 100);
      if (x < 2000) return 'seribu ' + f(x - 1000);
      if (x < 1e6) return f(Math.floor(x / 1000)) + ' ribu ' + f(x % 1000);
      if (x < 1e9) return f(Math.floor(x / 1e6)) + ' juta ' + f(x % 1e6);
      if (x < 1e12) return f(Math.floor(x / 1e9)) + ' miliar ' + f(x % 1e9);
      return f(Math.floor(x / 1e12)) + ' triliun ' + f(x % 1e12);
    };
    const out = (n === 0 ? 'nol' : f(n)).replace(/\s+/g, ' ').trim();
    return out.charAt(0).toUpperCase() + out.slice(1) + ' rupiah';
  }
  // kode verifikasi dokumen (hash sederhana, bukan kriptografi)
  function docCode(...parts) {
    let h = 2166136261;
    for (const c of parts.join('|')) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
    return (h >>> 0).toString(36).toUpperCase().padStart(7, '0');
  }

  g.PayrollEngine = {
    pad, iso, parseISO, addDays, daysBetween, toMin, fromMin, todayISO, BULAN,
    periodRange, periodOf, periodLabel, shiftPeriod, rangeDays,
    TER, PTKP_KATEGORI, terRate, defaultRules, isScheduled,
    buildContext, dayRecord, attendanceSummary, overtimeTiers, calcSlip,
    fmt, num, terbilang, docCode,
  };
})(window);
