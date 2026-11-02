/* Browser menganggap "localhost" dan "127.0.0.1" sebagai situs berbeda, sehingga data
   (pesanan dan akun admin) terpisah. Samakan ke 127.0.0.1 agar data tidak "hilang". */
if (location.hostname === "localhost") location.replace(location.href.replace("//localhost", "//127.0.0.1"));

/* ===== NR57Laundry - data.js =====
   Data bersama + fungsi bantu. Wajib dimuat PALING AWAL di setiap halaman. */

// Daftar layanan. Ubah harga/estimasi di sini, semua halaman ikut berubah.
// satuan: "kg" = harga per kilogram, "pcs" = harga per potong. min = jumlah minimum pesanan.
const SERVICES = [
  // ----- Laundry Kiloan -----
  { id: "reguler",     grup: "Laundry Kiloan", satuan: "kg", min: 5, nama: "Paket Reguler",  ikon: "👕", harga: 7000,  estimasi: "2-3 hari", desk: "Cuci, setrika, dan lipat. Minimal 5 kg. Cucian selesai dalam 2-3 hari (prioritas kedua)." },
  { id: "premium",     grup: "Laundry Kiloan", satuan: "kg", min: 3, nama: "Paket Premium",  ikon: "✨", harga: 10000, estimasi: "1 hari",   desk: "Cuci, setrika, lipat, dan pilih aroma parfum premium. Minimal 3 kg, 1 customer 1 mesin, selesai 1 hari (prioritas utama)." },
  { id: "express-3",   grup: "Laundry Kiloan", satuan: "kg", min: 3, nama: "Express 3 Jam",  ikon: "⚡", harga: 20000, estimasi: "3 jam",    desk: "Berlaku untuk Paket Premium. Cucian selesai dalam 3 jam." },
  { id: "express-10",  grup: "Laundry Kiloan", satuan: "kg", min: 3, nama: "Express 10 Jam", ikon: "⏱️", harga: 15000, estimasi: "10 jam",   desk: "Berlaku untuk Paket Premium. Cucian selesai dalam 10 jam." },
  { id: "cuci-kering", grup: "Laundry Kiloan", satuan: "kg", min: 5, nama: "Cuci Kering",    ikon: "🫧", harga: 5000,  estimasi: "Sesuai antrean", desk: "Dicuci bersih dan dikeringkan. Minimal 5 kg." },
  // ----- Laundry Satuan (harga per pcs) -----
  { id: "bedcover-xl", grup: "Laundry Satuan", satuan: "pcs", min: 1, nama: "Bed Cover Besar (XL)",   ikon: "🛏️", harga: 30000, estimasi: "Sesuai antrean", desk: "" },
  { id: "bedcover-l",  grup: "Laundry Satuan", satuan: "pcs", min: 1, nama: "Bed Cover Sedang (L)",   ikon: "🛏️", harga: 25000, estimasi: "Sesuai antrean", desk: "" },
  { id: "bedcover-s",  grup: "Laundry Satuan", satuan: "pcs", min: 1, nama: "Bed Cover Kecil (S)",    ikon: "🛏️", harga: 20000, estimasi: "Sesuai antrean", desk: "" },
  { id: "selimut",     grup: "Laundry Satuan", satuan: "pcs", min: 1, nama: "Selimut",                ikon: "🧺", harga: 20000, estimasi: "Sesuai antrean", desk: "" },
  { id: "sprei",       grup: "Laundry Satuan", satuan: "pcs", min: 1, nama: "Sprei",                  ikon: "🧺", harga: 15000, estimasi: "Sesuai antrean", desk: "" },
  { id: "baju-kaos",   grup: "Laundry Satuan", satuan: "pcs", min: 1, nama: "Baju Kaos",              ikon: "🧺", harga: 10000, estimasi: "Sesuai antrean", desk: "" },
  { id: "kemeja-pdh",  grup: "Laundry Satuan", satuan: "pcs", min: 1, nama: "Kemeja/PDH Setelan",     ikon: "🧺", harga: 15000, estimasi: "Sesuai antrean", desk: "" },
  { id: "celana",      grup: "Laundry Satuan", satuan: "pcs", min: 1, nama: "Celana Bahan/Jeans",     ikon: "🧺", harga: 10000, estimasi: "Sesuai antrean", desk: "" },
  { id: "sweater",     grup: "Laundry Satuan", satuan: "pcs", min: 1, nama: "Sweater/Hoodie",         ikon: "🧺", harga: 15000, estimasi: "Sesuai antrean", desk: "" },
  { id: "jubah",       grup: "Laundry Satuan", satuan: "pcs", min: 1, nama: "Jubah",                  ikon: "🧺", harga: 10000, estimasi: "Sesuai antrean", desk: "" },
  { id: "jas",         grup: "Laundry Satuan", satuan: "pcs", min: 1, nama: "Jas Setelan",            ikon: "🧺", harga: 20000, estimasi: "Sesuai antrean", desk: "" },
  { id: "kebaya",      grup: "Laundry Satuan", satuan: "pcs", min: 1, nama: "Kebaya",                 ikon: "🧺", harga: 20000, estimasi: "Sesuai antrean", desk: "" },
  { id: "gaun",        grup: "Laundry Satuan", satuan: "pcs", min: 1, nama: "Gaun",                   ikon: "🧺", harga: 20000, estimasi: "Sesuai antrean", desk: "" },
  { id: "mukena",      grup: "Laundry Satuan", satuan: "pcs", min: 1, nama: "Mukena",                 ikon: "🧺", harga: 10000, estimasi: "Sesuai antrean", desk: "" },
  { id: "sajadah",     grup: "Laundry Satuan", satuan: "pcs", min: 1, nama: "Sajadah",                ikon: "🧺", harga: 5000,  estimasi: "Sesuai antrean", desk: "" },
  { id: "handuk",      grup: "Laundry Satuan", satuan: "pcs", min: 1, nama: "Handuk",                 ikon: "🧺", harga: 10000, estimasi: "Sesuai antrean", desk: "" },
  { id: "sarung",      grup: "Laundry Satuan", satuan: "pcs", min: 1, nama: "Sarung",                 ikon: "🧺", harga: 5000,  estimasi: "Sesuai antrean", desk: "" },
  { id: "boneka-b",    grup: "Laundry Satuan", satuan: "pcs", min: 1, nama: "Boneka Besar",           ikon: "🧸", harga: 40000, estimasi: "Sesuai antrean", desk: "" },
  { id: "boneka-s",    grup: "Laundry Satuan", satuan: "pcs", min: 1, nama: "Boneka Sedang",          ikon: "🧸", harga: 35000, estimasi: "Sesuai antrean", desk: "" },
  { id: "boneka-k",    grup: "Laundry Satuan", satuan: "pcs", min: 1, nama: "Boneka Kecil",           ikon: "🧸", harga: 30000, estimasi: "Sesuai antrean", desk: "" }
];

