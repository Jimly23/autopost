import React, { useState, useRef, useEffect } from 'react';
import { Menu, LogOut, Settings as SettingsIcon, ChevronDown, Bell } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

interface TopnavProps {
  onOpenMobile: () => void;
}

const pageTitles: Record<string, string> = {
  '/': 'Analitik',
  '/accounts': 'Koneksi akun',
  '/create': 'Buat postingan',
  '/planner': 'Jadwal planner',
  '/posts': 'Riwayat publikasi',
  '/media': 'Pustaka media',
  '/analytics': 'Analitik & Insights',
  '/settings': 'Pengaturan umum',
};

export const Topnav: React.FC<TopnavProps> = ({ onOpenMobile }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentPageTitle = pageTitles[location.pathname] || 'Dashboard';

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setDropdownOpen(false);
    await logout();
    navigate('/login');
  };

  return (
    <header className="h-16 bg-white dark:bg-[#090a0f] border-b border-slate-200/80 dark:border-white/[0.06] px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30 transition-colors">
      {/* Mobile menu button & Breadcrumb (matching reference: Dashboard / Analitik) */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobile}
          className="p-2 -ml-2 rounded-lg text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.05] lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 text-xs font-medium">
          <span className="text-slate-400 dark:text-zinc-500">Dashboard</span>
          <span className="text-slate-300 dark:text-zinc-700">/</span>
          <span className="text-slate-900 dark:text-white font-semibold">{currentPageTitle}</span>
        </div>
      </div>

      {/* User profile dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-2.5 p-1.5 pl-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/[0.05] border border-transparent hover:border-slate-200/80 dark:hover:border-white/10 transition-all"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs">
            {user?.name ? user.name.charAt(0) : 'U'}
          </div>
          <div className="text-left hidden md:block">
            <span className="block text-xs font-semibold text-slate-900 dark:text-white leading-tight">
              {user?.name || 'User'}
            </span>
            <span className="block text-[11px] text-slate-500 dark:text-zinc-400 leading-tight">
              {user?.email || ''}
            </span>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500" />
        </button>

        {/* Dropdown Menu */}
        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#12131a] rounded-2xl shadow-xl border border-slate-200/90 dark:border-white/10 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-4 py-2 border-b border-slate-100 dark:border-white/[0.06] md:hidden">
              <p className="text-xs font-semibold text-slate-900 dark:text-white">{user?.name}</p>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">{user?.email}</p>
            </div>
            <button
              onClick={() => {
                setDropdownOpen(false);
                navigate('/settings');
              }}
              className="w-full px-4 py-2 text-left text-xs text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-white/[0.05] flex items-center gap-2.5 transition-colors"
            >
              <SettingsIcon className="w-4 h-4 text-slate-400 dark:text-zinc-500" />
              Pengaturan & Profil
            </button>
            <div className="my-1 border-t border-slate-100 dark:border-white/[0.06]" />
            <button
              onClick={handleLogout}
              className="w-full px-4 py-2 text-left text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 flex items-center gap-2.5 transition-colors font-medium"
            >
              <LogOut className="w-4 h-4 text-rose-500" />
              Keluar akun
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
