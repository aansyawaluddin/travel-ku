"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";

const BOOKING_API = process.env.NEXT_PUBLIC_API_URL as string;
type Status = "Menunggu" | "Dikonfirmasi" | "Selesai" | "Dibatalkan";

// FIX: id pada TourPackage diubah menjadi string (contoh: "PKG-01")
interface TourPackage { id: string; nama: string; harga: number; kapasitas: number; }

// FIX: packageId pada Booking diubah menjadi string
interface Booking {
  id: number; namaPemesan: string; kontak: string; packageId: string; package: TourPackage;
  staff: { nama: string; username: string }; tanggalBerangkat: string; jumlahPeserta: number;
  hargaPerOrang: number; catatan?: string; status: Status; createdAt: string;
}

// Interface terpisah untuk form state
interface BookingFormData {
  id?: number;
  namaPemesan: string;
  kontak: string;
  packageId: string;
  tanggalBerangkat: string;
  jumlahPeserta: number;
  hargaPerOrang: number;
  catatan?: string;
  status?: Status;
}

export default function DashboardPage() {
  const router = useRouter();

  // --- STATE AUTHENTICATION ---
  const [token, setToken] = useState<string | null>(null);
  const [staffName, setStaffName] = useState<string>("");
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // --- STATE MANAGEMENT DATA ---
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [packages, setPackages] = useState<TourPackage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // State Filter & Pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("Semua Status");
  const [filterPaket, setFilterPaket] = useState("Semua Paket Wisata");
  const [filterDate, setFilterDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // State Form
  const [formData, setFormData] = useState<BookingFormData>({
    namaPemesan: "", kontak: "", packageId: "", tanggalBerangkat: "", jumlahPeserta: 1, catatan: "", hargaPerOrang: 0
  });

  // --- CHECK AUTHENTICATION PADA SAAT HALAMAN DIMUAT ---
  useEffect(() => {
    const savedToken = localStorage.getItem("travel_token");
    const savedName = localStorage.getItem("travel_staff_name");

    if (!savedToken) {
      router.push("/login");
    } else {
      setToken(savedToken);
      if (savedName) setStaffName(savedName);
      setIsCheckingAuth(false);
      // Langsung fetch dengan token yang baru didapat
      fetchPackages(savedToken);
      fetchBookings(savedToken);
    }
  }, [router]);

  // --- LOGOUT LOGIC ---
  const handleLogout = () => {
    localStorage.removeItem("travel_token");
    localStorage.removeItem("travel_staff_name");
    router.push("/login");
  };

  const getAuthHeaders = () => ({ "Content-Type": "application/json", "Authorization": `Bearer ${token}` });

  // --- FETCH API ---
  const fetchPackages = async (authToken?: string) => {
    const tok = authToken || token;
    if (!tok) return;
    try {
      const res = await fetch(`${BOOKING_API}/packages`, {
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${tok}` }
      });
      if (res.ok) setPackages(await res.json());
      else console.error("Gagal ambil paket, status:", res.status);
    } catch (error) { console.error("Gagal ambil paket", error); }
  };

  const fetchBookings = async (authToken?: string) => {
    const tok = authToken || token;
    if (!tok) return;
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus !== "Semua Status") params.append("status", filterStatus);
      if (filterPaket !== "Semua Paket Wisata") {
        const pkg = packages.find(p => p.nama === filterPaket);
        if (pkg) params.append("packageId", pkg.id); // pk.id sekarang string
      }
      if (filterDate) {
        params.append("startDate", filterDate + "T00:00:00Z");
        params.append("endDate", filterDate + "T23:59:59Z");
      }

      const headers = { "Content-Type": "application/json", "Authorization": `Bearer ${tok}` };
      const res = await fetch(`${BOOKING_API}?${params.toString()}`, { headers });
      if (res.ok) {
        setBookings(await res.json());
      } else if (res.status === 401 || res.status === 403) {
        handleLogout();
      }
    } catch (error) { console.error(error); } finally { setIsLoading(false); }
  };

  useEffect(() => {
    if (token) {
      fetchPackages(token);
      fetchBookings(token);
      setCurrentPage(1);
    }
  }, [token, filterStatus, filterPaket, filterDate]);

  // --- FILTER & PAGINATION ---
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const query = searchQuery.toLowerCase();
      return b.namaPemesan.toLowerCase().includes(query) || b.kontak.toLowerCase().includes(query);
    });
  }, [bookings, searchQuery]);

  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const paginatedBookings = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredBookings.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredBookings, currentPage]);

  const goToNextPage = () => setCurrentPage(p => Math.min(p + 1, totalPages));
  const goToPrevPage = () => setCurrentPage(p => Math.max(p - 1, 1));

  const summary = useMemo(() => {
    const validBookings = filteredBookings.filter(b => b.status === "Dikonfirmasi" || b.status === "Selesai");
    return {
      count: validBookings.length,
      revenue: validBookings.reduce((sum, b) => sum + (b.hargaPerOrang * b.jumlahPeserta), 0)
    };
  }, [filteredBookings]);

  // --- LOGIKA FORM & DB ---
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    if (name === "packageId") {
      const selectedPkg = packages.find(p => p.id === value);
      setFormData({
        ...formData,
        packageId: value,
        hargaPerOrang: selectedPkg?.harga || 0,
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const submitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    // FIX: Validasi string kosong, tidak perlu Number()
    if (!formData.packageId || formData.packageId.trim() === "") {
      return setErrorMessage("Paket wisata wajib dipilih");
    }

    const payload = {
      namaPemesan: formData.namaPemesan,
      kontak: formData.kontak,
      packageId: formData.packageId, // Dikirim langsung sebagai string
      tanggalBerangkat: formData.tanggalBerangkat
        ? new Date(`${formData.tanggalBerangkat}T12:00:00`).toISOString()
        : "",
      jumlahPeserta: Number(formData.jumlahPeserta),
      catatan: formData.catatan || ""
    };

    try {
      const url = modalMode === "add" ? BOOKING_API : `${BOOKING_API}/${formData.id}`;
      const method = modalMode === "add" ? "POST" : "PUT";
      const res = await fetch(url, { method, headers: getAuthHeaders(), body: JSON.stringify(payload) });
      const result = await res.json();
      if (!res.ok) return setErrorMessage(result.error || "Terjadi kesalahan server");
      closeModal();
      fetchBookings();
    } catch (error) { setErrorMessage("Gagal terhubung ke server"); }
  };

  const updateStatus = async (id: number, newStatus: Status) => {
    try {
      const res = await fetch(`${BOOKING_API}/${id}/status`, { method: "PATCH", headers: getAuthHeaders(), body: JSON.stringify({ newStatus }) });
      if (res.ok) fetchBookings(); else alert((await res.json()).error);
    } catch (error) { alert("Gagal merubah status"); }
  };

  const deleteBooking = async (id: number) => {
    if (confirm("Yakin ingin menghapus pemesanan ini?")) {
      try {
        const res = await fetch(`${BOOKING_API}/${id}`, { method: "DELETE", headers: getAuthHeaders() });
        if (res.ok) fetchBookings();
      } catch (error) { alert("Gagal menghapus data"); }
    }
  };

  const exportToCSV = () => {
    if (filteredBookings.length === 0) return alert("Tidak ada data.");
    const headers = ["ID", "Nama Pemesan", "Kontak", "Paket Wisata", "Tanggal Berangkat", "Jumlah Peserta", "Total Harga", "Status", "Staf Pencatat"];
    const rows = filteredBookings.map(b => [b.id, `"${b.namaPemesan}"`, `'${b.kontak}`, `"${b.package?.nama}"`, displayDate(b.tanggalBerangkat), b.jumlahPeserta, b.hargaPerOrang * b.jumlahPeserta, b.status, `"${b.staff?.nama}"`]);
    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `Laporan_Pemesanan_TravelKu.csv`);
    document.body.appendChild(link); link.click(); link.remove();
  };

  const openAddModal = () => {
    const firstPackage = packages[0];
    setModalMode("add");
    setFormData({
      namaPemesan: "",
      kontak: "",
      packageId: firstPackage?.id || "",
      tanggalBerangkat: "",
      jumlahPeserta: 1,
      catatan: "",
      hargaPerOrang: firstPackage?.harga || 0,
    });
    setErrorMessage("");
    setIsModalOpen(true);
  };

  const openEditModal = (booking: Booking) => {
    setModalMode("edit");
    setFormData({
      id: booking.id,
      namaPemesan: booking.namaPemesan,
      kontak: booking.kontak,
      packageId: booking.packageId,
      tanggalBerangkat: booking.tanggalBerangkat ? booking.tanggalBerangkat.split('T')[0] : "",
      jumlahPeserta: booking.jumlahPeserta,
      hargaPerOrang: booking.hargaPerOrang,
      catatan: booking.catatan || "",
      status: booking.status,
    });
    setErrorMessage("");
    setIsModalOpen(true);
  };
  const closeModal = () => setIsModalOpen(false);

  const getTodayStr = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const formatRp = (angka: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(angka);
  const displayDate = (isoString: string) => isoString ? new Date(isoString).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : "-";

  if (isCheckingAuth) {
    return <div className="min-h-screen flex items-center justify-center bg-surface font-body-md text-on-surface-variant">Memeriksa Akses...</div>;
  }

  return (
    <>
      {isSidebarOpen && <div className="fixed inset-0 bg-on-background/40 backdrop-blur-sm z-40 md:hidden transition-opacity" onClick={() => setIsSidebarOpen(false)}></div>}

      <aside className={`fixed left-0 top-0 h-screen w-64 bg-surface border-r border-outline-variant shadow-sm z-50 flex flex-col py-6 transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}>
        <div className="px-6 mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-headline-md font-headline-md font-bold text-primary whitespace-nowrap">TravelKu Admin</h1>
            <p className="font-label-md text-label-md text-on-surface-variant text-xs mt-1 bg-surface-container py-1 px-2 rounded inline-block">👨‍💼 {staffName}</p>
          </div>
          <button className="md:hidden text-outline hover:text-primary" onClick={() => setIsSidebarOpen(false)}><span className="material-symbols-outlined">close</span></button>
        </div>
        <nav className="flex-1 px-3 space-y-1">
          <a className="flex items-center gap-3 px-4 py-3 text-primary font-bold border-r-4 border-primary bg-primary-container/10 rounded-lg" href="#">
            <span className="material-symbols-outlined">calendar_month</span><span className="font-label-md">Pemesanan</span>
          </a>
        </nav>
        <div className="px-6 pb-4">
          <button onClick={handleLogout} className="w-full flex items-center gap-2 justify-center py-2.5 border border-error text-error rounded-lg hover:bg-error-container transition-colors font-label-md">
            <span className="material-symbols-outlined text-[18px]">logout</span> Keluar
          </button>
        </div>
      </aside>

      <header className="fixed top-0 right-0 w-full md:w-[calc(100%-16rem)] z-30 flex justify-between items-center h-16 px-4 md:px-8 bg-surface/80 backdrop-blur-md border-b border-outline-variant/30">
        <div className="flex items-center gap-3">
          <button className="md:hidden text-on-surface-variant hover:text-primary p-1" onClick={() => setIsSidebarOpen(true)}><span className="material-symbols-outlined">menu</span></button>
          <nav className="flex items-center gap-1 sm:gap-2 text-on-surface-variant font-body-md">
            <span className="hidden sm:inline">Admin</span><span className="material-symbols-outlined text-[16px] hidden sm:inline">chevron_right</span><span className="text-primary font-bold">Pemesanan</span>
          </nav>
        </div>
      </header>

      <main className="md:ml-64 pt-20 md:pt-24 px-4 md:px-8 pb-12 min-h-screen bg-background">
        <div className="max-w-350 mx-auto space-y-6 md:space-y-8">

          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
            <h2 className="font-display text-display text-on-background text-2xl md:text-3xl">Manajemen Pemesanan</h2>
            <button onClick={exportToCSV} className="bg-secondary-container text-on-secondary-container px-4 py-2 rounded-lg flex items-center justify-center gap-2 font-label-md shadow-sm hover:opacity-90 active:scale-95 transition-all border border-secondary-container">
              <span className="material-symbols-outlined text-[18px]">download</span> Export CSV
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 md:p-6 shadow-sm flex flex-col justify-between">
              <div><p className="font-label-md uppercase tracking-wider text-on-surface-variant">Jumlah Pemesanan (Aktif)</p><h3 className="font-display text-primary mt-2 text-3xl md:text-4xl">{summary.count}</h3></div>
              <p className="font-label-md text-outline mt-3 flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">info</span> Dari status Dikonfirmasi & Selesai</p>
            </div>
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 md:p-6 shadow-sm flex flex-col justify-between">
              <div><p className="font-label-md uppercase tracking-wider text-on-surface-variant">Total Estimasi Pendapatan</p><h3 className="font-display text-secondary mt-2 text-2xl md:text-3xl">{formatRp(summary.revenue)}</h3></div>
              <p className="font-label-md text-outline mt-3 flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">trending_up</span> Dari status Dikonfirmasi & Selesai</p>
            </div>
          </div>

          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 md:p-6 border-b border-outline-variant flex flex-col lg:flex-row gap-4 lg:items-center justify-between">
              <div className="flex flex-col sm:flex-row flex-wrap gap-3 flex-1 w-full">
                <div className="relative w-full sm:w-auto grow max-w-sm">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">search</span>
                  <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2.5 sm:py-2 bg-surface border border-outline-variant rounded-lg text-body-md outline-none focus:border-primary" placeholder="Cari nama / nomor kontak..." type="text" />
                </div>
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full sm:w-auto bg-surface border border-outline-variant rounded-lg px-4 py-2.5 sm:py-2 text-body-md outline-none focus:border-primary appearance-none">
                  <option>Semua Status</option><option>Menunggu</option><option>Dikonfirmasi</option><option>Selesai</option><option>Dibatalkan</option>
                </select>
                <select value={filterPaket} onChange={(e) => setFilterPaket(e.target.value)} className="w-full sm:w-auto bg-surface border border-outline-variant rounded-lg px-4 py-2.5 sm:py-2 text-body-md outline-none focus:border-primary appearance-none">
                  <option>Semua Paket Wisata</option>
                  {packages.map(p => <option key={p.id} value={p.nama}>{p.nama}</option>)}
                </select>
                <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="w-full sm:w-auto bg-surface border border-outline-variant rounded-lg px-4 py-2.5 sm:py-2 text-body-md outline-none focus:border-primary" />
              </div>
              <button onClick={openAddModal} className="w-full lg:w-auto bg-primary text-on-primary px-5 py-3 sm:py-2.5 rounded-lg flex items-center justify-center gap-2 font-label-md shadow-md hover:opacity-90 active:scale-95 transition-all">
                <span className="material-symbols-outlined">add</span> Tambah Pemesanan
              </button>
            </div>

            <div className="overflow-x-auto min-h-75">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-surface-container-low/50 border-b border-outline-variant/50">
                    <th className="px-6 py-4 font-label-md text-outline uppercase">Pemesan</th>
                    <th className="px-6 py-4 font-label-md text-outline uppercase">Paket</th>
                    <th className="px-6 py-4 font-label-md text-outline uppercase">Tgl Berangkat</th>
                    <th className="px-6 py-4 font-label-md text-outline uppercase text-center">Peserta</th>
                    <th className="px-6 py-4 font-label-md text-outline uppercase text-right">Total Harga</th>
                    <th className="px-6 py-4 font-label-md text-outline uppercase text-center">Status</th>
                    <th className="px-6 py-4 font-label-md text-outline uppercase text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {isLoading ? <tr><td colSpan={7} className="text-center py-10">Memuat data...</td></tr> :
                    paginatedBookings.length === 0 ? <tr><td colSpan={7} className="text-center py-10">Tidak ada data.</td></tr> :
                      paginatedBookings.map((b) => (
                        <tr key={b.id} className="hover:bg-surface">
                          <td className="px-6 py-4 font-body-md">
                            <div className="font-semibold text-on-surface">{b.namaPemesan}</div>
                            <div className="text-xs text-outline">{b.kontak} • 🧑‍💼 {b.staff?.nama || '-'}</div>
                          </td>
                          <td className="px-6 py-4 font-body-md truncate max-w-37.5" title={b.package?.nama || "Paket Dihapus"}>{b.package?.nama || "-"}</td>
                          <td className="px-6 py-4 font-body-md">{displayDate(b.tanggalBerangkat)}</td>
                          <td className="px-6 py-4 font-body-md text-center">{b.jumlahPeserta}</td>
                          <td className="px-6 py-4 font-body-md font-bold text-right">{formatRp(b.hargaPerOrang * b.jumlahPeserta)}</td>
                          <td className="px-6 py-4 text-center">
                            <span className={`px-3 py-1.5 rounded-full text-[12px] font-bold ${b.status === 'Menunggu' ? 'bg-amber-100 text-amber-800' : b.status === 'Dikonfirmasi' ? 'bg-blue-100 text-blue-800' : b.status === 'Selesai' ? 'bg-green-100 text-green-800' : 'bg-slate-200 text-slate-800'}`}>{b.status}</span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex justify-center gap-1">
                              {b.status === 'Menunggu' && (
                                <><button onClick={() => updateStatus(b.id, 'Dikonfirmasi')} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><span className="material-symbols-outlined text-[18px]">check_circle</span></button>
                                  <button onClick={() => updateStatus(b.id, 'Dibatalkan')} className="p-2 text-error hover:bg-red-50 rounded-lg"><span className="material-symbols-outlined text-[18px]">cancel</span></button></>
                              )}
                              {b.status === 'Dikonfirmasi' && (
                                <><button onClick={() => updateStatus(b.id, 'Selesai')} className="p-2 text-green-600 hover:bg-green-50 rounded-lg"><span className="material-symbols-outlined text-[18px]">task_alt</span></button>
                                  <button onClick={() => updateStatus(b.id, 'Dibatalkan')} className="p-2 text-error hover:bg-red-50 rounded-lg"><span className="material-symbols-outlined text-[18px]">cancel</span></button></>
                              )}
                              <button onClick={() => openEditModal(b)} disabled={b.status === 'Selesai' || b.status === 'Dibatalkan'} className={`p-2 rounded-lg ${b.status === 'Selesai' || b.status === 'Dibatalkan' ? 'text-gray-300' : 'text-primary hover:bg-primary/10'}`}><span className="material-symbols-outlined text-[18px]">edit</span></button>
                              <button onClick={() => deleteBooking(b.id)} disabled={b.status === 'Selesai' || b.status === 'Dibatalkan'} className={`p-2 rounded-lg ${b.status === 'Selesai' || b.status === 'Dibatalkan' ? 'text-gray-300' : 'text-error hover:bg-red-50'}`}><span className="material-symbols-outlined text-[18px]">delete</span></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="px-6 py-4 flex items-center justify-between border-t border-outline-variant bg-surface-container-low/30">
                <p className="font-body-md text-on-surface-variant hidden sm:block">Hal {currentPage} dari {totalPages}</p>
                <div className="flex gap-2">
                  <button onClick={goToPrevPage} disabled={currentPage === 1} className="p-2 border rounded-lg hover:bg-surface disabled:opacity-50"><span className="material-symbols-outlined">chevron_left</span></button>
                  <button onClick={goToNextPage} disabled={currentPage === totalPages} className="p-2 border rounded-lg hover:bg-surface disabled:opacity-50"><span className="material-symbols-outlined">chevron_right</span></button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {isModalOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-on-background/40 backdrop-blur-sm transition-opacity" onClick={closeModal}></div>

          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-8 py-6 border-b border-outline-variant flex justify-between items-center bg-surface-container-lowest sticky top-0 z-10">
              <div>
                <h3 className="font-headline-md text-on-background">{modalMode === 'add' ? 'Tambah Pemesanan' : 'Edit Pemesanan'}</h3>
              </div>
              <button className="text-outline hover:text-primary transition-colors p-1" onClick={closeModal}>
                <span className="material-symbols-outlined text-[28px]">close</span>
              </button>
            </div>

            <div className="overflow-y-auto max-h-[80vh] p-8">
              <form className="space-y-6" onSubmit={submitForm}>
                {errorMessage && (
                  <div className="p-3 bg-error-container text-on-error-container text-body-md rounded-lg flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">error</span> {errorMessage}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="font-label-md text-on-surface-variant">Nama Pemesan</label>
                    <input name="namaPemesan" required value={formData.namaPemesan} onChange={handleFormChange} className="w-full px-4 py-2 border border-outline-variant rounded-lg outline-none focus:border-primary text-body-md" type="text" />
                  </div>

                  <div className="space-y-2">
                    <label className="font-label-md text-on-surface-variant">Nomor Kontak</label>
                    <input name="kontak" required value={formData.kontak} onChange={handleFormChange} className="w-full px-4 py-2 border border-outline-variant rounded-lg outline-none focus:border-primary text-body-md" type="text" />
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <label className="font-label-md text-on-surface-variant">Paket Wisata</label>
                    <select
                      name="packageId"
                      required
                      disabled={modalMode === 'edit'}
                      value={formData.packageId || ""}
                      onChange={handleFormChange}
                      className={`w-full px-4 py-2 border border-outline-variant rounded-lg outline-none focus:border-primary text-body-md appearance-none ${modalMode === 'edit' ? 'bg-surface-container text-outline' : ''}`}
                    >
                      <option value="" disabled>Pilih paket...</option>
                      {packages.map(p => <option key={p.id} value={p.id}>{p.nama} (Kapasitas: {p.kapasitas})</option>)}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="font-label-md text-on-surface-variant">Tanggal Keberangkatan</label>
                    <input name="tanggalBerangkat" required min={getTodayStr()} value={formData.tanggalBerangkat} onChange={handleFormChange} className="w-full px-4 py-2 border border-outline-variant rounded-lg outline-none focus:border-primary text-body-md" type="date" />
                  </div>

                  <div className="space-y-2">
                    <label className="font-label-md text-on-surface-variant">Jumlah Peserta</label>
                    <input name="jumlahPeserta" required min="1" value={formData.jumlahPeserta} onChange={handleFormChange} className="w-full px-4 py-2 border border-outline-variant rounded-lg outline-none focus:border-primary text-body-md" type="number" />
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <label className="font-label-md text-on-surface-variant">Catatan (Opsional)</label>
                    <textarea name="catatan" value={formData.catatan} onChange={handleFormChange} className="w-full px-4 py-2 border border-outline-variant rounded-lg outline-none focus:border-primary text-body-md" rows={2} />
                  </div>
                </div>

                <div className="p-4 bg-primary-container/10 rounded-xl border border-primary/20 flex justify-between items-center mt-2">
                  <span className="font-body-md text-on-surface-variant">Estimasi Total Harga:</span>
                  <span className="font-headline-md text-primary">
                    {formatRp((Number(formData.hargaPerOrang) || 0) * (Number(formData.jumlahPeserta) || 0))}
                  </span>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-outline-variant/30 mt-6">
                  <button type="button" className="px-6 py-2.5 rounded-lg text-on-surface-variant hover:bg-surface-container font-label-md transition-colors" onClick={closeModal}>Batal</button>
                  <button type="submit" className="px-8 py-2.5 bg-primary text-on-primary rounded-lg shadow-lg hover:opacity-90 active:scale-95 font-label-md transition-all">Simpan</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}