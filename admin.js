/* ===== NR57Laundry - admin.js =====
   Panel admin: dashboard, pesanan, layanan & harga, pengaturan. */
if (!isAdmin()) location.replace("index.html?role=admin");

const $ = id => document.getElementById(id);
const dlg = $("dlg"), dlgBody = $("dlgBody");
$("welcome").textContent = "Masuk sebagai " + ((adminCreds() || {}).user || "admin");

function hariIni() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}
function toast(t) {
  const e = $("toast"); e.textContent = t; e.classList.add("show");
  setTimeout(() => e.classList.remove("show"), 2400);
}
const jumlah = n => Number(n).toLocaleString("id-ID");

/* ---------- Tab ---------- */
function bukaTab(n) {
  document.querySelectorAll(".tab-btn").forEach(b => b.classList.toggle("active", b.dataset.tab === n));
  document.querySelectorAll(".tab-panel").forEach(p => p.hidden = p.id !== "tab-" + n);
  history.replaceState(null, "", "#" + n);
}
document.querySelectorAll(".tab-btn").forEach(b => b.addEventListener("click", () => bukaTab(b.dataset.tab)));

$("logout").addEventListener("click", () => { sessionStorage.removeItem(ADMIN_SESSION); location.href = "index.html"; });

/* ---------- Dashboard ---------- */
function bars(rows) {
  const max = Math.max(1, ...rows.map(r => r[1]));
  return rows.map(([l, v, t]) => `<div class="bar-row"><span class="bar-l">${esc(l)}</span><div class="bar"><i style="width:${(v / max) * 100}%"></i></div><span class="bar-v">${t ?? v}</span></div>`).join("");
}
function renderDashboard() {
  const all = getOrders(), today = hariIni();
  const nilai = all.reduce((t, o) => t + o.total, 0);
  const kg = all.filter(o => (o.satuan || "kg") === "kg").reduce((t, o) => t + o.kg, 0); // hanya pesanan per kg
  const hariIniList = all.filter(o => o.tanggal === today && o.status <= 2).sort((a, b) => a.waktu.localeCompare(b.waktu));
  $("stats").innerHTML = [
    ["Total pesanan", all.length],
    ["Perlu konfirmasi", all.filter(o => o.status === 0).length],
    ["Jemput hari ini", hariIniList.length],
    ["Sedang diproses", all.filter(o => o.status >= 2 && o.status <= 5).length],
    ["Total berat (kiloan)", jumlah(kg) + " kg"],
    ["Total nilai pesanan", rupiah(nilai)],
    ["Belum dibayar", all.filter(o => !o.lunas).length + " pesanan"],
    ["Uang belum diterima", rupiah(all.filter(o => !o.lunas).reduce((t, o) => t + o.total, 0))]
  ].map(([l, v]) => `<div class="card stat"><span>${l}</span><strong>${v}</strong></div>`).join("");

  $("chStatus").innerHTML = bars(STATUSES.map((s, i) => [s, all.filter(o => o.status === i).length]));
  // Grafik: layanan kiloan satu per satu, layanan satuan digabung agar grafik tidak terlalu panjang
  const kiloan = SERVICES.filter(s => s.satuan === "kg").map(s => [s.nama, all.filter(o => o.layananId === s.id).reduce((a, o) => a + o.total, 0)]);
  const satuanTotal = all.filter(o => o.satuan === "pcs").reduce((a, o) => a + o.total, 0);
  const lainnya = nilai - kiloan.reduce((a, r) => a + r[1], 0) - satuanTotal; // pesanan lama dengan layanan yang sudah tidak ada
  const rowsL = [...kiloan, ["Laundry Satuan", satuanTotal]];
  if (lainnya > 0) rowsL.push(["Lainnya", lainnya]);
  $("chLayanan").innerHTML = bars(rowsL.map(([n, t]) => [n, t, rupiah(t)]));

  const baru = all.filter(o => o.status === 0);
  $("todoList").innerHTML = baru.length ? baru.slice(0, 6).map(o => `
    <div class="mini"><div><strong>${esc(o.nama)}</strong><small>${esc(o.kode)} - ${esc(o.layanan)}, ${rupiah(o.total)}</small></div>
    <div class="actions"><button class="btn btn-sm" data-aksi="konfirmasi" data-kode="${o.kode}">Konfirmasi</button><button class="btn btn-outline btn-sm" data-aksi="detail" data-kode="${o.kode}">Detail</button></div></div>`).join("")
    : `<p class="empty">Semua pesanan sudah dikonfirmasi.</p>`;

  $("todayList").innerHTML = hariIniList.length ? hariIniList.map(o => `
    <div class="mini"><div><strong>${esc(o.waktu)} - ${esc(o.nama)}</strong><small>${esc(o.alamat)}</small></div>
    <button class="btn btn-outline btn-sm" data-aksi="detail" data-kode="${o.kode}">Detail</button></div>`).join("")
    : `<p class="empty">Tidak ada jadwal jemput hari ini.</p>`;
}

