
import React from 'react';
import { AppState, AppSettings } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: AppState;
  setActiveTab: (tab: AppState) => void;
  appSettings: AppSettings | null;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, appSettings }) => {
  const navItems: { id: AppState; label: string; icon: string }[] = [
    { id: 'dashboard', label: 'Início', icon: 'fa-chart-line' },
    { id: 'todo', label: 'Tarefas', icon: 'fa-tasks' },
    { id: 'history', label: 'Logs', icon: 'fa-history' },
    { id: 'scheduling', label: 'Agenda', icon: 'fa-calendar-alt' },
  ];

  return (
    <div className="min-h-screen apple-mesh-bg flex flex-col justify-center items-center py-0 md:py-6 select-none font-sans antialiased text-[#1D1D1F]">
      
      {/* Phone chassis on desktop / Fullscreen on mobile */}
      <div className="w-full max-w-[430px] min-h-[100dvh] md:min-h-[860px] md:max-h-[92vh] md:rounded-[50px] bg-[#F5F5F7] shadow-none md:shadow-[0_25px_70px_-15px_rgba(0,0,0,0.25),0_0_0_12px_#1C1C1E,0_0_0_14px_#3A3A3C] relative overflow-hidden flex flex-col md:border md:border-white/40">
        
        {/* Dynamic Island (Desktop Simulation) */}
        <div className="hidden md:flex absolute top-3 left-1/2 -translate-x-1/2 w-28 h-6 bg-black rounded-full z-50 items-center justify-end px-2.5 shadow-sm">
          <div className="w-2.5 h-2.5 rounded-full bg-[#0d0d12] border border-neutral-700/40 mr-1.5 flex items-center justify-center">
            <div className="w-1 h-1 rounded-full bg-blue-950"></div>
          </div>
          <div className="w-2.5 h-2.5 rounded-full bg-[#0a1224] border border-blue-900/30"></div>
        </div>

        {/* Apple Frosted Glass Header */}
        <header className="sticky top-0 z-40 apple-glass-header md:pt-7 pt-[max(0.75rem,env(safe-area-inset-top))] px-4 pb-3 transition-all duration-200">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-white/90 shadow-sm border border-black/5 flex items-center justify-center p-1.5 overflow-hidden">
                <img 
                  src={appSettings?.logoUrl || "/logo.png"} 
                  alt="Logo" 
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }} 
                />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h1 className="text-base font-bold tracking-tight text-slate-900 leading-none">
                    {appSettings?.companyName || 'Fleet Control'}
                  </h1>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                </div>
                <p className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase mt-0.5">
                  Controle de Frota
                </p>
              </div>
            </div>

            <button 
              onClick={() => setActiveTab('about')}
              className={`apple-tap flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                activeTab === 'about' 
                  ? 'bg-nba-blue text-white shadow-sm shadow-blue-900/20' 
                  : 'bg-white/80 hover:bg-white text-slate-700 border border-black/5 shadow-xs'
              }`}
              title="Sobre o aplicativo"
            >
              <i className="fas fa-info-circle text-[11px]"></i>
              <span>Sobre</span>
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 w-full px-4 pt-4 pb-28 overflow-y-auto scrollbar-hide">
          {children}
        </main>

        {/* Floating iOS Glass Tab Bar (Dock) */}
        <nav className="fixed md:absolute bottom-3 md:bottom-5 left-3 right-3 md:left-4 md:right-4 z-50 apple-glass-dock rounded-[32px] px-2 py-1.5 flex items-center justify-between shadow-glass-float">
          {/* Left Tabs (Início, Tarefas) */}
          <div className="flex items-center flex-1 justify-around">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`apple-tap flex flex-col items-center justify-center min-w-[56px] min-h-[46px] rounded-2xl transition-all ${
                activeTab === 'dashboard' 
                  ? 'text-nba-blue bg-blue-50/80 font-bold' 
                  : 'text-slate-400 hover:text-slate-600 font-medium'
              }`}
            >
              <i className="fas fa-chart-line text-lg mb-0.5"></i>
              <span className="text-[10px] tracking-tight">Início</span>
            </button>

            <button 
              onClick={() => setActiveTab('todo')}
              className={`apple-tap flex flex-col items-center justify-center min-w-[56px] min-h-[46px] rounded-2xl transition-all ${
                activeTab === 'todo' 
                  ? 'text-nba-blue bg-blue-50/80 font-bold' 
                  : 'text-slate-400 hover:text-slate-600 font-medium'
              }`}
            >
              <i className="fas fa-tasks text-lg mb-0.5"></i>
              <span className="text-[10px] tracking-tight">Tarefas</span>
            </button>
          </div>

          {/* Center Apple Elevated Button (Nova Saída) */}
          <div className="px-2">
            <button 
              onClick={() => setActiveTab('new-reservation')}
              className="apple-tap w-12 h-12 rounded-full bg-gradient-to-tr from-[#C8102E] to-[#E02446] text-white flex items-center justify-center shadow-lg shadow-red-500/35 border-2 border-white/90 -translate-y-2 hover:scale-105 active:scale-95 transition-all"
              title="Nova Saída de Veículo"
            >
              <i className="fas fa-plus text-lg"></i>
            </button>
          </div>

          {/* Right Tabs (Logs, Agenda) */}
          <div className="flex items-center flex-1 justify-around">
            <button 
              onClick={() => setActiveTab('history')}
              className={`apple-tap flex flex-col items-center justify-center min-w-[56px] min-h-[46px] rounded-2xl transition-all ${
                activeTab === 'history' 
                  ? 'text-nba-blue bg-blue-50/80 font-bold' 
                  : 'text-slate-400 hover:text-slate-600 font-medium'
              }`}
            >
              <i className="fas fa-history text-lg mb-0.5"></i>
              <span className="text-[10px] tracking-tight">Logs</span>
            </button>

            <button 
              onClick={() => setActiveTab('scheduling')}
              className={`apple-tap flex flex-col items-center justify-center min-w-[56px] min-h-[46px] rounded-2xl transition-all ${
                activeTab === 'scheduling' 
                  ? 'text-nba-blue bg-blue-50/80 font-bold' 
                  : 'text-slate-400 hover:text-slate-600 font-medium'
              }`}
            >
              <i className="fas fa-calendar-alt text-lg mb-0.5"></i>
              <span className="text-[10px] tracking-tight">Agenda</span>
            </button>
          </div>
        </nav>
      
      </div>
    </div>
  );
};
