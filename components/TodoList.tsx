import React, { useState, useEffect } from 'react';
import { Task } from '../types';
import { userService } from '../services/userService';
import { sendWebhook } from '../services/webhookService';
import { supabase } from '../lib/supabase';

const priorityColors = {
  baixa: 'bg-green-100 text-green-700 border-green-200',
  media: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  alta: 'bg-red-100 text-red-700 border-red-200',
};

const priorityLabels = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
};

const statusColors = {
  pendente: 'bg-gray-100 text-gray-600',
  em_progresso: 'bg-blue-100 text-blue-600',
  concluida: 'bg-green-100 text-green-600',
};

const statusLabels = {
  pendente: 'Pendente',
  em_progresso: 'Em Progresso',
  concluida: 'Concluída',
  completed: 'Concluída' // Compatibility
};

export const TodoList: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<'todas' | 'pendente' | 'em_progresso' | 'concluida'>('todas');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [viewingTask, setViewingTask] = useState<Task | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('nbapark_user');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      setCurrentUser(user);
      loadTasks(user.id);
    } else {
      setLoading(false);
    }
  }, []);

  const loadTasks = async (userId: string) => {
    try {
      setLoading(true);
      const data = await userService.getMyTasks(userId);
      setTasks(data);
    } catch (e) {
      console.error("Failed to load tasks", e);
    } finally {
      setLoading(false);
    }
  };

  // Realtime
  useEffect(() => {
    if (!currentUser) return;

    const channel = supabase
      .channel('my-tasks')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'tasks',
        filter: `assigned_to=eq.${currentUser.id}`
      }, () => {
        loadTasks(currentUser.id);
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [currentUser]);

  const handleStart = async (task: Task) => {
    if (task.status !== 'pendente') return;

    // Optimistic update
    setTasks(prev => prev.map(t =>
      t.id === task.id ? { ...t, status: 'em_progresso' } : t
    ));

    try {
      await userService.startTask(task.id);
      // Trigger webhook for start if needed (optional)
    } catch (e) {
      console.error("Error starting task", e);
      // Revert on error
      loadTasks(currentUser.id);
      alert("Erro ao iniciar tarefa.");
    }
  };

  const handleComplete = async (task: Task) => {
    if (task.status === 'concluida') return;

    // Optimistic update
    setTasks(prev => prev.map(t =>
      t.id === task.id ? { ...t, status: 'concluida', completedAt: new Date().toISOString() } : t
    ));

    try {
      await userService.completeTask(task.id, currentUser.id);

      // Trigger webhook
      sendWebhook({
        event: 'task_completed',
        taskId: task.id,
        taskTitle: task.title,
        userId: currentUser.id,
        userName: currentUser.name
      });

      // Show native notification/toast
      // Note: App parent component handles global toasts, for now we assume optimistic UI is feedback enough
      // or we can add a local state for success message.
    } catch (e) {
      console.error("Error completing task", e);
      // Revert on error
      loadTasks(currentUser.id);
      alert("Erro ao concluir tarefa. Verifique sua conexão.");
    }
  };

  const handleToggleSelect = (taskId: string) => {
    setSelectedTasks(prev =>
      prev.includes(taskId)
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  const handleStartSelected = async () => {
    if (selectedTasks.length === 0) return;

    // Optimistic
    setTasks(prev => prev.map(t =>
      selectedTasks.includes(t.id) ? { ...t, status: 'em_progresso' } : t
    ));

    const tasksToStart = [...selectedTasks];
    setSelectedTasks([]); // Clear selection immediately

    try {
      await userService.startTasks(tasksToStart);
      alert(`${tasksToStart.length} tarefas iniciadas!`);
    } catch (e) {
      console.error("Error starting tasks", e);
      loadTasks(currentUser.id);
      alert("Erro ao iniciar tarefas.");
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === 'todas') return true;
    return task.status === filter;
  });

  const todayTasks = filteredTasks.filter(task => {
    if (!task.deadline) return false;
    const today = new Date().toISOString().split('T')[0];
    return task.deadline.startsWith(today);
  });

  const stats = {
    total: tasks.length,
    concluidas: tasks.filter(t => t.status === 'concluida').length,
    emProgresso: tasks.filter(t => t.status === 'em_progresso').length,
    pendentes: tasks.filter(t => t.status === 'pendente').length,
  };

  // Gerar dias do mês atual
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];

    // Preencher dias vazios do início
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }

    // Dias do mês
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(i);
    }

    return days;
  };

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const dayNames = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

  const isToday = (day: number) => {
    const today = new Date();
    return day === today.getDate() &&
      selectedDate.getMonth() === today.getMonth() &&
      selectedDate.getFullYear() === today.getFullYear();
  };

  const hasTaskOnDay = (day: number) => {
    const m = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    const dateStr = `${selectedDate.getFullYear()}-${m}-${d}`;
    return tasks.some(t => t.deadline && t.deadline.startsWith(dateStr));
  };

  return (
    <div className="animate-fadeIn space-y-5">

      {/* Header com Estatísticas */}
      <div className="p-6 rounded-3xl text-white relative overflow-hidden shadow-xl" style={{ background: 'linear-gradient(to bottom right, #1D428A, #2563eb)' }}>
        <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
        <div className="absolute -left-8 -bottom-8 w-24 h-24 bg-white/5 rounded-full blur-xl"></div>

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-black uppercase italic tracking-tighter">Minhas Tarefas</h2>
              <p className="text-xs opacity-80 font-semibold mt-1">
                Sincronizado com Admin
              </p>
            </div>
            <div className={`w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm ${loading ? 'animate-pulse' : ''}`}>

            </div>

          </div>
        </div>

        {/* Action Bar for Selection - FIXED BOTTOM THUMB ZONE */}
        {selectedTasks.length > 0 && (
          <div className="fixed bottom-24 left-4 right-4 z-40 bg-gray-900/90 backdrop-blur-xl p-4 rounded-2xl flex items-center justify-between animate-slideUp border border-white/10 shadow-2xl">
            <div className="flex flex-col">
              <span className="font-bold text-white text-sm">{selectedTasks.length} selecionadas</span>
              <span className="text-[10px] text-gray-400">Prontas para iniciar</span>
            </div>
            <button
              onClick={handleStartSelected}
              className="bg-green-500 text-white font-black uppercase text-xs px-6 py-3 rounded-xl shadow-lg hover:bg-green-600 transition-all active:scale-95 flex items-center gap-2"
            >
              <i className="fas fa-play"></i>
              Iniciar Agora
            </button>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl text-center">
            <p className="text-2xl font-black">{stats.concluidas}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">Concluídas</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl text-center">
            <p className="text-2xl font-black">{stats.emProgresso}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">Em Progresso</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl text-center">
            <p className="text-2xl font-black">{stats.pendentes}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">Pendentes</p>
          </div>
        </div>
      </div>


      {/* Mini Calendário */}
      <div className="bg-white p-5 rounded-3xl shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1))}
            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-600 transition-colors"
          >
            <i className="fas fa-chevron-left"></i>
          </button>
          <h3 className="font-black text-gray-800 uppercase tracking-wider text-sm">
            {monthNames[selectedDate.getMonth()]} {selectedDate.getFullYear()}
          </h3>
          <button
            onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1))}
            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-600 transition-colors"
          >
            <i className="fas fa-chevron-right"></i>
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center">
          {dayNames.map((day, i) => (
            <div key={i} className="text-[10px] font-bold text-gray-400 uppercase py-2">{day}</div>
          ))}
          {getDaysInMonth(selectedDate).map((day, i) => (
            <div key={i} className="aspect-square flex items-center justify-center relative">
              {day && (
                <span className={`w-9 h-9 flex items-center justify-center rounded-full text-xs font-bold transition-all
                  ${isToday(day) ? 'bg-nba-blue text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}
                `}>
                  {day}
                  {hasTaskOnDay(day) && (
                    <span className="absolute bottom-1 w-1.5 h-1.5 bg-nba-red rounded-full ring-1 ring-white"></span>
                  )}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Filtros - Horizontal Scroll */}
      <div className="flex gap-2 overflow-x-auto pb-4 pt-2 px-1 scrollbar-hide -mx-2 px-2">
        {(['todas', 'pendente', 'em_progresso', 'concluida'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-5 py-3 rounded-xl text-xs font-bold uppercase whitespace-nowrap transition-all active:scale-95 ${filter === f
              ? 'text-white shadow-lg shadow-blue-500/30'
              : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-100'
              }`}
            style={filter === f ? { backgroundColor: '#1D428A' } : {}}
          >
            {f === 'todas' ? 'Todas' : statusLabels[f]}
          </button>
        ))}
      </div>

      {/* Tarefas de Hoje */}
      {
        todayTasks.length > 0 && filter === 'todas' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <h3 className="font-black text-gray-800 uppercase text-sm tracking-wider flex items-center gap-2">
                <i className="fas fa-calendar-day text-nba-blue"></i>
                Hoje (Prazo)
              </h3>
              <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-lg">{todayTasks.length} tarefas</span>
            </div>
            {todayTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onComplete={handleComplete}
                onStart={handleStart}
                selected={selectedTasks.includes(task.id)}
                onToggleSelect={() => handleToggleSelect(task.id)}
                onViewDetails={setViewingTask}
              />
            ))}
          </div>
        )
      }

      {/* Lista de Tarefas */}
      <div className="space-y-4 pb-24">
        <div className="flex justify-between items-center px-1">
          <h3 className="font-black text-gray-800 uppercase text-sm tracking-wider">
            {filter === 'todas' ? 'Todas as Tarefas' : statusLabels[filter]}
          </h3>
          <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-lg">{filteredTasks.length} tarefas</span>
        </div>

        {loading && tasks.length === 0 ? (
          <div className="text-center py-12">
            <i className="fas fa-spinner fa-spin text-3xl text-nba-blue"></i>
            <p className="mt-3 text-gray-500 font-bold text-sm">Sincronizando tarefas...</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="bg-white p-10 rounded-3xl text-center border-2 border-dashed border-gray-200">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-clipboard-check text-2xl text-gray-300"></i>
            </div>
            <p className="text-gray-400 font-bold text-sm">Nenhuma tarefa encontrada</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onComplete={handleComplete}
                onStart={handleStart}
                selected={selectedTasks.includes(task.id)}
                onToggleSelect={() => handleToggleSelect(task.id)}
                onViewDetails={setViewingTask}
              />
            ))}
          </div>
        )}
      </div>
      {/* Task Details Modal */}
      {viewingTask && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn" onClick={() => setViewingTask(null)}>
          <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden animate-slideUp border border-white/20" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-black text-gray-900 uppercase italic tracking-tighter leading-tight pr-4">
                  {viewingTask.title}
                </h2>
                <button
                  onClick={() => setViewingTask(null)}
                  className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors active:scale-95"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>

              <div className="space-y-5">
                {/* Status & Priority Badges */}
                <div className="flex flex-wrap gap-2">
                  <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase border ${priorityColors[viewingTask.priority]}`}>
                    Prioridade {priorityLabels[viewingTask.priority]}
                  </span>
                  <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase ${viewingTask.status === 'concluida' ? 'bg-green-100 text-green-700' :
                    viewingTask.status === 'em_progresso' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                    {statusLabels[viewingTask.status]}
                  </span>
                </div>

                {/* Description */}
                {viewingTask.description && (
                  <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
                    <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Descrição</h4>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{viewingTask.description}</p>
                  </div>
                )}

                {/* Deadline */}
                {viewingTask.deadline && (
                  <div className="flex items-center gap-4 text-sm text-gray-600 bg-orange-50/50 p-4 rounded-2xl border border-orange-100">
                    <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-500 shadow-sm">
                      <i className="fas fa-clock"></i>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-orange-400 uppercase">Prazo</p>
                      <p className="font-bold text-gray-800">
                        {new Date(viewingTask.deadline).toLocaleString('pt-BR', {
                          weekday: 'long',
                          day: '2-digit',
                          month: 'long',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                )}

                {/* Destination */}
                {(viewingTask.destinationName || viewingTask.destinationAddress) && (
                  <div className="relative">
                    <div className="bg-gradient-to-br from-blue-50 to-white p-5 rounded-2xl border border-blue-100 relative overflow-hidden shadow-sm">
                      <div className="absolute right-0 top-0 w-32 h-32 bg-blue-500/5 rounded-bl-[4rem] pointer-events-none"></div>

                      <h4 className="text-xs font-bold text-blue-400 uppercase mb-3 flex items-center gap-2">
                        <i className="fas fa-location-dot"></i> Destino
                      </h4>

                      {viewingTask.destinationName && (
                        <div className="flex items-start gap-3 mb-2 relative z-10">
                          <span className="font-black text-gray-900 text-lg leading-tight">{viewingTask.destinationName}</span>
                        </div>
                      )}

                      {viewingTask.destinationAddress && (
                        <p className="text-sm text-gray-600 relative z-10 mb-4 leading-relaxed">
                          {viewingTask.destinationAddress}
                        </p>
                      )}

                      {(viewingTask.destinationLatitude && viewingTask.destinationLongitude) ? (
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${viewingTask.destinationLatitude},${viewingTask.destinationLongitude}`}
                          target="_blank"
                          rel="noreferrer"
                          className="w-full flex items-center justify-center gap-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all active:scale-95 px-4 py-3 rounded-xl shadow-lg shadow-blue-500/20"
                        >
                          <i className="fas fa-external-link-alt"></i>
                          Abrir no Maps
                        </a>
                      ) : viewingTask.destinationAddress && (
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(viewingTask.destinationAddress)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="w-full flex items-center justify-center gap-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all active:scale-95 px-4 py-3 rounded-xl shadow-lg shadow-blue-500/20"
                        >
                          <i className="fas fa-external-link-alt"></i>
                          Abrir no Maps
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Meta Info */}
                <div className="text-[10px] text-gray-400 pt-4 border-t border-gray-100 flex justify-between items-center">
                  <span>Criado: {new Date(viewingTask.createdAt).toLocaleDateString()}</span>
                  {viewingTask.completedAt && (
                    <span className="text-green-600 font-bold bg-green-50 px-2 py-1 rounded-md">
                      Concluído: {new Date(viewingTask.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>

              </div>
            </div>

            <div className="bg-gray-50 p-5 flex gap-3 border-t border-gray-100">
              <button
                onClick={() => setViewingTask(null)}
                className="flex-1 px-5 py-3.5 rounded-xl font-bold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition-all active:scale-95 text-sm uppercase tracking-wide"
              >
                Fechar
              </button>
              {viewingTask.status !== 'concluida' && (
                <button
                  onClick={() => {
                    handleComplete(viewingTask);
                    setViewingTask(null);
                  }}
                  className="flex-[2] px-5 py-3.5 rounded-xl font-bold bg-green-500 text-white hover:bg-green-600 transition-all active:scale-95 text-sm shadow-xl shadow-green-500/30 uppercase tracking-wide flex items-center justify-center gap-2"
                >
                  <i className="fas fa-check"></i>
                  Concluir
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Componente do Card de Tarefa
interface TaskCardProps {
  task: Task;
  onComplete: (task: Task) => void;
  onStart: (task: Task) => void;
  selected: boolean;
  onToggleSelect: () => void;
  onViewDetails: (task: Task) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onComplete, onStart, selected, onToggleSelect, onViewDetails }) => {
  return (
    <div className={`bg-white p-5 rounded-2xl shadow-sm border-l-4 transition-all hover:shadow-md active:scale-[0.99] touch-manipulation ${task.status === 'concluida' ? 'border-green-500 opacity-70' :
      task.status === 'em_progresso' ? 'border-blue-500 bg-blue-50/20' :
        task.priority === 'alta' ? 'border-red-500' :
          task.priority === 'media' ? 'border-yellow-500' : 'border-green-500'
      } ${selected ? 'ring-2 ring-blue-400 bg-blue-50' : ''}`}>
      <div className="flex items-start gap-4">
        {/* Checkbox for Selection - IMPROVED TOUCH TARGET */}
        {task.status === 'pendente' && (
          <div className="mt-1 -ml-1">
            <div
              onClick={(e) => { e.stopPropagation(); onToggleSelect(); }}
              className="p-2 cursor-pointer"
            >
              <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${selected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`}>
                {selected && <i className="fas fa-check text-white text-xs"></i>}
              </div>
            </div>
          </div>
        )}

        {/* Status Icon */}
        <div className="flex-shrink-0 mt-2">
          {task.status === 'em_progresso' && <i className="fas fa-spinner fa-spin text-blue-500 text-lg"></i>}
          {task.status === 'pendente' && task.status !== 'em_progresso' && !selected && (
            task.priority === 'alta' ? <i className="fas fa-exclamation-circle text-red-500 text-lg"></i> :
              task.priority === 'media' ? <i className="fas fa-info-circle text-yellow-500 text-lg"></i> :
                <i className="fas fa-check-circle text-green-500 text-lg"></i>
          )}
        </div>

        {/* Conteúdo */}
        <div className="flex-1 min-w-0" onClick={() => onViewDetails(task)}>
          <h4 className={`font-bold text-gray-800 text-base mb-1 ${task.status === 'concluida' ? 'line-through text-gray-400' : ''}`}>
            {task.title}
          </h4>

          {task.description && (
            <p className="text-xs text-gray-500 mb-2 line-clamp-2 leading-relaxed">{task.description}</p>
          )}

          {/* Destination Info */}
          {(task.destinationName || task.destinationAddress) && (
            <div className="mb-3 text-xs bg-gray-50 p-2.5 rounded-xl border border-gray-100 flex items-start gap-2">
              <i className="fas fa-map-marker-alt text-red-500 mt-0.5"></i>
              <div>
                {task.destinationName && <span className="font-bold text-gray-700 block">{task.destinationName}</span>}
                {task.destinationAddress && <span className="text-gray-500 line-clamp-1">{task.destinationAddress}</span>}
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            {task.deadline && (
              <span className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 bg-gray-100 px-2.5 py-1.5 rounded-lg">
                <i className="fas fa-clock text-gray-400"></i>
                {new Date(task.deadline).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            <span className={`text-[10px] font-bold uppercase px-2.5 py-1.5 rounded-lg border ${priorityColors[task.priority]}`}>
              {priorityLabels[task.priority]}
            </span>
            {task.status === 'em_progresso' && (
              <span className="text-[10px] font-bold uppercase px-2.5 py-1.5 rounded-lg bg-blue-100 text-blue-600 border border-blue-200">
                Em Progresso
              </span>
            )}
          </div>
        </div>

        {/* Ações - IMPROVED TOUCH TARGETS */}
        <div className="relative flex flex-col gap-2 pl-2">
          {task.status === 'pendente' && (
            <button
              onClick={(e) => { e.stopPropagation(); onStart(task); }}
              className="w-10 h-10 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 rounded-xl transition-all active:scale-95 flex items-center justify-center shadow-sm"
            >
              <i className="fas fa-play text-sm"></i>
            </button>
          )}

          {task.status !== 'concluida' && (
            <button
              onClick={(e) => { e.stopPropagation(); onComplete(task); }}
              className="w-10 h-10 bg-green-50 hover:bg-green-100 text-green-600 border border-green-200 rounded-xl transition-all active:scale-95 flex items-center justify-center shadow-sm"
            >
              <i className="fas fa-check text-sm"></i>
            </button>
          )}

          {task.status === 'concluida' && (
            <div className="w-10 h-10 flex items-center justify-center text-green-500">
              <i className="fas fa-check-double text-xl"></i>
            </div>
          )}

          <button
            onClick={(e) => { e.stopPropagation(); onViewDetails(task); }}
            className="w-10 h-10 text-gray-300 hover:text-blue-500 flex items-center justify-center rounded-xl hover:bg-gray-50 transition-colors"
          >
            <i className="fas fa-info-circle text-xl"></i>
          </button>
        </div>
      </div>
    </div>
  );
};


