/* ===== NR57Laundry - pesan.js =====
   Form pemesanan: estimasi biaya otomatis, validasi, ringkasan, simpan ke LocalStorage. */
const $ = id => document.getElementById(id);
const form = $("formPesan"), dlg = $("dlg"), dlgBody = $("dlgBody");
const FIELDS = ["nama", "wa", "alamat", "layanan", "berat", "tanggal", "waktu", "bayar"];
let draft = null; // data pesanan yang sedang diperiksa di ringkasan
let terakhir = null; // pesanan yang baru dikonfirmasi (untuk kirim ulang ke WhatsApp)

// Isi pilihan layanan dari data.js (menggantikan pilihan cadangan di pesan.html)
if (typeof SERVICES === "undefined" || !SERVICES.length || !SERVICES.some(s => s.grup)) {
  $("err-layanan").textContent = "Daftar layanan gagal dimuat. Pastikan file js/data.js ada di folder js, lalu muat ulang dengan Ctrl+F5.";
  throw new Error("js/data.js tidak termuat, SERVICES tidak ditemukan");
}
$("layanan").innerHTML = '<option value="">Pilih layanan</option>' +
  ["Laundry Kiloan", "Laundry Satuan"].map(g => `<optgroup label="${g}">` +
    SERVICES.filter(s => s.grup === g).map(s => `<option value="${s.id}">${s.nama} - ${rupiah(s.harga)}/${s.satuan}</option>`).join("") +
  "</optgroup>").join("");
const pilihan = new URLSearchParams(location.search).get("layanan");
if (pilihan) $("layanan").value = pilihan;

function hariIni() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}
$("tanggal").min = hariIni();

// Isi otomatis nama & WhatsApp jika pelanggan sudah mengisinya di halaman Masuk
try {
  const c = JSON.parse(localStorage.getItem(CUSTOMER_KEY) || "null");
  if (c) { if (c.nama) $("nama").value = c.nama; if (c.wa) $("wa").value = c.wa; }
} catch (e) {}

function bayarDipilih() {
  const r = form.querySelector('input[name="bayar"]:checked');
  return r ? r.value : "";
}

// Sesuaikan isian jumlah dengan layanan yang dipilih: kg (boleh desimal) atau pcs (bilangan bulat)
function aturJumlah() {
  const s = SERVICES.find(x => x.id === $("layanan").value);
  const inp = $("berat");
  if (!s) { $("lblBerat").textContent = "Berat / jumlah"; inp.placeholder = "Pilih layanan dulu"; return; }
  const kg = s.satuan === "kg";
  $("lblBerat").textContent = kg ? "Berat laundry (kg)" : "Jumlah (pcs)";
  inp.min = s.min; inp.max = kg ? 50 : 100; inp.step = kg ? 0.5 : 1;
  inp.placeholder = "Minimal " + s.min + " " + s.satuan;
}

function updateEstimasi() {
  const s = SERVICES.find(x => x.id === $("layanan").value);
  const kg = parseFloat($("berat").value);
  const h = hitung($("layanan").value, kg);
  $("estLayanan").textContent = s ? s.nama : "-";
  $("estBerat").textContent = kg > 0 ? kg + " " + (s ? s.satuan : "kg") : "-";
  $("estWaktu").textContent = s ? s.estimasi : "-";
  $("estSub").textContent = rupiah(h.subtotal);
  $("estOngkir").textContent = h.subtotal ? (h.ongkir ? rupiah(h.ongkir) : "Gratis") : rupiah(0);
  $("estTotal").textContent = rupiah(h.total);
  const b = bayarDipilih();
  $("payInfo").innerHTML = b === "transfer"
    ? "Rincian pembayaran transfer akan <strong>dikirim admin lewat WhatsApp</strong> setelah Anda memesan."
    : b === "tunai"
    ? "Pembayaran dilakukan <strong>secara langsung kepada petugas laundry</strong> saat penjemputan atau pengantaran."
    : "Pilih metode pembayaran.";
}

