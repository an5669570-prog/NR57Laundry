/* ===== NR57Laundry - login.js =====
   Halaman awal: Pelanggan (tanpa sandi) atau Admin (username + password).
   Admin pertama kali membuat akun + mendapat kode pemulihan; ada menu "Lupa kata sandi?". */
const $ = id => document.getElementById(id);
const dlg = $("dlg"), dlgBody = $("dlgBody");

// Pengaman: semua file harus dari versi yang sama. Jika tidak, tampilkan petunjuk (bukan "password salah").
if (typeof cekAdmin !== "function" || typeof resetAdmin !== "function" || typeof simpanAdmin !== "function") {
  const box = document.querySelector(".auth-form");
  if (box) box.insertAdjacentHTML("afterbegin", '<div class="sync-warn"><strong>File website tidak sinkron.</strong> Ganti SEMUA file dengan isi NR57Laundry.zip terbaru (terutama <code>data.js</code> dan <code>login.js</code>), lalu tekan Ctrl+F5.</div>');
  throw new Error("data.js dan login.js tidak sinkron");
}
const FORMS = ["formPelanggan", "formAdmin", "formSetup", "formLupa"];

function tampilForm(nama) { FORMS.forEach(f => $(f).hidden = f !== nama); }

function pilih(role) {
  document.querySelectorAll(".role-tab").forEach(b => {
    const on = b.dataset.role === role;
    b.classList.toggle("active", on);
    b.setAttribute("aria-selected", on);
  });
  if (role === "pelanggan") tampilForm("formPelanggan");
  else tampilForm(hasAdmin() ? "formAdmin" : "formSetup"); // sudah punya akun -> login; belum -> buat akun
}
document.querySelectorAll(".role-tab").forEach(b => b.addEventListener("click", () => pilih(b.dataset.role)));

if (new URLSearchParams(location.search).get("role") === "admin") {
  if (isAdmin() && hasAdmin()) location.replace("admin.html");
  pilih("admin");
}

// Jika terlalu sering salah, minta menunggu sebentar
function terkunci(errEl) {
  const d = sisaKunci();
  if (d > 0) { errEl.textContent = `Terlalu banyak percobaan. Coba lagi dalam ${d} detik.`; return true; }
  return false;
}

// Tampilkan kode pemulihan (sekali), lalu lanjut ke panel admin
function tampilKode(kode, tujuan) {
  dlgBody.innerHTML = `
    <div style="text-align:center">
      <div class="ok-icon">🔑</div>
      <h3>Simpan kode pemulihan Anda</h3>
      <p class="muted">Dipakai jika Anda lupa kata sandi. Hanya ditampilkan sekali, jadi catat atau salin sekarang.</p>
      <div class="kode-box" id="kodePulih">${kode}</div>
      <div class="dlg-actions" style="justify-content:center">
        <button class="btn btn-outline" data-aksi="salin">Salin kode</button>
        <button class="btn" data-aksi="lanjut">Sudah saya simpan, lanjut</button>
      </div>
    </div>`;
  dlgBody.dataset.tujuan = tujuan;
  dlg.showModal();
}
dlg.addEventListener("cancel", e => e.preventDefault()); // harus klik "lanjut" supaya kode tidak terlewat
dlgBody.addEventListener("click", e => {
  const aksi = e.target.dataset.aksi;
  if (aksi === "lanjut") location.href = dlgBody.dataset.tujuan || "admin.html";
  if (aksi === "salin" && navigator.clipboard)
    navigator.clipboard.writeText($("kodePulih").textContent).then(() => e.target.textContent = "Tersalin ✓");
});