/* ---------- Pesanan ---------- */
STATUSES.forEach((s, i) => $("filter").insertAdjacentHTML("beforeend", `<option value="${i}">${s}</option>`));

function renderOrders() {
  const all = getOrders();
  const q = $("cari").value.trim().toLowerCase(), f = $("filter").value, fb = $("filterBayar").value;
  const list = all.filter(o => (f === "" || o.status === Number(f)) &&
    (fb === "" || (fb === "lunas") === !!o.lunas) &&
    (o.kode.toLowerCase().includes(q) || o.nama.toLowerCase().includes(q)));
  $("tbody").innerHTML = list.length ? list.map(o => `
    <tr>
      <td><strong>${esc(o.kode)}</strong></td>
      <td>${esc(o.nama)}<br><small class="muted">${esc(o.wa)}</small></td>
      <td>${esc(o.layanan)}<br><small class="muted">${fmtJumlah(o)}</small></td>
      <td class="price">${rupiah(o.total)}</td>
      <td>
        <span class="badge ${o.lunas ? "paid" : "unpaid"}">${o.lunas ? "Sudah dibayar" : "Belum dibayar"}</span><br>
        <small class="muted">${metodeBayar(o.bayar)}</small><br>
        <button class="btn btn-outline btn-sm" style="margin-top:6px" data-aksi="bayar" data-kode="${o.kode}">${o.lunas ? "Tandai belum dibayar" : "Tandai sudah dibayar"}</button>
      </td>
      <td><select data-kode="${o.kode}" aria-label="Ubah status ${esc(o.kode)}">
        ${STATUSES.map((s, i) => `<option value="${i}" ${i === o.status ? "selected" : ""}>${s}</option>`).join("")}
      </select></td>
      <td><div class="actions">
        <button class="btn btn-outline btn-sm" data-aksi="detail" data-kode="${o.kode}">Detail</button>
        <button class="btn btn-danger btn-sm" data-aksi="hapus" data-kode="${o.kode}">Hapus</button>
      </div></td>
    </tr>`).join("")
    : `<tr><td colspan="7" class="empty">${all.length ? "Tidak ada pesanan yang cocok." : "Belum ada pesanan. Pesanan dari halaman Pesan akan muncul di sini."}</td></tr>`;
}