// Urutan status pesanan (indeks 0 = status awal)
const STATUSES = [
  "Menunggu konfirmasi", "Pesanan dikonfirmasi", "Laundry dijemput",
  "Sedang dicuci", "Sedang disetrika", "Siap diantar", "Pesanan selesai"
];

// Biaya antar-jemput: gratis jika berat >= minKg
const ONGKIR = { minKg: 3, biaya: 5000 };

// Nomor rekening TIDAK ditampilkan di website.
// Untuk pembayaran transfer, admin mengirim rincian rekening lewat WhatsApp setelah pesanan masuk.

// Nomor WhatsApp ADMIN yang menerima pesanan (format 08xx atau 628xx). Ganti di sini jika berubah.
const ADMIN_WA = "085147553535";

// KODE PEMILIK: cadangan untuk fitur "Lupa kata sandi" admin. GANTI dengan kode rahasia Anda sendiri.
// Catatan: karena ada di file ini, orang yang membuka kode sumber website bisa membacanya.
// Kosongkan ("") jika ingin mematikannya, lalu pakai kode pemulihan saja.
const KODE_PEMILIK = "LAUNDRYGO-PEMILIK-2026";

const STORAGE_KEY = "laundrygo_orders";

function rupiah(n) { return "Rp" + Number(n).toLocaleString("id-ID"); }

function getOrders() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
  catch (e) { return []; }
}
function saveOrders(list) { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); }

// Hitung biaya: harga per kg x berat, ditambah ongkir bila berat di bawah batas gratis
function hitung(serviceId, kg) {
  const s = SERVICES.find(x => x.id === serviceId);
  if (!s || !(kg > 0)) return { subtotal: 0, ongkir: 0, total: 0 };
  const subtotal = Math.round(s.harga * kg);
  // Antar-jemput gratis. Aturan batas berat hanya berlaku untuk layanan per kg (bukan satuan/pcs).
  const ongkir = s.satuan === "kg" && kg < ONGKIR.minKg ? ONGKIR.biaya : 0;
  return { subtotal, ongkir, total: subtotal + ongkir };
}

// Kode unik, contoh: LG-261031-A7K2
function buatKode() {
  const d = new Date(), p = n => String(n).padStart(2, "0");
  const tgl = String(d.getFullYear()).slice(2) + p(d.getMonth() + 1) + p(d.getDate());
  const ada = getOrders().map(o => o.kode);
  let kode;
  do { kode = "LG-" + tgl + "-" + Math.random().toString(36).slice(2, 6).toUpperCase(); }
  while (ada.includes(kode));
  return kode;
}

