import React from 'react';
import { Task } from '../types';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line
} from 'recharts';

interface TaskMetricsProps {
    tasks: Task[];
}

export const TaskMetrics: React.FC<TaskMetricsProps> = ({ tasks }) => {
    // 1. Status Distribution
    const statusData = [
        { name: 'Pendentes', value: tasks.filter(t => t.status === 'pendente').length, color: '#9CA3AF' },
        { name: 'Em Andamento', value: tasks.filter(t => t.status === 'em_progresso').length, color: '#3B82F6' },
        { name: 'Concluídas', value: tasks.filter(t => t.status === 'concluida').length, color: '#10B981' },
    ];

    // 2. Average Duration (for completed tasks)
    const completedTasks = tasks.filter(t => t.status === 'concluida' && t.startedAt && t.completedAt);

    const calculateDurationInMinutes = (start: string, end: string) => {
        return (new Date(end).getTime() - new Date(start).getTime()) / 1000 / 60;
    };

    const avgDurationByPriority = ['baixa', 'media', 'alta'].map(priority => {
        const priorityTasks = completedTasks.filter(t => t.priority === priority);
        const totalDuration = priorityTasks.reduce((acc, t) => acc + calculateDurationInMinutes(t.startedAt!, t.completedAt!), 0);
        return {
            name: priority.charAt(0).toUpperCase() + priority.slice(1),
            avgDuration: priorityTasks.length ? Math.round(totalDuration / priorityTasks.length) : 0
        };
    });

    // 3. Tasks Completed Over Time (Last 7 days)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toISOString().split('T')[0];
    }).reverse();

    const completedOverTime = last7Days.map(date => ({
        date: new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        count: tasks.filter(t => t.status === 'concluida' && t.completedAt?.startsWith(date)).length
    }));

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 animate-fadeIn">

            {/* Card 1: Status Distribution */}
            <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                    <i className="fas fa-chart-pie text-nba-blue"></i>
                    Distribuição por Status
                </h3>
                <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={statusData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {statusData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend verticalAlign="bottom" height={36} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Card 2: Average Duration by Priority */}
            <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                    <i className="fas fa-stopwatch text-orange-500"></i>
                    Duração Média (Minutos)
                </h3>
                <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={avgDurationByPriority}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} />
                            <YAxis axisLine={false} tickLine={false} />
                            <Tooltip cursor={{ fill: '#F3F4F6' }} />
                            <Bar dataKey="avgDuration" fill="#F59E0B" radius={[4, 4, 0, 0]} barSize={40} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Card 3: Completion Trend */}
            <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                    <i className="fas fa-chart-line text-green-500"></i>
                    Conclusões (7 Dias)
                </h3>
                <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={completedOverTime}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="date" axisLine={false} tickLine={false} />
                            <YAxis axisLine={false} tickLine={false} allowDecimals={false} />
                            <Tooltip />
                            <Line type="monotone" dataKey="count" stroke="#10B981" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

        </div>
    );
};
