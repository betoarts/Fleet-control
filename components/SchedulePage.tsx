
import React, { useState, useEffect } from 'react';
import { Schedule, scheduleService } from '../services/scheduleService';
import { User } from '../services/userService';

import { adminService } from '../services/adminService';

interface SchedulePageProps {
    user: User | null;
}

export const SchedulePage: React.FC<SchedulePageProps> = ({ user }) => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [availableVehicles, setAvailableVehicles] = useState<{id: string, name: string}[]>([]);
  
  // Form States
  const [vehicle, setVehicle] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchVehicles = async () => {
    try {
      const vehicles = await adminService.getVehicleStatus();
      const list = vehicles
          .filter(v => !v.isBlocked)
          .map(v => ({ id: v.id, name: v.vehicleName }));
      setAvailableVehicles(list);
      if (list.length > 0 && !vehicle) {
        setVehicle(list[0].name);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchSchedules = async () => {
    try {
        const data = await scheduleService.getSchedules();
        setSchedules(data);
    } catch (e) {
        console.error(e);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
    fetchVehicles();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduledAt) return alert("Selecione data e hora.");

    setIsSubmitting(true);
    try {
        await scheduleService.createSchedule(
            user?.name || 'Anônimo', 
            vehicle, 
            new Date(scheduledAt).toISOString(), 
            user?.id
        );
        alert("Agendamento realizado com sucesso!");
        setScheduledAt('');
        fetchSchedules(); // Refresh list
    } catch (e) {
        alert("Erro ao agendar.");
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="animate-fadeIn space-y-8 max-w-4xl mx-auto pb-20">
      
      {/* Header */}
      <div className="flex items-center gap-4 mb-4">
        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center shadow-sm">
            <i className="fas fa-calendar-alt text-3xl text-nba-blue"></i>
        </div>
        <div>
            <h2 className="text-2xl font-black text-gray-800 uppercase italic tracking-tighter">Agendamentos</h2>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Reserve seu veículo</p>
        </div>
      </div>

      {/* Form Card */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-nba-blue to-blue-400"></div>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
            <div>
                 <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-[0.2em]">Veículo</label>
                 <div className="relative">
                    <select 
                        value={vehicle}
                        onChange={(e) => setVehicle(e.target.value)}
                        className="w-full px-6 py-4 rounded-xl bg-gray-50 border-2 border-transparent focus:bg-white focus:border-nba-blue outline-none font-bold text-gray-700 appearance-none"
                    >
                        {availableVehicles.map(v => <option key={v.id} value={v.name}>{v.name}</option>)}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                        <i className="fas fa-chevron-down"></i>
                    </div>
                 </div>
            </div>
            
            <div>
                 <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-[0.2em]">Data e Hora</label>
                 <input 
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    required
                    className="w-full px-6 py-4 rounded-xl bg-gray-50 border-2 border-transparent focus:bg-white focus:border-nba-blue outline-none font-bold text-gray-700"
                 />
            </div>
            
            <div className="md:col-span-2">
                <button 
                  disabled={isSubmitting}
                  className="w-full py-4 bg-nba-blue text-white rounded-xl font-black uppercase tracking-widest hover:bg-blue-800 transition-all shadow-lg active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                >
                    {isSubmitting ? <i className="fas fa-spinner animate-spin"></i> : <i className="fas fa-plus"></i>}
                    Confirmar Reserva
                </button>
            </div>
        </form>
      </div>

      {/* Calendar / Timeline */}
      <div className="space-y-4">
        <h3 className="text-lg font-black text-gray-800 uppercase italic ml-2">Próximos Agendamentos</h3>
        
        {loading ? (
             <div className="text-center py-10 text-gray-400 font-bold animate-pulse">Carregando agenda...</div>
        ) : schedules.length === 0 ? (
             <div className="bg-white p-12 rounded-[2rem] border-2 border-dashed border-gray-200 text-center opacity-60">
                 <i className="far fa-calendar-times text-4xl text-gray-300 mb-2"></i>
                 <p className="text-xs font-black uppercase tracking-widest text-gray-400">Nenhum agendamento futuro</p>
             </div>
        ) : (
            <div className="grid gap-4">
                {schedules.map(schedule => {
                    const date = new Date(schedule.scheduledAt);
                    const isToday = new Date().toDateString() === date.toDateString();
                    
                    return (
                        <div key={schedule.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between group hover:border-nba-blue/30 transition-all relative overflow-hidden">
                            {isToday && <div className="absolute top-0 right-0 bg-nba-red text-white text-[8px] font-black px-2 py-1 rounded-bl-lg uppercase tracking-widest">Hoje</div>}
                            
                            <div className="flex items-center gap-4">
                                <div className="bg-blue-50 w-14 h-14 rounded-xl flex flex-col items-center justify-center text-nba-blue border border-blue-100">
                                    <span className="text-lg font-black leading-none">{date.getDate()}</span>
                                    <span className="text-[9px] font-bold uppercase">{date.toLocaleDateString('pt-BR', {month: 'short'}).replace('.','')}</span>
                                </div>
                                <div>
                                    <h4 className="font-black text-gray-800 uppercase tracking-tight">{schedule.reserverName}</h4>
                                    <div className="flex items-center gap-2 mt-1">
                                        <i className="fas fa-car text-[10px] text-gray-400"></i>
                                        <span className="text-xs font-bold text-gray-500">{schedule.vehicle}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="text-right">
                                <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-lg font-black text-sm border border-gray-200">
                                    {date.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        )}
      </div>

    </div>
  );
};
