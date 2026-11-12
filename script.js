// Data State
let reports = [];
let schedules = [];
let userPoints = 120;
let currentPreviewBase64 = null;

// Inisialisasi Aplikasi saat Dokumen Siap
document.addEventListener('DOMContentLoaded', () => {
  // Load data dari LocalStorage
  const savedReports = localStorage.getItem('wastewise_reports');
  const savedSchedules = localStorage.getItem('wastewise_schedules');
  const savedPoints = localStorage.getItem('wastewise_points');

  if (savedReports) reports = JSON.parse(savedReports);
  if (savedSchedules) schedules = JSON.parse(savedSchedules);
  if (savedPoints) userPoints = parseInt(savedPoints);

  // Atur default tanggal & waktu pada input
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  document.getElementById('waktu').value = now.toISOString().slice(0, 16);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  document.getElementById('tglJadwal').value = tomorrow.toISOString().split('T')[0];

  updatePointsUI();
  renderReports();
  renderSchedules();
  lucide.createIcons();
});

// Navigasi Tab (Pelaporan vs Penjadwalan)
function switchTab(tab) {
  const secLapor = document.getElementById('sec-lapor');
  const secJadwal = document.getElementById('sec-jadwal');
  
  const navLapor = document.getElementById('nav-lapor');
  const navJadwal = document.getElementById('nav-jadwal');
  const mobLapor = document.getElementById('mob-lapor');
  const mobJadwal = document.getElementById('mob-jadwal');

  if (tab === 'lapor') {
    secLapor.classList.remove('hidden');
    secLapor.classList.add('grid');
    secJadwal.classList.add('hidden');
    secJadwal.classList.remove('grid');

    navLapor.classList.add('active');
    navJadwal.classList.remove('active');
    mobLapor.classList.add('active');
    mobJadwal.classList.remove('active');
  } else {
    secJadwal.classList.remove('hidden');
    secJadwal.classList.add('grid');
    secLapor.classList.add('hidden');
    secLapor.classList.remove('grid');

    navJadwal.classList.add('active');
    navLapor.classList.remove('active');
    mobJadwal.classList.add('active');
    mobLapor.classList.remove('active');
  }
}

// Handler Preview Foto
function handleImagePreview(input) {
  const file = input.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      currentPreviewBase64 = e.target.result;
      document.getElementById('previewImg').src = currentPreviewBase64;
      document.getElementById('uploadPlaceholder').classList.add('hidden');
      document.getElementById('uploadPreview').classList.remove('hidden');
      document.getElementById('uploadPreview').classList.add('flex');
    };
    reader.readAsDataURL(file);
  }
}

// Reset Form Foto
function resetPhotoPreview() {
  currentPreviewBase64 = null;
  document.getElementById('fotoInput').value = '';
  document.getElementById('uploadPlaceholder').classList.remove('hidden');
  document.getElementById('uploadPreview').classList.add('hidden');
  document.getElementById('uploadPreview').classList.remove('flex');
}

// Submit Laporan Sampah
function handleReportSubmit(e) {
  e.preventDefault();
  
  const lokasi = document.getElementById('lokasi').value;
  const kategori = document.getElementById('kategori').value;
  const waktu = document.getElementById('waktu').value;
  const keterangan = document.getElementById('keterangan').value;

  const newReport = {
    id: Date.now(),
    lokasi,
    kategori,
    waktu,
    keterangan: keterangan || 'Tidak ada keterangan tambahan.',
    foto: currentPreviewBase64,
    status: 'Menunggu Verifikasi',
    createdAt: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
  };

  reports.unshift(newReport);
  userPoints += 15; // Beri poin tiap laporan

  saveData();
  renderReports();
  updatePointsUI();

  document.getElementById('reportForm').reset();
  resetPhotoPreview();
  showToast('Laporan Anda berhasil dikirim! (+15 Eko-Poin)');
}

// Submit Jadwal Pengangkutan
function handleScheduleSubmit(e) {
  e.preventDefault();

  const tglJadwal = document.getElementById('tglJadwal').value;
  const sesiWaktu = document.getElementById('sesiWaktu').value;
  const jenisJadwal = document.getElementById('jenisJadwal').value;
  const alamatJadwal = document.getElementById('alamatJadwal').value;

  const newSchedule = {
    id: Date.now(),
    tglJadwal,
    sesiWaktu,
    jenisJadwal,
    alamatJadwal,
    status: 'Terjadwal'
  };

  schedules.unshift(newSchedule);
  saveData();
  renderSchedules();

  document.getElementById('scheduleForm').reset();
  showToast('Jadwal penjemputan berhasil dikonfirmasi!');
}

