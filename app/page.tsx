"use client";

import { useState, useEffect, useMemo } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Konstanta Harga Paket
const PAKET_WISATA = {
  "Bali Explorer 5D4N": 4500000,
  "Raja Ampat Trip Luxury": 22500000,
  "Labuan Bajo Phinisi": 8166666,
  "Bromo Sunrise Special": 1500000,
};

type Status = "Menunggu" | "Dikonfirmasi" | "Selesai" | "Dibatalkan";

interface Booking {
  id: number;
  namaPemesan: string;
  kontak: string;
  paketWisata: string;
  tanggalBerangkat: string;
  jumlahPeserta: number;
  hargaPerOrang: number;
  catatan?: string;
  status: Status;
  createdAt: string;
}

export default function Page() {
  // --- STATE MANAGEMENT ---
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [errorMessage, setErrorMessage] = useState("");

  // State untuk Mobile Sidebar
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // State Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("Semua Status");
  const [filterPaket, setFilterPaket] = useState("Semua Paket Wisata");
  const [filterDate, setFilterDate] = useState("");

  // State Form
  const [formData, setFormData] = useState<Partial<Booking>>({
    namaPemesan: "", kontak: "", paketWisata: "", tanggalBerangkat: "", jumlahPeserta: 1, hargaPerOrang: 0, catatan: ""
  });

  // --- FETCH DATA DARI API BACKEND ---
  const fetchBookings = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus !== "Semua Status") params.append("status", filterStatus);
      if (filterPaket !== "Semua Paket Wisata") params.append("paketWisata", filterPaket);

      const res = await fetch(`${API_URL}?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setBookings(data);
      }
    } catch (error) {
      console.error("Gagal mengambil data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [filterStatus, filterPaket]);

  // --- FILTER CLIENT-SIDE & DERIVED DATA ---
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const bDate = b.tanggalBerangkat ? b.tanggalBerangkat.split('T')[0] : "";
      const matchDate = filterDate === "" || bDate === filterDate;
      const matchSearch = b.namaPemesan.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.paketWisata.toLowerCase().includes(searchQuery.toLowerCase());
      return matchDate && matchSearch;
    });
  }, [bookings, filterDate, searchQuery]);

  const summary = useMemo(() => {
    const validBookings = filteredBookings.filter(b => b.status === "Dikonfirmasi" || b.status === "Selesai");
    return {
      count: validBookings.length,
      revenue: validBookings.reduce((sum, b) => sum + (b.hargaPerOrang * b.jumlahPeserta), 0)
    };
  }, [filteredBookings]);

  // --- LOGIKA FORM (CREATE & EDIT) ---
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    let newData = { ...formData, [name]: value };

    if (name === "paketWisata") {
      if (value && PAKET_WISATA[value as keyof typeof PAKET_WISATA]) {
        newData.hargaPerOrang = PAKET_WISATA[value as keyof typeof PAKET_WISATA];
      } else {
        newData.hargaPerOrang = 0;
      }
    }
    setFormData(newData);
  };

  const submitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    const payload = {
      namaPemesan: formData.namaPemesan,
      kontak: formData.kontak,
      paketWisata: formData.paketWisata,
      tanggalBerangkat: formData.tanggalBerangkat,
      jumlahPeserta: Number(formData.jumlahPeserta),
      hargaPerOrang: Number(formData.hargaPerOrang),
      catatan: formData.catatan || ""
    };

    try {
      const url = modalMode === "add" ? API_URL : `${API_URL}/${formData.id}`;
      const method = modalMode === "add" ? "POST" : "PUT";

      // @ts-ignore
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const result = await res.json();

      if (!res.ok) {
        setErrorMessage(result.error || "Terjadi kesalahan pada server");
        return;
      }

      closeModal();
      fetchBookings();
    } catch (error) {
      setErrorMessage("Gagal terhubung ke server");
    }
  };

  // --- LOGIKA STATUS & HAPUS ---
  const updateStatus = async (id: number, newStatus: Status) => {
    try {
      const res = await fetch(`${API_URL}/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newStatus })
      });

      if (res.ok) {
        fetchBookings();
      } else {
        const err = await res.json();
        alert(err.error);
      }
    } catch (error) {
      alert("Gagal merubah status");
    }
  };

  const deleteBooking = async (id: number) => {
    if (confirm("Yakin ingin menghapus pemesanan ini?")) {
      try {
        const res = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
        if (res.ok) fetchBookings();
      } catch (error) {
        alert("Gagal menghapus data");
      }
    }
  };

  // --- HELPER UI ---
  const openAddModal = () => {
    setModalMode("add");
    setFormData({ namaPemesan: "", kontak: "", paketWisata: "", tanggalBerangkat: "", jumlahPeserta: 1, hargaPerOrang: 0, catatan: "" });
    setErrorMessage("");
    setIsModalOpen(true);
  };

  const openEditModal = (booking: Booking) => {
    setModalMode("edit");
    const formattedDate = booking.tanggalBerangkat ? booking.tanggalBerangkat.split('T')[0] : "";
    setFormData({ ...booking, tanggalBerangkat: formattedDate });
    setErrorMessage("");
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);
  const formatRp = (angka: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(angka);
  const displayDate = (isoString: string) => {
    if (!isoString) return "-";
    return new Date(isoString).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <>
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-on-background/40 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      <aside className={`fixed left-0 top-0 h-screen w-64 bg-surface border-r border-outline-variant shadow-sm z-50 flex flex-col py-6 transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}>
        <div className="px-6 mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-headline-md font-headline-md font-bold text-primary whitespace-nowrap">TravelKu Admin</h1>
            <p className="font-label-md text-label-md text-on-surface-variant">Management Portal</p>
          </div>
          <button className="md:hidden text-outline hover:text-primary" onClick={() => setIsSidebarOpen(false)}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <nav className="flex-1 px-3 space-y-1">
          <a className="flex items-center gap-3 px-4 py-3 text-primary font-bold border-r-4 border-primary bg-primary-container/10 rounded-lg" href="#">
            <span className="material-symbols-outlined">calendar_month</span>
            <span className="font-label-md text-label-md">Bookings</span>
          </a>
        </nav>
      </aside>

      <header className="fixed top-0 right-0 w-full md:w-[calc(100%-16rem)] z-30 flex justify-between items-center h-16 px-4 md:px-8 bg-surface/80 backdrop-blur-md border-b border-outline-variant/30">
        <div className="flex items-center gap-3">
          <button className="md:hidden text-on-surface-variant hover:text-primary transition-colors p-1" onClick={() => setIsSidebarOpen(true)}>
            <span className="material-symbols-outlined text-[28px]">menu</span>
          </button>

          <nav className="flex items-center gap-1 sm:gap-2 text-on-surface-variant font-body-md text-body-md">
            <span className="hidden sm:inline">Admin</span>
            <span className="material-symbols-outlined text-[16px] hidden sm:inline">chevron_right</span>
            <span className="text-primary font-bold">Bookings</span>
          </nav>
        </div>
      </header>

      <main className="md:ml-64 pt-20 md:pt-24 px-4 md:px-8 pb-12 min-h-screen bg-background">
        <div className="max-w-350 mx-auto space-y-6 md:space-y-8">

          <div className="flex justify-between items-end">
            <div>
              <h2 className="font-display text-display text-on-background text-2xl md:text-3xl">Manajemen Pemesanan</h2>
            </div>
          </div>

          {/* CARD RINGKASAN */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 md:p-6 shadow-sm flex flex-col justify-between">
              <div>
                <p className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">Jumlah Pemesanan (Aktif)</p>
                <h3 className="font-display text-display text-primary mt-2 text-3xl md:text-4xl">{summary.count}</h3>
              </div>
              <p className="font-label-md text-label-md text-outline mt-3 flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">info</span> Dari status Dikonfirmasi & Selesai</p>
            </div>
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 md:p-6 shadow-sm flex flex-col justify-between">
              <div>
                <p className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">Total Estimasi Pendapatan</p>
                <h3 className="font-display text-display text-secondary mt-2 text-2xl md:text-3xl">{formatRp(summary.revenue)}</h3>
              </div>
              <p className="font-label-md text-label-md text-outline mt-3 flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">trending_up</span> Dari status Dikonfirmasi & Selesai</p>
            </div>
          </div>

          {/* FILTER & TABEL */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden flex flex-col">

            {/* Filter Area (Responsive form wrapping) */}
            <div className="p-4 md:p-6 border-b border-outline-variant flex flex-col lg:flex-row gap-4 lg:items-center justify-between">

              <div className="flex flex-col sm:flex-row flex-wrap gap-3 flex-1 w-full">
                <div className="relative w-full sm:w-auto grow max-w-sm">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">search</span>
                  <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2.5 sm:py-2 bg-surface border border-outline-variant rounded-lg text-body-md outline-none focus:border-primary" placeholder="Cari nama..." type="text" />
                </div>

                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full sm:w-auto bg-surface border border-outline-variant rounded-lg px-4 py-2.5 sm:py-2 text-body-md outline-none focus:border-primary appearance-none">
                  <option>Semua Status</option>
                  <option>Menunggu</option>
                  <option>Dikonfirmasi</option>
                  <option>Selesai</option>
                  <option>Dibatalkan</option>
                </select>

                <select value={filterPaket} onChange={(e) => setFilterPaket(e.target.value)} className="w-full sm:w-auto bg-surface border border-outline-variant rounded-lg px-4 py-2.5 sm:py-2 text-body-md outline-none focus:border-primary appearance-none">
                  <option>Semua Paket Wisata</option>
                  {Object.keys(PAKET_WISATA).map(p => <option key={p} value={p}>{p}</option>)}
                </select>

                <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="w-full sm:w-auto bg-surface border border-outline-variant rounded-lg px-4 py-2.5 sm:py-2 text-body-md outline-none focus:border-primary" />
              </div>

              <button onClick={openAddModal} className="w-full lg:w-auto bg-primary text-on-primary px-5 py-3 sm:py-2.5 rounded-lg flex items-center justify-center gap-2 font-label-md shadow-md hover:opacity-90 active:scale-95 transition-all">
                <span className="material-symbols-outlined">add</span> Tambah Pemesanan
              </button>
            </div>

            {/* Area Tabel */}
            <div className="overflow-x-auto min-h-75">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-surface-container-low/50">
                    <th className="px-6 py-4 font-label-md text-outline uppercase">Pemesan</th>
                    <th className="px-6 py-4 font-label-md text-outline uppercase">Kontak</th>
                    <th className="px-6 py-4 font-label-md text-outline uppercase">Paket</th>
                    <th className="px-6 py-4 font-label-md text-outline uppercase">Tgl Berangkat</th>
                    <th className="px-6 py-4 font-label-md text-outline uppercase text-center">Peserta</th>
                    <th className="px-6 py-4 font-label-md text-outline uppercase text-right">Total Harga</th>
                    <th className="px-6 py-4 font-label-md text-outline uppercase text-center">Status</th>
                    <th className="px-6 py-4 font-label-md text-outline uppercase text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {isLoading ? (
                    <tr><td colSpan={8} className="text-center py-10 text-on-surface-variant">Memuat data dari server...</td></tr>
                  ) : filteredBookings.length === 0 ? (
                    <tr><td colSpan={8} className="text-center py-10 text-on-surface-variant">Tidak ada data pemesanan.</td></tr>
                  ) : (
                    filteredBookings.map((b) => (
                      <tr key={b.id} className="hover:bg-surface transition-colors">
                        <td className="px-6 py-4 font-body-md font-semibold">{b.namaPemesan}</td>
                        <td className="px-6 py-4 font-body-md">{b.kontak}</td>
                        <td className="px-6 py-4 font-body-md max-w-50 truncate" title={b.paketWisata}>{b.paketWisata}</td>
                        <td className="px-6 py-4 font-body-md">{displayDate(b.tanggalBerangkat)}</td>
                        <td className="px-6 py-4 font-body-md text-center">{b.jumlahPeserta}</td>
                        <td className="px-6 py-4 font-body-md font-bold text-right">{formatRp(b.hargaPerOrang * b.jumlahPeserta)}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-3 py-1.5 rounded-full text-[12px] font-bold 
                            ${b.status === 'Menunggu' ? 'bg-amber-100 text-amber-800' :
                              b.status === 'Dikonfirmasi' ? 'bg-blue-100 text-blue-800' :
                                b.status === 'Selesai' ? 'bg-green-100 text-green-800' : 'bg-slate-200 text-slate-800'}`}>
                            {b.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center gap-1">
                            {b.status === 'Menunggu' && (
                              <>
                                <button onClick={() => updateStatus(b.id, 'Dikonfirmasi')} title="Konfirmasi" className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><span className="material-symbols-outlined text-[18px]">check_circle</span></button>
                                <button onClick={() => updateStatus(b.id, 'Dibatalkan')} title="Batalkan" className="p-2 text-error hover:bg-red-50 rounded-lg"><span className="material-symbols-outlined text-[18px]">cancel</span></button>
                              </>
                            )}
                            {b.status === 'Dikonfirmasi' && (
                              <>
                                <button onClick={() => updateStatus(b.id, 'Selesai')} title="Selesaikan" className="p-2 text-green-600 hover:bg-green-50 rounded-lg"><span className="material-symbols-outlined text-[18px]">task_alt</span></button>
                                <button onClick={() => updateStatus(b.id, 'Dibatalkan')} title="Batalkan" className="p-2 text-error hover:bg-red-50 rounded-lg"><span className="material-symbols-outlined text-[18px]">cancel</span></button>
                              </>
                            )}

                            <button onClick={() => openEditModal(b)} disabled={b.status === 'Selesai' || b.status === 'Dibatalkan'} className={`p-2 rounded-lg ${b.status === 'Selesai' || b.status === 'Dibatalkan' ? 'text-gray-300' : 'text-primary hover:bg-primary/10'}`}>
                              <span className="material-symbols-outlined text-[18px]">edit</span>
                            </button>
                            <button onClick={() => deleteBooking(b.id)} disabled={b.status === 'Selesai' || b.status === 'Dibatalkan'} className={`p-2 rounded-lg ${b.status === 'Selesai' || b.status === 'Dibatalkan' ? 'text-gray-300' : 'text-error hover:bg-red-50'}`}>
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-100 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-on-background/40 backdrop-blur-sm transition-opacity" onClick={closeModal}></div>

          <div className="relative w-full max-w-xl bg-white rounded-t-2xl sm:rounded-xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-outline-variant flex justify-between items-center bg-surface-container-lowest sticky top-0 z-10">
              <div>
                <h3 className="font-headline-md text-on-background">{modalMode === 'add' ? 'Tambah Pemesanan' : 'Edit Pemesanan'}</h3>
              </div>
              <button className="text-outline hover:text-primary transition-colors p-1" onClick={closeModal}>
                <span className="material-symbols-outlined text-[24px]">close</span>
              </button>
            </div>

            <div className="overflow-y-auto max-h-[80vh] p-6">
              <form className="space-y-5" onSubmit={submitForm}>
                {errorMessage && (
                  <div className="p-3 bg-error-container text-on-error-container text-body-md rounded-lg flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">error</span> {errorMessage}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1 sm:col-span-2">
                    <label className="font-label-md text-on-surface-variant">Nama Pemesan</label>
                    <input name="namaPemesan" required value={formData.namaPemesan} onChange={handleFormChange} className="w-full px-3 py-2.5 sm:py-2 border border-outline-variant rounded-lg outline-none focus:border-primary text-body-md" type="text" placeholder="Masukkan nama lengkap" />
                  </div>

                  <div className="space-y-1">
                    <label className="font-label-md text-on-surface-variant">Nomor Kontak</label>
                    <input name="kontak" required value={formData.kontak} onChange={handleFormChange} className="w-full px-3 py-2.5 sm:py-2 border border-outline-variant rounded-lg outline-none focus:border-primary text-body-md" type="text" placeholder="08..." />
                  </div>

                  <div className="space-y-1">
                    <label className="font-label-md text-on-surface-variant">Paket Wisata</label>
                    <select name="paketWisata" required value={formData.paketWisata} onChange={handleFormChange} className="w-full px-3 py-2.5 sm:py-2 border border-outline-variant rounded-lg outline-none focus:border-primary text-body-md appearance-none">
                      <option value="">Pilih paket...</option>
                      {Object.keys(PAKET_WISATA).map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-label-md text-on-surface-variant">Tanggal Berangkat</label>
                    <input name="tanggalBerangkat" required value={formData.tanggalBerangkat} onChange={handleFormChange} className="w-full px-3 py-2.5 sm:py-2 border border-outline-variant rounded-lg outline-none focus:border-primary text-body-md" type="date" />
                  </div>

                  <div className="space-y-1">
                    <label className="font-label-md text-on-surface-variant">Jumlah Peserta</label>
                    <input name="jumlahPeserta" required min="1" value={formData.jumlahPeserta} onChange={handleFormChange} className="w-full px-3 py-2.5 sm:py-2 border border-outline-variant rounded-lg outline-none focus:border-primary text-body-md" type="number" />
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="font-label-md text-on-surface-variant">Catatan (Opsional)</label>
                    <textarea name="catatan" value={formData.catatan} onChange={handleFormChange} className="w-full px-3 py-2.5 sm:py-2 border border-outline-variant rounded-lg outline-none focus:border-primary text-body-md" rows={2} placeholder="Tambahkan catatan khusus..." />
                  </div>
                </div>

                <div className="p-3 bg-primary-container/10 rounded-lg border border-primary/20 flex justify-between items-center mt-2">
                  <span className="font-body-md text-on-surface-variant">Estimasi Total Harga:</span>
                  <span className="font-headline-md text-primary">{formatRp((formData.hargaPerOrang || 0) * (formData.jumlahPeserta || 0))}</span>
                </div>

                <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-outline-variant/30 mt-6">
                  <button type="button" className="w-full sm:w-auto px-5 py-3 sm:py-2 rounded-lg text-on-surface-variant hover:bg-surface-container font-label-md transition-colors" onClick={closeModal}>Batal</button>
                  <button type="submit" className="w-full sm:w-auto px-6 py-3 sm:py-2 bg-primary text-on-primary rounded-lg shadow-md hover:opacity-90 active:scale-95 font-label-md transition-all">Simpan</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}