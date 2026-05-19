"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const BOOKING_API = process.env.NEXT_PUBLIC_API_URL as string;
const AUTH_API = BOOKING_API.replace("/bookings", "/auth");

export default function LoginPage() {
    const router = useRouter();

    const [isLoginMode, setIsLoginMode] = useState(true);

    const [authForm, setAuthForm] = useState({ username: "", password: "", nama: "" });
    const [authError, setAuthError] = useState("");
    const [authSuccess, setAuthSuccess] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        const savedToken = localStorage.getItem("travel_token");
        if (savedToken) {
            router.push("/");
        }
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setAuthError("");
        setAuthSuccess("");
        setIsProcessing(true);

        try {
            const endpoint = isLoginMode ? `${AUTH_API}/login` : `${AUTH_API}/register`;
            const payload = isLoginMode
                ? { username: authForm.username, password: authForm.password }
                : { username: authForm.username, password: authForm.password, nama: authForm.nama };

            const res = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (res.ok) {
                if (isLoginMode) {
                    localStorage.setItem("travel_token", data.token);
                    localStorage.setItem("travel_staff_name", data.staff.nama);
                    router.push("/");
                } else {
                    setAuthSuccess("Pendaftaran berhasil! Silakan masuk dengan akun baru Anda.");
                    setIsLoginMode(true);
                    setAuthForm({ ...authForm, password: "" }); 
                }
            } else {
                setAuthError(data.error || (isLoginMode ? "Login gagal" : "Pendaftaran gagal"));
            }
        } catch (err) {
            setAuthError("Gagal terhubung ke server");
        } finally {
            setIsProcessing(false);
        }
    };

    // Fungsi untuk membersihkan form saat bertukar mode
    const toggleMode = () => {
        setIsLoginMode(!isLoginMode);
        setAuthError("");
        setAuthSuccess("");
        setAuthForm({ username: "", password: "", nama: "" });
    };

    return (
        <div className="min-h-screen bg-surface-container-low flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">

                {/* Header Biru Dinamis */}
                <div className="bg-primary px-8 py-8 text-center transition-colors">
                    <span className="material-symbols-outlined text-[48px] text-on-primary">
                        {isLoginMode ? "travel_explore" : "person_add"}
                    </span>
                    <h1 className="text-display font-display font-bold text-on-primary mt-2 text-3xl">TravelKu</h1>
                    <p className="text-on-primary-container/80 font-body-md mt-1">
                        {isLoginMode ? "Admin Management Portal" : "Pendaftaran Staf Baru"}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-5">
                    {/* Notifikasi Error */}
                    {authError && (
                        <div className="p-3 bg-error-container text-on-error-container text-body-md rounded-lg text-center flex items-center justify-center gap-2 animate-in fade-in">
                            <span className="material-symbols-outlined text-[18px]">error</span> {authError}
                        </div>
                    )}

                    {/* Notifikasi Sukses Register */}
                    {authSuccess && (
                        <div className="p-3 bg-green-100 text-green-800 text-body-md rounded-lg text-center flex items-center justify-center gap-2 animate-in fade-in">
                            <span className="material-symbols-outlined text-[18px]">check_circle</span> {authSuccess}
                        </div>
                    )}

                    {/* Input Nama (Hanya Muncul di Mode Register) */}
                    {!isLoginMode && (
                        <div className="space-y-1 animate-in slide-in-from-top-2">
                            <label className="font-label-md text-on-surface-variant">Nama Lengkap</label>
                            <input required value={authForm.nama} onChange={(e) => setAuthForm({ ...authForm, nama: e.target.value })} className="w-full px-4 py-3 border border-outline-variant rounded-lg focus:border-primary outline-none text-body-md transition-all" type="text" placeholder="Masukkan nama lengkap Anda" />
                        </div>
                    )}

                    <div className="space-y-1">
                        <label className="font-label-md text-on-surface-variant">Username</label>
                        <input required value={authForm.username} onChange={(e) => setAuthForm({ ...authForm, username: e.target.value })} className="w-full px-4 py-3 border border-outline-variant rounded-lg focus:border-primary outline-none text-body-md transition-all" type="text" placeholder="Masukkan username" />
                    </div>

                    <div className="space-y-1">
                        <label className="font-label-md text-on-surface-variant">Password</label>
                        <input required minLength={isLoginMode ? 1 : 6} value={authForm.password} onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })} className="w-full px-4 py-3 border border-outline-variant rounded-lg focus:border-primary outline-none text-body-md transition-all" type="password" placeholder="••••••••" />
                        {!isLoginMode && <p className="text-xs text-outline mt-1">Minimal 6 karakter</p>}
                    </div>

                    <button type="submit" disabled={isProcessing} className="w-full py-3 bg-primary text-on-primary rounded-lg font-label-md shadow-md hover:opacity-90 active:scale-95 transition-all mt-2 flex justify-center items-center gap-2">
                        {isProcessing ? "Memproses..." : (
                            <>
                                <span className="material-symbols-outlined text-[18px]">
                                    {isLoginMode ? "login" : "how_to_reg"}
                                </span>
                                {isLoginMode ? "Masuk ke Dashboard" : "Daftar Akun"}
                            </>
                        )}
                    </button>

                    {/* Tombol Toggle Mode */}
                    <div className="text-center pt-4 border-t border-outline-variant/30 mt-6">
                        <p className="text-body-md text-on-surface-variant">
                            {isLoginMode ? "Belum punya akun?" : "Sudah punya akun?"}
                        </p>
                        <button type="button" onClick={toggleMode} className="text-primary font-bold hover:underline mt-1 transition-all">
                            {isLoginMode ? "Daftar Staf Baru" : "Masuk ke Dashboard"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}