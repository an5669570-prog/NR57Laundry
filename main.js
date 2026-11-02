/* ===== NR57Laundry - main.js =====
   Navbar + footer untuk halaman pelanggan, header sederhana untuk admin,
   dan pengisian daftar layanan/harga di beranda.html. */
(function () {
  const page = location.pathname.split("/").pop() || "index.html";
  const isAdminPage = page === "admin.html";
  const home = !!document.getElementById("beranda");
  const p = home ? "" : "beranda.html";

  const nav = document.getElementById("navbar");
  if (nav && isAdminPage) {
    // Admin: tanpa menu pelanggan
    nav.innerHTML = `
      <div class="container nav">
        <a href="admin.html" class="logo"><img class="logo-img" src="logo.png" alt="" width="40" height="40">NR57Laundry <small class="tag">Admin</small></a>
      </div>`;
  } else if (nav) {
    nav.innerHTML = `
      <div class="container nav">
        <a href="beranda.html" class="logo" aria-label="NR57Laundry beranda"><img class="logo-img" src="logo.png" alt="" width="40" height="40">NR57Laundry</a>
        <button class="burger" id="burger" aria-label="Buka menu" aria-expanded="false">☰</button>
        <nav class="menu" id="menu">
          <a href="${p}#beranda">Beranda</a>
          <a href="${p}#layanan">Layanan</a>
          <a href="${p}#harga">Harga</a>
          <a href="${p}#cara">Cara Pemesanan</a>
          <a href="${p}#kontak">Kontak</a>
          <a href="status.html" class="${page === "status.html" ? "active" : ""}">Cek Status</a>
          <a href="index.html" id="navKeluar">Keluar</a>
          <a href="pesan.html" class="btn btn-sm">Pesan Sekarang</a>
        </nav>
      </div>`;
    const burger = document.getElementById("burger"), menu = document.getElementById("menu");
    burger.addEventListener("click", () => {
      const open = menu.classList.toggle("open");
      burger.setAttribute("aria-expanded", open);
    });
    menu.addEventListener("click", e => { if (e.target.closest("a")) menu.classList.remove("open"); });
    document.getElementById("navKeluar").addEventListener("click", () => localStorage.removeItem(CUSTOMER_KEY));
  }

  const foot = document.getElementById("footer");
  if (foot && isAdminPage) {
    foot.innerHTML = `<div class="container"><p class="copy" style="border:none;margin:0;padding:0">© ${new Date().getFullYear()} NR57Laundry. Panel admin.</p></div>`;
  } else if (foot) {
    foot.innerHTML = `
      <div class="container">
        <div class="foot">
          <div><a href="beranda.html" class="logo"><img class="logo-img" src="logo.png" alt="" width="40" height="40">NR57Laundry</a><p>Laundry antar-jemput yang bersih, praktis, dan terpercaya.</p></div>
          <nav><a href="beranda.html#layanan">Layanan</a><a href="beranda.html#harga">Harga</a><a href="pesan.html">Pesan</a><a href="status.html">Cek Status</a></nav>
        </div>
        <p class="copy">© NR57Laundry${new Date().getFullYear()} NR57Laundry. Semua hak dilindungi.</p>
      </div>`;
  }

  // Pengaman: jika data.js tidak termuat / versi lama, tampilkan petunjuk (bukan tabel kosong)
  if (typeof SERVICES === "undefined" || !SERVICES.some(s => s.satuan)) {
    const msg = '<div class="sync-warn"><strong>Daftar layanan gagal dimuat.</strong> Ganti <code>data.js</code> dengan versi dari .zip terbaru, lalu tekan Ctrl+F5.</div>';
    const a = document.getElementById("layananList"); if (a) a.innerHTML = msg;
    ["hargaBody", "satuanBody"].forEach(id => { const t = document.getElementById(id); if (t) t.innerHTML = '<tr><td colspan="4">' + msg + "</td></tr>"; });
    return;
  }

  // Daftar layanan dan tabel harga (hanya ada di beranda.html)
  const list = document.getElementById("layananList");
  if (list) {
    const satuan = SERVICES.filter(s => s.satuan === "pcs");
    const termurah = satuan.length ? Math.min(...satuan.map(s => s.harga)) : 0;
    list.innerHTML = SERVICES.filter(s => s.satuan === "kg").map(s => `
      <article class="card svc">
        <div class="icon">${s.ikon}</div>
        <h3>${s.nama}</h3>
        <p>${s.desk}</p>
        <div class="meta"><span>⏱ ${s.estimasi}</span><span>${rupiah(s.harga)}/${s.satuan}</span></div>
        <a class="btn btn-outline btn-sm" href="pesan.html?layanan=${s.id}">Pilih layanan ini</a>
      </article>`).join("") + (satuan.length ? `
      <article class="card svc">
        <div class="icon">🧺</div>
        <h3>Laundry Satuan</h3>
        <p>Bed cover, selimut, sprei, jas, kebaya, mukena, boneka, dan lainnya. Dihitung per potong.</p>
        <div class="meta"><span>Per potong</span><span>Mulai ${rupiah(termurah)}/pcs</span></div>
        <a class="btn btn-outline btn-sm" href="#harga">Lihat daftar harga</a>
      </article>` : "");
  }
  const body = document.getElementById("hargaBody");
  if (body) {
    body.innerHTML = SERVICES.filter(s => s.satuan === "kg").map(s =>
      `<tr><td><strong>${s.ikon} ${s.nama}</strong></td><td>${s.estimasi}</td><td>${s.min} kg</td><td class="price">${rupiah(s.harga)}/kg</td></tr>`).join("");
  }
  const sat = document.getElementById("satuanBody");
  if (sat) {
    sat.innerHTML = SERVICES.filter(s => s.satuan === "pcs").map(s =>
      `<tr><td>${s.nama}</td><td class="price">${rupiah(s.harga)}/pcs</td></tr>`).join("");
  }
})();