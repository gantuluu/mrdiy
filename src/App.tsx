/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Home, 
  Briefcase, 
  User, 
  Bell, 
  Search, 
  ChevronRight, 
  MapPin, 
  XCircle,
  Send,
  LogOut,
  Flame
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Job {
  id: number;
  title: string;
  location: string;
  type: string;
  salary: string;
  desc: string;
}

interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  username: string;
  phone: string;
}

export default function App() {
  const [activePage, setActivePage] = useState<'home' | 'jobs' | 'profile'>('home');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Auth state
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<1 | 2>(1);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    fetchJobs();
    loadProfile();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/jobs');
      if (!res.ok) throw new Error('Failed to fetch jobs');
      const data = await res.json();
      setJobs(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadProfile = async () => {
    const token = localStorage.getItem('job_token');
    if (!token) return;

    try {
      const res = await fetch('/api/profile', {
        headers: { 'Authorization': token }
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      } else {
        localStorage.removeItem('job_token');
        setProfile(null);
      }
    } catch (err) {
      console.error('Profile load error:', err);
    }
  };

  const handleLogin = async () => {
    if (!phone) return setAuthError('Masukkan nomor HP!');
    setAuthLoading(true);
    setAuthError(null);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      });
      const data = await res.json();
      if (data.success) {
        setStep(2);
      } else {
        setAuthError(data.error);
      }
    } catch (err) {
      setAuthError('Gagal terhubung ke server.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!otp) return setAuthError('Masukkan kode OTP!');
    setAuthLoading(true);
    setAuthError(null);
    try {
      const res = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code: otp })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('job_token', data.appToken);
        await loadProfile();
      } else {
        setAuthError(data.error);
      }
    } catch (err) {
      setAuthError('Verifikasi gagal.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    const token = localStorage.getItem('job_token');
    if (token) {
      try {
        await fetch('/api/logout', {
          method: 'POST',
          headers: { 'Authorization': token }
        });
      } catch (err) {}
    }
    localStorage.removeItem('job_token');
    setProfile(null);
    setStep(1);
    setPhone('');
    setOtp('');
  };

  const renderHome = () => (
    <div className="p-4 space-y-6">
      <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-2xl p-6 shadow-lg text-black">
        <h2 className="font-black text-2xl uppercase italic leading-tight">Build Your Career</h2>
        <p className="text-sm opacity-90 mt-2">Bergabunglah dengan toko retail hardware terbesar di Malaysia.</p>
      </div>

      <div className="space-y-4">
        <h3 className="font-bold text-lg flex items-center gap-2">
          <Flame className="w-5 h-5 text-orange-500 fill-orange-500" />
          Lowongan Populer
        </h3>
        
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 text-red-500 text-xs rounded-xl text-center border border-red-100">
            {error}
          </div>
        ) : (
          <div className="space-y-3">
            {jobs.map(job => (
              <JobCard key={job.id} job={job} onClick={() => setSelectedJob(job)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderJobs = () => (
    <div className="p-4 space-y-6">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input 
          type="text" 
          placeholder="Cari posisi (Manajer, Kasir...)" 
          className="w-full bg-gray-100 py-3 pl-12 pr-4 rounded-xl border-none focus:ring-2 focus:ring-yellow-400 outline-none transition-all"
        />
      </div>

      <div className="space-y-3">
        {jobs.map(job => (
          <JobCard key={job.id} job={job} onClick={() => setSelectedJob(job)} />
        ))}
      </div>
    </div>
  );

  const renderProfile = () => (
    <div className="p-4">
      {!profile ? (
        <div className="mt-10 text-center">
          <div className="w-20 h-20 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Send className="w-10 h-10 -rotate-12" />
          </div>
          <h2 className="text-xl font-bold">Masuk ke Karir Mr. DIY</h2>
          <p className="text-gray-500 text-sm mt-2 mb-8 px-10">
            Gunakan akun Telegram Anda untuk masuk dan melamar pekerjaan secara instan.
          </p>

          {step === 1 ? (
            <div className="space-y-4">
              <input 
                type="tel" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+60123456789" 
                className="w-full border-2 p-4 rounded-xl text-center font-bold outline-none focus:border-yellow-400 transition-colors"
              />
              <button 
                onClick={handleLogin}
                disabled={authLoading}
                className="w-full bg-yellow-400 hover:bg-yellow-500 disabled:opacity-50 font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-all"
              >
                {authLoading ? 'Memproses...' : 'Kirim Kode OTP'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-blue-600 font-bold">Kode OTP dikirim ke Telegram Anda</p>
              <input 
                type="text" 
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="12345" 
                className="w-full border-2 p-4 rounded-xl text-center text-2xl tracking-[0.5em] font-bold outline-none focus:border-yellow-400 transition-colors"
              />
              <button 
                onClick={handleVerify}
                disabled={authLoading}
                className="w-full bg-black text-white hover:bg-gray-900 disabled:opacity-50 font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-all"
              >
                {authLoading ? 'Memverifikasi...' : 'Verifikasi & Masuk'}
              </button>
              <button 
                onClick={() => setStep(1)}
                className="text-gray-400 text-sm font-medium"
              >
                Ganti Nomor HP
              </button>
            </div>
          )}
          
          {authError && (
            <motion.p 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-red-500 text-xs mt-4 font-medium"
            >
              {authError}
            </motion.p>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-gray-100 p-8 flex flex-col items-center text-center shadow-xl">
            <div className="w-24 h-24 bg-yellow-400 rounded-full flex items-center justify-center text-4xl font-black mb-4 shadow-inner text-gray-900">
              {profile.first_name[0]}
            </div>
            <h2 className="text-2xl font-bold text-gray-900">{profile.first_name} {profile.last_name}</h2>
            <p className="text-blue-500 font-medium">{profile.username ? `@${profile.username}` : ''}</p>
            
            <div className="w-full mt-8 space-y-4 text-left">
              <div className="bg-gray-50 p-5 rounded-2xl">
                <p className="text-[10px] text-gray-400 uppercase font-black tracking-wider">ID Telegram</p>
                <p className="font-mono font-bold text-gray-700 mt-1">{profile.id}</p>
              </div>
              <div className="bg-gray-50 p-5 rounded-2xl">
                <p className="text-[10px] text-gray-400 uppercase font-black tracking-wider">No. Telepon</p>
                <p className="font-bold text-gray-700 mt-1">{profile.phone}</p>
              </div>
            </div>

            <button 
              onClick={handleLogout}
              className="mt-10 flex items-center gap-2 text-red-500 font-bold text-sm hover:text-red-600 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Keluar dari Akun
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center">
      <div className="w-full max-w-[500px] bg-white min-h-screen relative shadow-2xl flex flex-col">
        {/* Header */}
        <header className="bg-yellow-400 p-4 sticky top-0 z-20 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <div className="bg-black text-yellow-400 font-black px-2 py-1 rounded italic text-sm">MR.DIY</div>
            <h1 className="font-bold text-gray-900">
              {activePage === 'home' ? 'Karir' : activePage === 'jobs' ? 'Cari Kerja' : 'Profil'}
            </h1>
          </div>
          <Bell className="w-5 h-5 text-gray-800" />
        </header>

        {/* Main Content */}
        <main className="flex-grow overflow-y-auto pb-24">
          <AnimatePresence mode="wait">
            <motion.div
              key={activePage}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activePage === 'home' && renderHome()}
              {activePage === 'jobs' && renderJobs()}
              {activePage === 'profile' && renderProfile()}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Bottom Nav */}
        <nav className="fixed bottom-0 w-full max-w-[500px] bg-white/80 backdrop-blur-md border-t flex justify-around items-center py-3 px-2 z-30 shadow-lg">
          <NavButton 
            active={activePage === 'home'} 
            onClick={() => setActivePage('home')}
            icon={<Home className="w-6 h-6" />}
            label="Beranda"
          />
          <NavButton 
            active={activePage === 'jobs'} 
            onClick={() => setActivePage('jobs')}
            icon={<Briefcase className="w-6 h-6" />}
            label="Cari Kerja"
          />
          <NavButton 
            active={activePage === 'profile'} 
            onClick={() => setActivePage('profile')}
            icon={<User className="w-6 h-6" />}
            label="Profil"
          />
        </nav>

        {/* Job Detail Modal */}
        <AnimatePresence>
          {selectedJob && (
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedJob(null)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="bg-white w-full max-w-[500px] rounded-t-[32px] p-8 relative z-10 shadow-2xl"
              >
                <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-8"></div>
                <div className="flex justify-between items-start mb-6">
                  <h2 className="text-3xl font-black text-gray-900 leading-tight">{selectedJob.title}</h2>
                  <button onClick={() => setSelectedJob(null)} className="text-gray-300 hover:text-gray-400 transition-colors">
                    <XCircle className="w-8 h-8" />
                  </button>
                </div>
                
                <div className="flex gap-2 mb-6">
                  <span className="bg-gray-100 text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg text-gray-600 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {selectedJob.location}
                  </span>
                  <span className="bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg">
                    {selectedJob.type}
                  </span>
                </div>

                <p className="text-green-600 font-black text-xl mb-6">{selectedJob.salary}</p>
                
                <div className="h-px bg-gray-100 my-6"></div>
                
                <div className="space-y-3 mb-10">
                  <h4 className="font-black text-xs uppercase tracking-widest text-gray-400">Deskripsi Pekerjaan</h4>
                  <p className="text-gray-600 text-sm leading-relaxed font-medium">
                    {selectedJob.desc}
                  </p>
                </div>

                <button 
                  className="w-full bg-yellow-400 hover:bg-yellow-500 font-black py-5 rounded-2xl shadow-xl shadow-yellow-400/20 active:scale-95 transition-all uppercase tracking-widest"
                  onClick={() => {
                    if (!profile) {
                      setSelectedJob(null);
                      setActivePage('profile');
                    } else {
                      alert('Lamaran berhasil dikirim!');
                      setSelectedJob(null);
                    }
                  }}
                >
                  {profile ? 'LAMAR SEKARANG' : 'LOGIN UNTUK MELAMAR'}
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

interface JobCardProps {
  key?: React.Key;
  job: Job;
  onClick: () => void;
}

function JobCard({ job, onClick }: JobCardProps) {
  return (
    <motion.div 
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex justify-between items-center hover:border-yellow-200 hover:shadow-md transition-all cursor-pointer group"
    >
      <div className="space-y-1">
        <h4 className="font-bold text-gray-800 group-hover:text-yellow-600 transition-colors">{job.title}</h4>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3 text-red-400" /> {job.location}
          </span>
          <span className="w-1 h-1 bg-gray-200 rounded-full"></span>
          <span>{job.type}</span>
        </div>
      </div>
      <ChevronRight className="w-5 h-5 text-gray-200 group-hover:text-yellow-400 transition-colors" />
    </motion.div>
  );
}

interface NavButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

function NavButton({ active, onClick, icon, label }: NavButtonProps) {
  return (
    <button 
      onClick={onClick} 
      className={`flex flex-col items-center gap-1 transition-all ${active ? 'text-yellow-500 scale-110' : 'text-gray-400 hover:text-gray-500'}`}
    >
      {icon}
      <span className={`text-[10px] font-black uppercase tracking-tighter ${active ? 'opacity-100' : 'opacity-60'}`}>{label}</span>
    </button>
  );
}