function validasi() {
  const e = {};
  if ($("nama").value.trim().length < 3) e.nama = "Nama minimal 3 karakter.";
  if (!/^(\+62|62|0)8[0-9]{8,12}$/.test($("wa").value.replace(/[\s-]/g, ""))) e.wa = "Nomor WhatsApp tidak valid. Contoh: 081234567890.";
  if ($("alamat").value.trim().length < 10) e.alamat = "Alamat minimal 10 karakter. Sertakan nama jalan dan nomor rumah.";
  if (!$("layanan").value) e.layanan = "Pilih jenis layanan.";
  const kg = parseFloat($("berat").value);
  const sv = SERVICES.find(x => x.id === $("layanan").value);
  if (sv) {
    const maks = sv.satuan === "kg" ? 50 : 100;
    if (!(kg >= sv.min && kg <= maks)) e.berat = `${sv.satuan === "kg" ? "Berat" : "Jumlah"} ${sv.nama} minimal ${sv.min} ${sv.satuan} dan maksimal ${maks} ${sv.satuan}.`;
    else if (sv.satuan === "pcs" && !Number.isInteger(kg)) e.berat = "Jumlah satuan harus bilangan bulat.";
  } else if (!(kg >= 1)) e.berat = "Isi berat atau jumlah laundry.";
  const t = $("tanggal").value;
  if (!t) e.tanggal = "Pilih tanggal penjemputan.";
  else if (t < hariIni()) e.tanggal = "Tanggal tidak boleh sebelum hari ini.";
  if (!$("waktu").value) e.waktu = "Pilih waktu penjemputan.";
  if (!bayarDipilih()) e.bayar = "Pilih metode pembayaran.";
  return e;
}

function tampilError(e) {
  FIELDS.forEach(k => {
    $("err-" + k).textContent = e[k] || "";
    const el = $(k);
    if (el) el.classList.toggle("invalid", !!e[k]);
  });
  const first = FIELDS.find(k => e[k]);
  if (first) {
    const el = $(first) || document.querySelector(".pay-options");
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    if (el.focus) el.focus({ preventScroll: true });
  }
}

function ringkasanHTML() {
  const d = draft;
  return `
    <h3>Periksa pesanan Anda</h3>
    <dl class="sum">
      <div><dt>Nama</dt><dd>${esc(d.nama)}</dd></div>
      <div><dt>WhatsApp</dt><dd>${esc(d.wa)}</dd></div>
      <div><dt>Alamat</dt><dd>${esc(d.alamat)}</dd></div>
      <div><dt>Layanan</dt><dd>${esc(d.layanan)} (${esc(d.estimasi)})</dd></div>
      <div><dt>Jumlah</dt><dd>${d.kg} ${d.satuan}</dd></div>
      <div><dt>Jemput</dt><dd>${fmtTanggal(d.tanggal)}, ${esc(d.waktu)}</dd></div>
      <div><dt>Catatan</dt><dd>${esc(d.catatan) || "-"}</dd></div>
      <div><dt>Pembayaran</dt><dd>${metodeBayar(d.bayar)}</dd></div>
      <div><dt>Biaya cuci</dt><dd>${rupiah(d.subtotal)}</dd></div>
      <div><dt>Antar-jemput</dt><dd>${d.ongkir ? rupiah(d.ongkir) : "Gratis"}</dd></div>
      <div><dt><strong>Total</strong></dt><dd><strong>${rupiah(d.total)}</strong></dd></div>
    </dl>
    <div class="pay-info">${$("payInfo").innerHTML}</div>
    <div class="dlg-actions" style="margin-top:18px">
      <button class="btn btn-outline" data-aksi="ubah">Ubah data</button>
      <button class="btn" data-aksi="konfirmasi">Konfirmasi pesanan</button>
    </div>`;
}

// Kartu pembayaran transfer: jumlah yang harus dibayar dan langkah-langkahnya (rekening dikirim admin lewat WhatsApp)
function bayarTransferHTML(o) {
  return `<div class="pay-card">
    <h4>🏦 Pembayaran transfer bank</h4>
    <div class="pay-row"><span>Jumlah yang dibayar</span><strong class="rek-total">${rupiah(o.total)}</strong>
      <button class="btn btn-outline btn-sm" data-copy="${o.total}">Salin</button></div>
    <ol class="pay-steps">
      <li>Tekan tombol hijau di bawah untuk mengirim pesanan ke <strong>WhatsApp admin</strong>.</li>
      <li>Admin akan membalas dengan <strong>rincian pembayaran</strong> (rekening atau QRIS).</li>
      <li>Transfer <strong>tepat sesuai jumlah</strong>, lalu kirim <strong>bukti transfer</strong> di chat yang sama.</li>
    </ol>
  </div>`;
}