function detail(o) {
  dlgBody.innerHTML = `
    <h3>Detail ${esc(o.kode)}</h3>
    <p><span class="badge s${o.status}">${STATUSES[o.status]}</span></p>
    <dl class="sum">
      <div><dt>Nama</dt><dd>${esc(o.nama)}</dd></div>
      <div><dt>WhatsApp</dt><dd><a href="${waLink(o.wa)}" target="_blank" rel="noopener">${esc(o.wa)}</a></dd></div>
      <div><dt>Alamat</dt><dd>${esc(o.alamat)}</dd></div>
      <div><dt>Layanan</dt><dd>${esc(o.layanan)}</dd></div>
      <div><dt>Jumlah</dt><dd>${fmtJumlah(o)}</dd></div>
      <div><dt>Jemput</dt><dd>${fmtTanggal(o.tanggal)}, ${esc(o.waktu)}</dd></div>
      <div><dt>Catatan</dt><dd>${esc(o.catatan) || "-"}</dd></div>
      <div><dt>Pembayaran</dt><dd>${metodeBayar(o.bayar)}</dd></div>
      <div><dt>Status bayar</dt><dd>${o.lunas ? "Sudah dibayar" + (o.tglBayar ? " (" + new Date(o.tglBayar).toLocaleString("id-ID") + ")" : "") : "Belum dibayar"}</dd></div>
      <div><dt>Biaya cuci</dt><dd>${rupiah(o.subtotal)}</dd></div>
      <div><dt>Antar-jemput</dt><dd>${o.ongkir ? rupiah(o.ongkir) : "Gratis"}</dd></div>
      <div><dt><strong>Total</strong></dt><dd><strong>${rupiah(o.total)}</strong></dd></div>
      <div><dt>Dibuat</dt><dd>${new Date(o.dibuat).toLocaleString("id-ID")}</dd></div>
    </dl>
    <div class="dlg-actions"><button class="btn" data-aksi="tutup">Tutup</button></div>`;
  dlg.showModal();
}

function refresh() { renderDashboard(); renderOrders(); }

$("tbody").addEventListener("change", e => {
  if (!e.target.dataset.kode) return;
  const list = getOrders();
  const o = list.find(x => x.kode === e.target.dataset.kode);
  if (o) { o.status = Number(e.target.value); saveOrders(list); refresh(); toast("Status diperbarui"); }
});

// Satu pendengar klik untuk semua tombol aksi (dashboard, tabel, dialog)
document.addEventListener("click", e => {
  const b = e.target.closest("[data-aksi]");
  if (!b) return;
  const aksi = b.dataset.aksi;
  if (aksi === "tutup") return dlg.close();
  const list = getOrders();
  const o = list.find(x => x.kode === b.dataset.kode);
  if (!o) return;
  if (aksi === "detail") detail(o);
  if (aksi === "bayar") {
    o.lunas = !o.lunas;
    o.tglBayar = o.lunas ? new Date().toISOString() : null;
    saveOrders(list); refresh();
    toast(o.lunas ? "Ditandai sudah dibayar" : "Ditandai belum dibayar");
  }
  if (aksi === "konfirmasi") { o.status = 1; saveOrders(list); refresh(); toast("Pesanan dikonfirmasi"); }
  if (aksi === "hapus" && confirm(`Hapus pesanan ${o.kode} atas nama ${o.nama}? Tindakan ini tidak bisa dibatalkan.`)) {
    saveOrders(list.filter(x => x.kode !== o.kode)); refresh(); toast("Pesanan dihapus");
  }
});

$("cari").addEventListener("input", renderOrders);
$("filter").addEventListener("change", renderOrders);
$("filterBayar").addEventListener("change", renderOrders);

