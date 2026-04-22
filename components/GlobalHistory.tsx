
import React, { useState, useEffect } from 'react';
import { Reservation } from '../types';
import { userService } from '../services/userService';

export const GlobalHistory: React.FC = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    userService.getAllReservations()
      .then(setReservations)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Filter Logic
  const filteredReservations = reservations.filter(r => {
    const matchesSearch = r.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          r.vehicle.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;

    if (startDate) {
        const start = new Date(startDate);
        if (new Date(r.startTime) < start) return false;
    }

    if (endDate) {
        const end = new Date(endDate);
        // Ajuste para incluir o final do dia
        end.setHours(23, 59, 59, 999);
        if (new Date(r.startTime) > end) return false;
    }

    return true;
  });

  const handleExport = () => {
    if (filteredReservations.length === 0) return alert("Sem dados para exportar.");

    const headers = ["ID", "Motorista", "Veículo", "Data Saída", "Hora Saída", "Data Volta", "Hora Volta", "KM Inicial", "KM Final", "KM Total", "Itinerário", "Status"];
    
    const csvContent = [
        headers.join(","),
        ...filteredReservations.map(r => {
            const start = new Date(r.startTime);
            const end = r.endTime ? new Date(r.endTime) : null;
            const kmDiff = (r.endOdometer || 0) - r.startOdometer;

            return [
                r.id,
                `"${r.employeeName}"`,
                `"${r.vehicle}"`,
                start.toLocaleDateString('pt-BR'),
                start.toLocaleTimeString('pt-BR'),
                end ? end.toLocaleDateString('pt-BR') : '-',
                end ? end.toLocaleTimeString('pt-BR') : '-',
                r.startOdometer,
                r.endOdometer || '-',
                r.endOdometer ? kmDiff : '-',
                `"${r.itinerary || ''}"`,
                r.status
            ].join(",");
        })
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `extrato_frota_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="animate-fadeIn space-y-6 max-w-4xl mx-auto pb-20">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center shadow-sm">
                <i className="fas fa-globe-americas text-3xl text-purple-600"></i>
            </div>
            <div>
                <h2 className="text-2xl font-black text-gray-800 uppercase italic tracking-tighter">Relatórios Gerais</h2>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Histórico Global de Viagens</p>
            </div>
        </div>
        <button 
            onClick={handleExport}
            className="bg-green-500 text-white px-6 py-3 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-green-600 transition-colors shadow-lg flex items-center gap-2"
        >
            <i className="fas fa-file-csv text-lg"></i>
            Baixar Extrato
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
              <label className="block text-[10px] font-black text-gray-400 mb-1 uppercase tracking-wider">Buscar por Nome/Veículo</label>
              <div className="relative">
                  <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-300"></i>
                  <input 
                    type="text" 
                    placeholder="Ex: Humberto..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 border-transparent focus:bg-white focus:border-purple-500 font-bold text-gray-600 outline-none transition-all"
                  />
              </div>
          </div>
          <div>
              <label className="block text-[10px] font-black text-gray-400 mb-1 uppercase tracking-wider">Data Inicial</label>
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border-transparent focus:bg-white focus:border-purple-500 font-bold text-gray-600 outline-none transition-all"
              />
          </div>
          <div>
              <label className="block text-[10px] font-black text-gray-400 mb-1 uppercase tracking-wider">Data Final</label>
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border-transparent focus:bg-white focus:border-purple-500 font-bold text-gray-600 outline-none transition-all"
              />
          </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400 font-bold animate-pulse">
            Carregando histórico global...
        </div>
      ) : filteredReservations.length === 0 ? (
        <div className="bg-white p-20 rounded-[3rem] text-center shadow-inner border border-gray-100 border-dashed opacity-50">
            <i className="fas fa-filter text-gray-200 text-7xl mb-6"></i>
            <p className="text-gray-400 font-black uppercase tracking-[0.3em] text-xs">Nenhum registro encontrado</p>
        </div>
      ) : (
        <div className="grid gap-4">
            {filteredReservations.map(trip => {
                const kmDiff = (trip.endOdometer || 0) - trip.startOdometer;
                const date = new Date(trip.startTime);
                
                return (
                    <div key={trip.id} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:shadow-md transition-all group">
                        
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-sm ${trip.status === 'completed' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600 animate-pulse'}`}>
                                <i className={`fas ${trip.status === 'completed' ? 'fa-check' : 'fa-car-side'}`}></i>
                            </div>
                            <div>
                                <h4 className="font-black text-gray-800 uppercase text-lg leading-none">{trip.employeeName}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{trip.vehicle}</span>
                                    {trip.status === 'active' && <span className="text-[8px] bg-blue-50 text-blue-500 px-2 py-0.5 rounded uppercase font-black">Em Andamento</span>}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between md:justify-end gap-8 border-t md:border-t-0 border-gray-100 pt-4 md:pt-0">
                            <div className="text-right">
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider mb-0.5">Data e Hora</p>
                                <p className="text-sm font-bold text-gray-600">
                                    {date.toLocaleDateString('pt-BR')} <span className="text-gray-300">|</span> {date.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                                </p>
                            </div>

                            {trip.status === 'completed' && (
                                <div className="text-right pl-8 border-l border-dashed border-gray-200">
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider mb-0.5">KM Total</p>
                                    <p className="text-2xl font-black text-purple-600">{kmDiff} <span className="text-xs text-gray-400">KM</span></p>
                                </div>
                            )}
                        </div>

                    </div>
                );
            })}
        </div>
      )}
    </div>
  );
};