// Pelanggan: tidak perlu sandi
$("formPelanggan").addEventListener("submit", e => {
  e.preventDefault();
  const nama = $("pNama").value.trim(), wa = $("pWa").value.trim();
  let ok = true;
  $("err-pNama").textContent = ""; $("err-pWa").textContent = "";
  if (nama && nama.length < 3) { $("err-pNama").textContent = "Nama minimal 3 karakter."; ok = false; }
  if (wa && !/^(\+62|62|0)8[0-9]{8,12}$/.test(wa.replace(/[\s-]/g, ""))) { $("err-pWa").textContent = "Nomor WhatsApp tidak valid. Contoh: 081234567890."; ok = false; }
  if (!ok) return;
  if (nama || wa) localStorage.setItem(CUSTOMER_KEY, JSON.stringify({ nama, wa }));
  else localStorage.removeItem(CUSTOMER_KEY);
  location.href = "beranda.html";
});

// Admin pertama kali: buat akun, tampilkan kode pemulihan, lalu masuk
$("formSetup").addEventListener("submit", async e => {
  e.preventDefault();
  const user = $("sUser").value.trim(), pass = $("sPass").value, pass2 = $("sPass2").value;
  const err = $("err-setup");
  if (user.length < 3) return void (err.textContent = "Username minimal 3 karakter.");
  if (pass.length < 6) return void (err.textContent = "Password minimal 6 karakter.");
  if (pass !== pass2) return void (err.textContent = "Ulangi password tidak sama dengan password.");
  const kode = await simpanAdmin(user, pass);
  sessionStorage.setItem(ADMIN_SESSION, "1");
  tampilKode(kode, "admin.html");
});

function bukaLupa() { $("err-lupa").textContent = ""; tampilForm("formLupa"); $("lKode").focus(); }

// Admin: wajib username + password
$("formAdmin").addEventListener("submit", async e => {
  e.preventDefault();
  const err = $("err-admin");
  if (terkunci(err)) return;
  if (await cekAdmin($("aUser").value.trim(), $("aPass").value)) {
    hapusGagal();
    sessionStorage.setItem(ADMIN_SESSION, "1");
    location.href = "admin.html";
  } else {
    catatGagal();
    // Saat sandi salah, langsung tawarkan reset
    err.innerHTML = 'Username atau password salah. <a href="#" id="errLupa"><strong>Lupa kata sandi? Reset di sini</strong></a>';
    $("errLupa").addEventListener("click", ev => { ev.preventDefault(); bukaLupa(); });
    $("aPass").value = "";
    $("aPass").focus();
  }
});

// Lupa kata sandi
$("linkLupa").addEventListener("click", e => { e.preventDefault(); bukaLupa(); });
$("linkKembali").addEventListener("click", e => { e.preventDefault(); tampilForm("formAdmin"); });
$("formLupa").addEventListener("submit", async e => {
  e.preventDefault();
  const err = $("err-lupa");
  const kode = $("lKode").value, p1 = $("lPass").value, p2 = $("lPass2").value;
  err.textContent = "";
  if (!kode.trim()) return void (err.textContent = "Masukkan kode pemulihan atau kode pemilik.");
  if (p1.length < 6) return void (err.textContent = "Kata sandi baru minimal 6 karakter.");
  if (p1 !== p2) return void (err.textContent = "Ulangi kata sandi tidak sama dengan kata sandi baru.");
  if (terkunci(err)) return;
  const kodeBaru = await resetAdmin(kode, p1);
  if (!kodeBaru) {
    catatGagal();
    err.textContent = "Kode tidak cocok. Periksa lagi kode pemulihan atau kode pemilik Anda.";
    return;
  }
  hapusGagal();
  sessionStorage.setItem(ADMIN_SESSION, "1");
  tampilKode(kodeBaru, "admin.html"); // kode lama sudah tidak berlaku; simpan yang baru
});

// Tombol Lihat/Sembunyi password
document.querySelectorAll(".pass-toggle").forEach(btn => btn.addEventListener("click", () => {
  const ids = btn.dataset.for.split(",");
  const tampil = $(ids[0]).type === "password";
  ids.forEach(id => $(id).type = tampil ? "text" : "password");
  btn.textContent = tampil ? "Sembunyi" : "Lihat";
}));