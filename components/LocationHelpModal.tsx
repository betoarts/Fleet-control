import React from 'react';

interface LocationHelpModalProps {
  onClose: () => void;
}

export const LocationHelpModal: React.FC<LocationHelpModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fadeIn p-4">
      <div className="bg-white max-w-sm w-full rounded-3xl p-6 shadow-2xl relative overflow-hidden animate-scaleIn">
        
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center flex-shrink-0">
             <i className="fas fa-location-slash text-2xl text-nba-red"></i>
          </div>
          <div>
            <h3 className="text-xl font-black text-gray-800 uppercase italic tracking-tighter leading-none">Acesso Bloqueado</h3>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Pelo Navegador</p>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-4 mb-8">
           <p className="text-sm text-gray-600 font-medium">
             Você bloqueou o acesso à localização para este aplicativo. Para ativar, siga os passos no seu navegador:
           </p>

           <div className="bg-gray-50 rounded-xl p-4 space-y-3 border border-gray-100">
              <div className="flex items-start gap-3">
                 <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-sm font-black text-xs text-nba-blue flex-shrink-0 border border-gray-100">1</div>
                 <p className="text-sm font-bold text-gray-700">Toque no ícone de <span className="inline-block bg-white px-1 rounded shadow-sm"><i className="fas fa-lock text-xs"></i> Cadeado</span> ou Configurações na barra de endereço (URL).</p>
              </div>
              
              <div className="flex items-start gap-3">
                 <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-sm font-black text-xs text-nba-blue flex-shrink-0 border border-gray-100">2</div>
                 <p className="text-sm font-bold text-gray-700">Selecione <span className="font-black text-black">Permissões</span> ou Configurações do Site.</p>
              </div>

               <div className="flex items-start gap-3">
                 <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-sm font-black text-xs text-nba-blue flex-shrink-0 border border-gray-100">3</div>
                 <p className="text-sm font-bold text-gray-700">Ative a opção <span className="font-black text-black">Localização</span>.</p>
              </div>
           </div>
        </div>

        {/* Action */}
        <button 
          onClick={onClose}
          className="w-full bg-nba-blue text-white font-black py-4 rounded-xl uppercase tracking-widest shadow-lg shadow-blue-900/20 hover:bg-blue-900 transition-colors active:scale-[0.98]"
        >
          Entendi, vou tentar
        </button>

      </div>
    </div>
  );
};