// Ekspor CSV (sel diawali ' jika berisi karakter rumus agar aman dibuka di Excel)
$("exportCsv").addEventListener("click", () => {
  const all = getOrders();
  if (!all.length) return toast("Belum ada pesanan untuk diekspor");
  const sel = v => {
    let t = String(v ?? "");
    if (/^[=+\-@]/.test(t)) t = "'" + t;
    return '"' + t.replace(/"/g, '""') + '"';
  };
  const head = ["Kode", "Nama", "WhatsApp", "Alamat", "Layanan", "Jumlah", "Tanggal jemput", "Waktu", "Pembayaran", "Status bayar", "Total", "Status", "Dibuat"];
  const rows = all.map(o => [o.kode, o.nama, o.wa, o.alamat, o.layanan, fmtJumlah(o), o.tanggal, o.waktu, metodeBayar(o.bayar), o.lunas ? "Sudah dibayar" : "Belum dibayar", o.total, STATUSES[o.status], o.dibuat].map(sel).join(","));
  const blob = new Blob(["\ufeff" + [head.map(sel).join(","), ...rows].join("\r\n")], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "pesanan-NR57Laundry-" + hariIni() + ".csv";
  a.click();
  URL.revokeObjectURL(a.href);
});

/* ---------- Layanan & Harga ---------- */
$("hargaRows").innerHTML = SERVICES.map(s => `
  <tr><td><strong>${s.ikon} ${s.nama}</strong> <small class="muted">per ${s.satuan}</small></td>
  <td><input type="number" min="1000" step="500" id="h-${s.id}" value="${s.harga}" aria-label="Harga ${s.nama}"></td>
  <td><input type="text" id="e-${s.id}" value="${esc(s.estimasi)}" aria-label="Estimasi ${s.nama}"></td></tr>`).join("");

$("formHarga").addEventListener("submit", e => {
  e.preventDefault();
  const harga = {}, estimasi = {};
  for (const s of SERVICES) {
    const h = Number($("h-" + s.id).value), t = $("e-" + s.id).value.trim();
    if (!(h >= 1000) || !t) return toast("Harga minimal Rp1.000 dan estimasi tidak boleh kosong");
    harga[s.id] = h; estimasi[s.id] = t;
  }
  const st = getSettings(); st.harga = harga; st.estimasi = estimasi; saveSettings(st);
  SERVICES.forEach(s => { s.harga = harga[s.id]; s.estimasi = estimasi[s.id]; });
  refresh(); toast("Harga disimpan");
});

/* ---------- Pengaturan ---------- */
$("oMin").value = ONGKIR.minKg; $("oBiaya").value = ONGKIR.biaya;
$("uBaru").value = ((adminCreds() || {}).user || "admin");

$("formRek").addEventListener("submit", e => {
  e.preventDefault();
  const ong = { minKg: Number($("oMin").value), biaya: Number($("oBiaya").value) };
  if (!(ong.minKg >= 0) || !(ong.biaya >= 0)) return toast("Lengkapi semua kolom dengan benar");
  const st = getSettings(); st.ongkir = ong; saveSettings(st);
  Object.assign(ONGKIR, ong);
  toast("Ongkos kirim disimpan");
});

function tampilKode(kode) {
  dlgBody.innerHTML = `
    <div style="text-align:center">
      <div class="ok-icon">🔑</div>
      <h3>Simpan kode pemulihan Anda</h3>
      <p class="muted">Dipakai jika Anda lupa kata sandi. Hanya ditampilkan sekali, jadi catat atau salin sekarang.</p>
      <div class="kode-box" id="kodePulih">${kode}</div>
      <div class="dlg-actions" style="justify-content:center">
        <button class="btn btn-outline" data-salin="1">Salin kode</button>
        <button class="btn" data-aksi="tutup">Sudah saya simpan</button>
      </div>
    </div>`;
  dlg.showModal();
}
dlgBody.addEventListener("click", e => {
  if (e.target.dataset.salin && navigator.clipboard)
    navigator.clipboard.writeText($("kodePulih").textContent).then(() => e.target.textContent = "Tersalin ✓");
});

$("formAkun").addEventListener("submit", async e => {
  e.preventDefault();
  const user = $("uBaru").value.trim(), pass = $("pBaru").value;
  if (user.length < 3) return toast("Username minimal 3 karakter");
  if (pass.length < 6) return toast("Password minimal 6 karakter");
  await ubahAkun(user, pass);
  $("pBaru").value = ""; $("welcome").textContent = "Masuk sebagai " + user;
  toast(getAdmin().rec ? "Akun admin disimpan" : "Akun disimpan. Klik 'Buat kode pemulihan baru' agar bisa memakai Lupa kata sandi");
});

$("kodeBaru").addEventListener("click", async () => {
  const kode = await buatKodeBaru();
  if (kode) tampilKode(kode);
});

$("hapusSemua").addEventListener("click", () => {
  if (confirm("Hapus SEMUA data pesanan? Tindakan ini tidak bisa dibatalkan.")) { saveOrders([]); refresh(); toast("Semua pesanan dihapus"); }
});

refresh();
bukaTab(location.hash.slice(1) || "dashboard");