function suksesHTML(o) {
  const transfer = o.bayar === "transfer";
  return `
    <div style="text-align:center">
      <div class="ok-icon">✅</div>
      <h3>Pesanan tersimpan</h3>
      <p class="muted">Simpan kode ini untuk mengecek status pesanan.</p>
      <div class="kode-box" id="kodeText">${o.kode}</div>
    </div>
    ${transfer ? bayarTransferHTML(o) : ""}
    <div class="pay-info" id="waInfo">${transfer
      ? "📲 Tekan tombol hijau di bawah untuk mengirim pesanan ke WhatsApp admin. Admin akan membalas dengan <strong>rincian pembayaran</strong>."
      : "💵 Bayar <strong>tunai langsung ke petugas</strong> saat penjemputan atau pengantaran. WhatsApp admin terbuka otomatis, <strong>tekan Kirim</strong> agar pesanan Anda diterima."}</div>
    <div class="dlg-actions" style="justify-content:center;margin-top:14px">
      <button class="btn" data-aksi="wa">${transfer ? "Kirim pesanan ke WhatsApp Admin" : "Kirim ke WhatsApp Admin"}</button>
      <button class="btn btn-outline" data-aksi="salin">Salin kode</button>
      <a class="btn btn-outline" href="status.html?kode=${o.kode}">Lihat status</a>
    </div>`;
}

// Buka WhatsApp admin dengan isi pesanan. Jika pop-up diblokir browser, beri tahu pengguna.
function kirimWA(o) {
  const w = window.open(pesanWA(o), "_blank");
  const info = $("waInfo");
  if (!w && info) info.innerHTML = '⚠️ Browser memblokir pop-up. Tekan tombol <strong>Kirim ke WhatsApp Admin</strong> di bawah untuk mengirim pesanan.';
  if (w) w.opener = null;
}

// Form dikirim -> validasi -> tampilkan ringkasan
form.addEventListener("submit", ev => {
  ev.preventDefault();
  const e = validasi();
  tampilError(e);
  if (Object.keys(e).length) return;
  const s = SERVICES.find(x => x.id === $("layanan").value);
  const kg = parseFloat($("berat").value);
  draft = {
    nama: $("nama").value.trim(), wa: $("wa").value.trim(), alamat: $("alamat").value.trim(),
    layananId: s.id, layanan: s.nama, estimasi: s.estimasi, kg, satuan: s.satuan,
    tanggal: $("tanggal").value, waktu: $("waktu").value, catatan: $("catatan").value.trim(),
    bayar: bayarDipilih(), ...hitung(s.id, kg)
  };
  dlgBody.innerHTML = ringkasanHTML();
  dlg.showModal();
});

// Tombol di dalam dialog
dlgBody.addEventListener("click", ev => {
  const aksi = ev.target.dataset.aksi;
  if (aksi === "ubah") dlg.close();
  if (aksi === "konfirmasi") {
    const order = { ...draft, kode: buatKode(), status: 0, dibuat: new Date().toISOString() };
    const list = getOrders();
    list.unshift(order);
    saveOrders(list);
    terakhir = order;
    dlgBody.innerHTML = suksesHTML(order);
    form.reset();
    updateEstimasi();
    // Tunai: langsung buka WhatsApp admin. Transfer: tampilkan dulu rekening, WhatsApp dibuka setelah pelanggan menekan tombol.
    if (order.bayar !== "transfer") kirimWA(order);
  }
  if (ev.target.dataset.copy && navigator.clipboard) {
    const tombol = ev.target;
    navigator.clipboard.writeText(tombol.dataset.copy).then(() => { tombol.textContent = "Tersalin ✓"; });
  }
  if (aksi === "wa" && terakhir) kirimWA(terakhir);
  if (aksi === "salin") {
    const kode = $("kodeText").textContent;
    if (navigator.clipboard) navigator.clipboard.writeText(kode).then(() => ev.target.textContent = "Tersalin ✓");
  }
});

form.addEventListener("input", updateEstimasi);
form.addEventListener("change", () => { aturJumlah(); updateEstimasi(); });
aturJumlah();
updateEstimasi();
window.PESAN_SIAP = true; // tanda ke pesan.html bahwa formulir sudah aktif