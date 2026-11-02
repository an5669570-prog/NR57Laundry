/* ===== NR57Laundry - bubbles.js =====
   Efek busa sabun: gelembung muncul mengikuti kursor saat digeser atau diseret,
   melayang naik, lalu memudar. Juga muncul sedikit saat klik/sentuh.
   Dipasang di semua halaman lewat <script src="bubbles.js"></script>. */
(function () {
  // Pengaturan: ubah angka di sini untuk menyesuaikan efek
  const CFG = {
    jarak: 16,        // satu gelembung muncul setiap sekian piksel kursor bergerak (kecil = lebih banyak)
    maks: 70,         // jumlah gelembung maksimum di layar
    ukuranMin: 4,     // ukuran gelembung terkecil (px)
    ukuranMaks: 15,   // ukuran gelembung terbesar (px)
    umurMin: 1500,    // lama hidup tercepat (milidetik)
    umurMaks: 2600,   // lama hidup terlama (milidetik)
    ledakan: 5,       // jumlah gelembung saat klik/sentuh
    saatMuat: 6,      // gelembung percobaan yang naik sebentar saat halaman dibuka (0 = matikan)
    // false = efek tetap jalan walau Windows/Mac memakai pengaturan "kurangi animasi"
    // true  = efek mati jika pengguna mengaktifkan "kurangi animasi" (lebih ramah aksesibilitas)
    hormatiKurangiGerakan: false
  };

  const kurangiGerakan = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (kurangiGerakan && CFG.hormatiKurangiGerakan) {
    console.info("[NR57Laundry] Efek gelembung dimatikan karena pengaturan 'kurangi animasi' aktif.");
    return;
  }
  console.info("[NR57Laundry] Efek gelembung aktif.");

  // Kanvas transparan di atas halaman; tidak menghalangi klik
  const cv = document.createElement("canvas");
  cv.setAttribute("aria-hidden", "true");
  Object.assign(cv.style, { position: "fixed", inset: "0", width: "100%", height: "100%", pointerEvents: "none", zIndex: "9999" });
  document.body.appendChild(cv);
  const ctx = cv.getContext("2d");

  let W, H, list = [], berjalan = false, lx = null, ly = null, sisa = 0;
  const acak = (a, b) => a + Math.random() * (b - a);

  function ukur() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  ukur();
  window.addEventListener("resize", ukur);

  function tambah(x, y) {
    if (list.length >= CFG.maks) list.shift();
    list.push({
      x: x + acak(-8, 8), y: y + acak(-8, 8),
      r: acak(CFG.ukuranMin, CFG.ukuranMaks),
      naik: acak(0.35, 0.9),            // kecepatan naik
      fase: acak(0, 6.28), goyang: acak(0.3, 1), // goyangan kiri-kanan
      lahir: performance.now(), umur: acak(CFG.umurMin, CFG.umurMaks)
    });
    if (!berjalan) { berjalan = true; requestAnimationFrame(frame); }
  }

  // Dipanggil tiap kursor bergerak: munculkan gelembung sesuai jarak tempuh
  function gerak(x, y) {
    if (lx === null) { lx = x; ly = y; return; }
    sisa += Math.hypot(x - lx, y - ly);
    lx = x; ly = y;
    while (sisa >= CFG.jarak) { sisa -= CFG.jarak; tambah(x, y); }
  }
  function ledakan(x, y) { for (let i = 0; i < CFG.ledakan; i++) tambah(x, y); }

  function gambar(x, y, r, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    // Badan gelembung: bening di tengah, tepi hijau muda
    const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
    g.addColorStop(0, "rgba(255,255,255,.10)");
    g.addColorStop(0.75, "rgba(155,224,189,.18)");
    g.addColorStop(1, "rgba(31,164,99,.38)");
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = g; ctx.fill();
    ctx.lineWidth = 1.2; ctx.strokeStyle = "rgba(17,122,77,.45)"; ctx.stroke();
    // Pantulan cahaya
    ctx.beginPath(); ctx.ellipse(x - r * 0.35, y - r * 0.38, r * 0.28, r * 0.16, -0.6, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,.85)"; ctx.fill();
    ctx.beginPath(); ctx.arc(x, y, r * 0.8, 0.2 * Math.PI, 0.7 * Math.PI);
    ctx.lineWidth = 1; ctx.strokeStyle = "rgba(255,255,255,.55)"; ctx.stroke();
    ctx.restore();
  }

  function frame(now) {
    ctx.clearRect(0, 0, W, H);
    list = list.filter(b => now - b.lahir < b.umur);
    for (const b of list) {
      const t = now - b.lahir, usia = t / b.umur;                 // 0 (baru) sampai 1 (hilang)
      const x = b.x + Math.sin(b.fase + usia * 6) * b.goyang * 10; // goyang
      const y = b.y - b.naik * t / 16.67;                          // naik
      const r = b.r * (1 + usia * 0.25);                           // sedikit membesar
      const alpha = usia < 0.7 ? 1 : 1 - (usia - 0.7) / 0.3;       // memudar di akhir
      gambar(x, y, r, alpha);
    }
    if (list.length) requestAnimationFrame(frame);
    else { berjalan = false; ctx.clearRect(0, 0, W, H); }          // berhenti saat tidak ada gelembung
  }

  // Mouse / pena
  window.addEventListener("pointermove", e => { if (e.pointerType !== "touch") gerak(e.clientX, e.clientY); }, { passive: true });
  window.addEventListener("pointerdown", e => { if (e.pointerType !== "touch") { lx = e.clientX; ly = e.clientY; ledakan(e.clientX, e.clientY); } }, { passive: true });
  document.addEventListener("mouseleave", () => { lx = null; });
  // Layar sentuh (geser jari)
  window.addEventListener("touchstart", e => { const t = e.touches[0]; lx = null; ledakan(t.clientX, t.clientY); }, { passive: true });
  // Gelembung percobaan saat halaman dibuka, agar langsung terlihat efek ini bekerja
  if (CFG.saatMuat > 0) setTimeout(() => {
    for (let i = 0; i < CFG.saatMuat; i++) tambah(acak(W * 0.3, W * 0.7), acak(H * 0.6, H * 0.85));
  }, 400);
  window.addEventListener("touchmove", e => { const t = e.touches[0]; gerak(t.clientX, t.clientY); }, { passive: true });
})();