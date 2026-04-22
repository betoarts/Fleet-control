import React, { useState } from 'react';
import { userService } from '../services/userService';
import { AppSettings } from '../types';

interface UserLoginProps {
  onLogin: (user: any) => void;
  appSettings: AppSettings | null;
}

export const UserLogin: React.FC<UserLoginProps> = ({ onLogin, appSettings }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Basic validation
    if (name.length < 3 || phone.length < 8) {
      setError('Por favor, preencha nome e telefone válidos.');
      setIsLoading(false);
      return;
    }

    try {
      const user = await userService.loginOrRegister(name, phone);
      if (user) {
        onLogin(user);
      } else {
        setError('Erro ao autenticar. Tente novamente.');
      }
    } catch (err) {
      console.error(err);
      setError('Erro de conexão com o banco de dados.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#1D428A] p-4">
      <div className="bg-white p-8 rounded-[2rem] shadow-2xl max-w-md w-full animate-scaleIn relative">
        <div className="text-center mb-8">
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-user-circle text-4xl text-nba-blue"></i>
            </div>
            <h2 className="text-2xl font-black text-gray-800 uppercase italic tracking-tighter">Identificação</h2>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-2">{appSettings?.companyName || 'NBAPARK Frota'}</p>
        </div>

        {error && (
            <div className="bg-red-50 text-nba-red p-4 rounded-xl mb-6 text-sm font-bold border border-red-100 flex items-center gap-3">
                <i className="fas fa-exclamation-triangle"></i>
                {error}
            </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-[0.2em]">Seu Nome</label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <i className="fas fa-signature text-gray-300"></i>
                    </div>
                    <input 
                        type="text" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ex: Carlos Silva"
                        className="w-full pl-10 pr-4 py-4 rounded-xl bg-gray-50 border-2 border-transparent focus:bg-white focus:border-nba-blue outline-none transition-all font-bold text-gray-800 placeholder-gray-300"
                        required
                    />
                </div>
            </div>

            <div>
                <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-[0.2em]">Seu Telefone</label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <i className="fas fa-phone text-gray-300"></i>
                    </div>
                    <input 
                        type="tel" 
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Ex: 54999999999"
                        className="w-full pl-10 pr-4 py-4 rounded-xl bg-gray-50 border-2 border-transparent focus:bg-white focus:border-nba-blue outline-none transition-all font-bold text-gray-800 placeholder-gray-300"
                        required
                    />
                </div>
            </div>

            <button 
                type="submit" 
                disabled={isLoading}
                className="w-full nba-blue hover:bg-blue-800 text-white font-black py-4 rounded-xl shadow-lg transition-all active:scale-[0.98] uppercase tracking-wider flex items-center justify-center gap-2"
            >
                {isLoading ? (
                    <i className="fas fa-circle-notch animate-spin"></i>
                ) : (
                    <>
                        <span>Acessar Painel</span>
                        <i className="fas fa-arrow-right"></i>
                    </>
                )}
            </button>
        </form>
      </div>
    </div>
  );
};
