/* ===== NR57Laundry - status.js =====
   Cek status pesanan berdasarkan kode. */
const $ = id => document.getElementById(id);

function tampil(kodeInput) {
  const kode = kodeInput.trim().toUpperCase();
  const box = $("hasil");
  if (!kode) { box.innerHTML = `<p class="empty">Masukkan kode pesanan terlebih dahulu.</p>`; return; }
  const o = getOrders().find(x => x.kode === kode);
  if (!o) {
    box.innerHTML = `<div class="card empty"><strong>Pesanan tidak ditemukan.</strong><br>Periksa kembali kode ${esc(kode)} dan pastikan Anda memakai browser yang sama saat memesan.</div>`;
    return;
  }
  box.innerHTML = `
    <div class="card">
      <h3>${esc(o.kode)}</h3>
      <p>Status saat ini: <span class="badge s${o.status}">${STATUSES[o.status]}</span></p>
      <ol class="timeline">
        ${STATUSES.map((s, i) => `<li class="${i < o.status ? "done" : i === o.status ? "current" : ""}">${s}</li>`).join("")}
      </ol>
      <dl class="sum">
        <div><dt>Pelanggan</dt><dd>${esc(o.nama)}</dd></div>
        <div><dt>Layanan</dt><dd>${esc(o.layanan)} - ${fmtJumlah(o)}</dd></div>
        <div><dt>Jemput</dt><dd>${fmtTanggal(o.tanggal)}, ${esc(o.waktu)}</dd></div>
        <div><dt>Pembayaran</dt><dd>${metodeBayar(o.bayar)}</dd></div>
        <div><dt><strong>Total</strong></dt><dd><strong>${rupiah(o.total)}</strong></dd></div>
      </dl>
    </div>`;
}

$("formCari").addEventListener("submit", e => { e.preventDefault(); tampil($("kode").value); });

const dariUrl = new URLSearchParams(location.search).get("kode");
if (dariUrl) { $("kode").value = dariUrl; tampil(dariUrl); }