// Mencegah teks pengguna dibaca sebagai HTML
function esc(t) {
  return String(t ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function fmtTanggal(iso) {
  return new Date(iso + "T00:00:00").toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

function waLink(nomor) {
  let n = String(nomor).replace(/[\s-]/g, "").replace(/^\+/, "");
  if (n.startsWith("0")) n = "62" + n.slice(1);
  return "https://wa.me/" + n;
}

// Tampilkan jumlah pesanan beserta satuannya (pesanan lama tanpa satuan dianggap kg)
function fmtJumlah(o) { return o.kg + " " + (o.satuan || "kg"); }

// Susun teks pesanan untuk dikirim ke WhatsApp admin, lalu kembalikan tautan wa.me berisi pesan itu
function pesanWA(o) {
  const t = [
    "*PESANAN BARU - NR57Laundry*",
    "Kode: " + o.kode,
    "",
    "*Pelanggan*",
    "Nama: " + o.nama,
    "WhatsApp: " + o.wa,
    "Alamat: " + o.alamat,
    "",
    "*Pesanan*",
    "Layanan: " + o.layanan + " (" + o.estimasi + ")",
    "Jumlah: " + o.kg + " " + (o.satuan || "kg"),
    "Jemput: " + fmtTanggal(o.tanggal) + ", " + o.waktu,
    "Catatan: " + (o.catatan || "-"),
    "",
    "*Pembayaran:* " + metodeBayar(o.bayar) + (o.bayar === "transfer" ? " (mohon kirim rincian pembayaran, bukti transfer saya kirim di chat ini)" : ""),
    "Biaya cuci: " + rupiah(o.subtotal),
    "Antar-jemput: " + (o.ongkir ? rupiah(o.ongkir) : "Gratis"),
    "*Total: " + rupiah(o.total) + "*"
  ].join("\n");
  return waLink(ADMIN_WA) + "?text=" + encodeURIComponent(t);
}

function metodeBayar(b) { return b === "transfer" ? "Transfer bank" : "Tunai (Cash)"; }

/* ===== Pengaturan, login, dan sesi (ditambahkan untuk fitur login & panel admin) ===== */
const SETTINGS_KEY = "laundrygo_settings";
const ADMIN_SESSION = "laundrygo_admin";
const CUSTOMER_KEY = "laundrygo_customer";

function getSettings() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY + "_settings")) || {}; } catch (e) { return {}; }
}
function saveSettings(s) { localStorage.setItem(STORAGE_KEY + "_settings", JSON.stringify(s)); }

// Terapkan pengaturan yang disimpan admin (harga, estimasi, ongkir)
// Dibungkus try/catch: data pengaturan yang rusak tidak boleh merusak daftar layanan.
(function () {
  try {
    const s = getSettings();
    SERVICES.forEach(v => {
      if (s.harga && s.harga[v.id] > 0) v.harga = Number(s.harga[v.id]);
      if (s.estimasi && typeof s.estimasi[v.id] === "string" && s.estimasi[v.id]) v.estimasi = s.estimasi[v.id];
    });
    if (s.rekening) { delete s.rekening; saveSettings(s); } // hapus nomor rekening lama yang pernah tersimpan di browser ini
    if (s.ongkir && typeof s.ongkir === "object") Object.assign(ONGKIR, s.ongkir);
  } catch (e) { console.warn("[NR57Laundry] Pengaturan tersimpan diabaikan:", e); }
})();

// ===== Akun admin =====
// Dibuat sendiri saat pertama kali masuk (tidak ada password bawaan).
// Password dan kode pemulihan disimpan dalam bentuk hash, bukan teks asli.
// Akun versi lama yang menyimpan password biasa tetap bisa dipakai.
function getAdmin() {
  const a = getSettings().admin;
  return a && a.user && (a.passHash || a.pass) ? a : null;
}
function hasAdmin() { return !!getAdmin(); }
// Akun lama (password teks biasa) tetap mengembalikan "pass" agar file login versi lama tidak selalu menolak
function adminCreds() {
  const a = getAdmin();
  if (!a) return null;
  return a.pass && !a.passHash ? { user: a.user, pass: a.pass } : { user: a.user };
}

function hashDjb(s) {
  let h = 5381;
  for (const c of s) h = ((h * 33) ^ c.charCodeAt(0)) >>> 0;
  return "d:" + h.toString(16);
}
async function hashText(t, tanpaCrypto) {
  const s = "laundrygo::" + t;
  if (!tanpaCrypto && window.crypto && crypto.subtle) {
    const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
    return "s:" + Array.from(new Uint8Array(b)).map(x => x.toString(16).padStart(2, "0")).join("");
  }
  return hashDjb(s);
}
async function cocok(tersimpan, t) {
  if (!tersimpan) return false;
  if (tersimpan.startsWith("d:")) return tersimpan === await hashText(t, true);
  if (!(window.crypto && crypto.subtle)) return false;
  return tersimpan === await hashText(t);
}

