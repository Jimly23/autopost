import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Instagram,
  PlusCircle,
  Calendar,
  FileText,
  Image,
  BarChart3,
  Settings,
  Sparkles,
  X,
  ChevronDown,
  Moon,
  Sun,
  LogOut,
  Bot,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

const navItems = [
  { name: 'Analitik', path: '/', icon: BarChart3 },
  { name: 'Koneksi akun', path: '/accounts', icon: Instagram },
  { name: 'Buat postingan', path: '/create', icon: PlusCircle },
  { name: 'Jadwal planner', path: '/planner', icon: Calendar },
  { name: 'Riwayat publikasi', path: '/posts', icon: FileText },
  { name: 'Pustaka media', path: '/media', icon: Image },
  { name: 'Pengaturan umum', path: '/settings', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onCloseMobile }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const usernameHandle = user?.email?.split('@')[0] || 'socialbot';
  const displayName = user?.name || 'Automation Workspace';

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar aside */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-white dark:bg-[#0b0c11] border-r border-slate-200/80 dark:border-white/[0.07] flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand header */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-slate-100 dark:border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-cyan-400 flex items-center justify-center text-white shadow-sm shadow-blue-500/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-slate-900 dark:text-white tracking-tight text-base leading-none block">
                automation
              </span>
              <span className="text-[9px] uppercase tracking-widest block font-bold text-slate-400 dark:text-zinc-500 mt-1">
                INSTAGRAM • YOUTUBE • TIKTOK
              </span>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.05] lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Active Profile / Account Selector Pill (matching reference) */}
        <div className="px-3 pt-3">
          <div
            onClick={() => navigate('/accounts')}
            className="group flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-[#14151e] border border-slate-200/80 dark:border-white/[0.07] hover:border-slate-300 dark:hover:border-white/20 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-900 via-purple-900 to-pink-900 border border-purple-500/30 flex items-center justify-center text-white shrink-0 text-xs font-bold shadow-xs">
                {user?.name ? user.name.charAt(0).toUpperCase() : <Bot className="w-4 h-4 text-purple-300" />}
              </div>
              <div className="min-w-0 text-left">
                <span className="block text-xs font-bold text-slate-900 dark:text-white truncate leading-tight">
                  {displayName}
                </span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">
                    @{usernameHandle}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.2 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                    Bot aktif
                  </span>
                </div>
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 group-hover:text-slate-600 dark:group-hover:text-zinc-300 shrink-0 ml-1 transition-colors" />
          </div>
        </div>

        {/* Navigation list */}
        <div className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
          <div className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
            PENGATURAN
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `group flex items-center justify-between px-3 py-2 rounded-xl text-[13px] font-medium transition-all ${
                    isActive
                      ? 'bg-blue-50 dark:bg-[#18233a] text-blue-600 dark:text-blue-400 font-semibold border border-blue-200/60 dark:border-blue-500/20 shadow-xs'
                      : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.04]'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-colors ${
                          isActive
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-slate-400 dark:text-zinc-500 group-hover:text-slate-700 dark:group-hover:text-zinc-300'
                        }`}
                      />
                      <span className="truncate">{item.name}</span>
                    </div>
                    {/* Small blue dot indicator for active item (matching reference) */}
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 shadow-sm shadow-blue-500/50 shrink-0 ml-2" />
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Bottom Section: Theme Switcher & Logout */}
        <div className="p-3 border-t border-slate-100 dark:border-white/[0.06] space-y-1">
          {/* Theme Switcher */}
          <div className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/[0.04] transition-colors">
            <div className="flex items-center gap-2.5 text-xs font-medium text-slate-600 dark:text-zinc-400">
              {theme === 'dark' ? <Moon className="w-3.5 h-3.5 text-blue-400" /> : <Sun className="w-3.5 h-3.5 text-amber-500" />}
              <span>Tema</span>
            </div>
            <button
              onClick={toggleTheme}
              className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-200/80 dark:bg-white/[0.06] text-slate-800 dark:text-zinc-200 hover:bg-slate-300 dark:hover:bg-white/10 transition-colors"
            >
              <span>{theme === 'dark' ? 'Dark' : 'Light'}</span>
              <ChevronDown className="w-3 h-3 text-slate-400 dark:text-zinc-400" />
            </button>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors text-left"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar semua akun</span>
          </button>

          {/* Version footer */}
          <div className="pt-2 px-3 text-[10px] font-semibold text-slate-400 dark:text-zinc-600 uppercase tracking-wider">
            AUTOMATION-SAAS • MULTI-PLATFORM
          </div>
        </div>
      </aside>
    </>
  );
};