// Render Riwayat Laporan Sampah
function renderReports() {
  const container = document.getElementById('reportsList');
  document.getElementById('reportCount').innerText = reports.length;

  if (reports.length === 0) {
    container.innerHTML = `
      <div class="text-center py-8 text-slate-400">
        <i data-lucide="inbox" class="w-10 h-10 mx-auto mb-2 opacity-50"></i>
        <p class="text-xs">Belum ada laporan sampah dikirim.</p>
      </div>
    `;
    lucide.createIcons();
    return;
  }

  container.innerHTML = reports.map(r => `
    <div class="p-3.5 bg-slate-50 border border-slate-200/60 rounded-xl flex flex-col gap-2">
      <div class="flex items-start justify-between gap-2">
        <div>
          <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 uppercase tracking-wider">${r.kategori}</span>
          <h4 class="text-xs font-bold text-slate-800 mt-1">${r.lokasi}</h4>
        </div>
        <span class="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full font-medium whitespace-nowrap">${r.status}</span>
      </div>
      
      ${r.foto ? `<img src="${r.foto}" class="w-full h-24 object-cover rounded-lg border border-slate-200 mt-1" alt="Foto">` : ''}

      <p class="text-xs text-slate-600 bg-white p-2 rounded-lg border border-slate-100">${r.keterangan}</p>
      
      <div class="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-200/50">
        <span>${r.createdAt}</span>
        <button onclick="deleteReport(${r.id})" class="text-rose-500 hover:text-rose-700 font-semibold flex items-center gap-1">
          <i data-lucide="trash-2" class="w-3 h-3"></i> Hapus
        </button>
      </div>
    </div>
  `).join('');

  lucide.createIcons();
}

// Render Daftar Jadwal Penjemputan
function renderSchedules() {
  const container = document.getElementById('schedulesList');
  document.getElementById('scheduleCount').innerText = schedules.length;

  if (schedules.length === 0) {
    container.innerHTML = `
      <div class="text-center py-8 text-slate-400">
        <i data-lucide="calendar-x" class="w-10 h-10 mx-auto mb-2 opacity-50"></i>
        <p class="text-xs">Belum ada jadwal penjemputan aktif.</p>
      </div>
    `;
    lucide.createIcons();
    return;
  }

  container.innerHTML = schedules.map(s => {
    const formattedDate = new Date(s.tglJadwal).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    return `
      <div class="p-3.5 bg-slate-50 border border-slate-200/60 rounded-xl flex flex-col gap-2">
        <div class="flex items-start justify-between gap-2">
          <div>
            <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-100 text-teal-800">${s.jenisJadwal}</span>
            <h4 class="text-xs font-bold text-slate-800 mt-1">${formattedDate}</h4>
          </div>
          <span class="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-medium">${s.status}</span>
        </div>

        <div class="text-xs text-slate-600 space-y-1 bg-white p-2.5 rounded-lg border border-slate-100">
          <div class="flex items-center gap-1.5">
            <i data-lucide="clock" class="w-3.5 h-3.5 text-teal-600"></i>
            <span>${s.sesiWaktu}</span>
          </div>
          <div class="flex items-center gap-1.5">
            <i data-lucide="map-pin" class="w-3.5 h-3.5 text-slate-400"></i>
            <span>${s.alamatJadwal}</span>
          </div>
        </div>

        <div class="flex justify-end pt-1">
          <button onclick="deleteSchedule(${s.id})" class="text-rose-500 hover:text-rose-700 text-[10px] font-semibold flex items-center gap-1">
            <i data-lucide="trash-2" class="w-3 h-3"></i> Batalkan
          </button>
        </div>
      </div>
    `;
  }).join('');

  lucide.createIcons();
}

// Hapus Laporan
function deleteReport(id) {
  reports = reports.filter(r => r.id !== id);
  saveData();
  renderReports();
  showToast('Laporan berhasil dihapus');
}

// Hapus Jadwal
function deleteSchedule(id) {
  schedules = schedules.filter(s => s.id !== id);
  saveData();
  renderSchedules();
  showToast('Jadwal berhasil dibatalkan');
}

// Update Poin UI & Storage
function updatePointsUI() {
  document.getElementById('userPoints').innerText = `${userPoints} Eko-Poin`;
}

// Simpan Ke LocalStorage
function saveData() {
  localStorage.setItem('wastewise_reports', JSON.stringify(reports));
  localStorage.setItem('wastewise_schedules', JSON.stringify(schedules));
  localStorage.setItem('wastewise_points', userPoints.toString());
}

// Notifikasi Toast
function showToast(message) {
  const toast = document.getElementById('toast');
  const toastMsg = document.getElementById('toastMsg');
  
  toastMsg.innerText = message;
  toast.classList.remove('opacity-0', 'pointer-events-none', 'translate-y-4');
  toast.classList.add('opacity-100', 'translate-y-0');

  setTimeout(() => {
    toast.classList.remove('opacity-100', 'translate-y-0');
    toast.classList.add('opacity-0', 'pointer-events-none', 'translate-y-4');
  }, 3000);
}