// Kode pemulihan, contoh: K7M2-9QXD-4TNB (tanpa huruf/angka yang mirip: 0 O 1 I)
const HURUF_KODE = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function buatKodePemulihan() {
  const a = new Uint8Array(12);
  crypto.getRandomValues(a);
  const t = Array.from(a, x => HURUF_KODE[x % HURUF_KODE.length]).join("");
  return t.slice(0, 4) + "-" + t.slice(4, 8) + "-" + t.slice(8);
}
function normKode(k) { return String(k || "").toUpperCase().replace(/[^A-Z0-9]/g, ""); }

// Buat akun baru. Mengembalikan kode pemulihan (tampilkan SEKALI kepada admin).
async function simpanAdmin(user, pass) {
  const kode = buatKodePemulihan();
  const st = getSettings();
  st.admin = { user, passHash: await hashText(pass), rec: await hashText(normKode(kode)) };
  saveSettings(st);
  return kode;
}
// Ganti username/password dari panel admin (kode pemulihan lama tetap berlaku)
async function ubahAkun(user, pass) {
  const st = getSettings();
  const rec = (st.admin || {}).rec;
  st.admin = { user, passHash: await hashText(pass) };
  if (rec) st.admin.rec = rec;
  saveSettings(st);
}
// Buat kode pemulihan baru (kode lama tidak berlaku lagi)
async function buatKodeBaru() {
  const st = getSettings();
  if (!st.admin) return null;
  const kode = buatKodePemulihan();
  st.admin.rec = await hashText(normKode(kode));
  saveSettings(st);
  return kode;
}
async function cekAdmin(user, pass) {
  const a = getAdmin();
  if (!a || String(user).trim().toLowerCase() !== String(a.user).toLowerCase()) return false; // username tidak peka huruf besar/kecil
  return a.passHash ? cocok(a.passHash, pass) : pass === a.pass;
}
// Lupa kata sandi: kode pemulihan ATAU kode pemilik (KODE_PEMILIK di atas).
// Jika benar, password diganti dan kode pemulihan baru dibuat. Mengembalikan kode baru, atau null jika salah.
async function resetAdmin(kode, passBaru) {
  const a = getAdmin(), k = normKode(kode), pemilik = normKode(KODE_PEMILIK);
  if (!a || !k) return null;
  const sah = (pemilik && k === pemilik) || (a.rec && await cocok(a.rec, k));
  if (!sah) return null;
  return simpanAdmin(a.user, passBaru);
}

// Pembatas percobaan: 5 kali salah -> tunggu 30 detik
const LOCK_KEY = "laundrygo_lock";
function sisaKunci() {
  try { const l = JSON.parse(localStorage.getItem(LOCK_KEY) || "{}"); return Math.max(0, Math.ceil(((l.sampai || 0) - Date.now()) / 1000)); }
  catch (e) { return 0; }
}
function catatGagal() {
  let l = {};
  try { l = JSON.parse(localStorage.getItem(LOCK_KEY) || "{}"); } catch (e) {}
  l.n = (l.n || 0) + 1;
  if (l.n >= 5) { l.sampai = Date.now() + 30000; l.n = 0; }
  localStorage.setItem(LOCK_KEY, JSON.stringify(l));
}
function hapusGagal() { localStorage.removeItem(LOCK_KEY); }
function isAdmin() { return sessionStorage.getItem(ADMIN_SESSION) === "1"; }

/* ===== Logo NR57Laundry (tertanam di kode, tidak butuh folder img) =====
   Mengganti ikon/logo lama di SEMUA halaman, termasuk menu yang dibuat main.js. */
(function () {
  const LOGO = "data:image/png;base64,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";

  function pasang() {
    document.querySelectorAll(".logo").forEach(function (a) {
      if (a.dataset.logoSudah) return;
      a.dataset.logoSudah = "1";
      const img = document.createElement("img");
      img.src = LOGO; img.alt = ""; img.width = 40; img.height = 40;
      img.style.cssText = "width:40px;height:40px;border-radius:50%;object-fit:cover;flex-shrink:0;background:#fff;display:block";
      const lama = a.querySelector(":scope > span, :scope > img");
      if (lama) lama.replaceWith(img); else a.prepend(img);
    });
    let ikon = document.querySelector('link[rel~="icon"]');
    if (!ikon) { ikon = document.createElement("link"); ikon.rel = "icon"; document.head.appendChild(ikon); }
    if (ikon.href !== LOGO) { ikon.type = "image/png"; ikon.href = LOGO; }
  }

  function mulai() {
    pasang();
    // Menu yang dibuat belakangan oleh main.js ikut diganti otomatis
    new MutationObserver(pasang).observe(document.body, { childList: true, subtree: true });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mulai);
  else mulai();
})();