import React, { useEffect, useRef, useState, useCallback } from 'react';

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasFinished, setHasFinished] = useState(false);

  // Função para finalizar (evita chamadas múltiplas)
  const handleFinish = useCallback(() => {
    if (!hasFinished) {
      setHasFinished(true);
      onFinish();
    }
  }, [hasFinished, onFinish]);

  useEffect(() => {
    // Tenta reproduzir automaticamente
    if (videoRef.current) {
      videoRef.current.play()
        .catch(err => {
          console.error("Autoplay falhou:", err);
          // Se autoplay falhar, vai direto para o app
          handleFinish();
        });
    }

    // Timeout de segurança: se o vídeo não terminar em 10 segundos, força a transição
    const timeout = setTimeout(() => {
      handleFinish();
    }, 10000);

    return () => clearTimeout(timeout);
  }, [handleFinish]);

  return (
    <div 
      className="fixed inset-0 z-[60] bg-black flex items-center justify-center overflow-hidden cursor-pointer"
      onClick={handleFinish} // Tocar em qualquer lugar pula o vídeo
    >
      <video
        ref={videoRef}
        src="/intro.mp4"
        className="w-full h-full object-cover pointer-events-none"
        muted
        playsInline
        autoPlay
        onEnded={handleFinish}
      />
      
      {/* Indicador de "Toque para pular" */}
      <div className="absolute bottom-10 left-0 right-0 text-center">
        <span className="text-white/50 text-xs font-bold uppercase tracking-widest animate-pulse">
          Toque para entrar
        </span>
      </div>
    </div>
  );
};
