
import { supabase } from '../lib/supabase';

const callGeminiProxy = async (prompt: string, model: string = 'gemini-2.5-flash'): Promise<string> => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gemini-proxy`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ prompt, model }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao chamar Gemini');
    }

    const { text } = await response.json();
    return text;
  } catch (error: any) {
    console.error('Erro ao chamar Gemini:', error);
    throw new Error(`Erro no Serviço de IA: ${error.message || 'Indisponível'}`);
  }
};

export const analyzeItinerary = async (data: { 
  itinerary: string; 
  vehicle: string; 
  startOdometer: number; 
  employeeName: string; 
  startTime: string;
}) => {
  const { itinerary, vehicle, startOdometer, employeeName, startTime } = data;
  
  const prompt = `
    Atue como um Especialista em Logística e Eficiência de Frota da Fleet Control em Gramado/RS.
    
    DADOS DA VIAGEM:
    - Motorista: ${employeeName}
    - Veículo: ${vehicle}
    - KM Atual: ${startOdometer}
    - Horário Saída: ${new Date(startTime).toLocaleTimeString('pt-BR')}
    - Destino/Itinerário Informado: "${itinerary}"
    
    CONTEXTO GEOGRÁFICO:
    - Base: Fleet Control Gramado.
    - Ponto de Interesse Conhecido: "Loja Centro" fica no bairro centro na Pedras Altas, Gramado.
    
    SUA MISSÃO:
    1. ROTA & PREVISÃO: Analise o itinerário. Se o destino for vago (ex: "Centro"), sugira a melhor rota considerando a geografia de Gramado. Se for para a "Loja Centro", mencione explicitamente a ida para Pedras Altas.
    2. ECONOMIA & USO: Dê uma dica específica para o veículo (${vehicle}) para economizar combustível neste trajeto específico (ex: uso de marchas na serra, ar condicionado, etc).
    3. SEGURANÇA: Dê um palpite breve de segurança baseado no horário e local.
    
    RESPOSTA:
    Gere um texto curto, direto, motivador e profissional de no máximo 50 palavras, dirigido ao motorista. Use formatação simples.
  `;

  return callGeminiProxy(prompt, 'gemini-2.5-flash');
};

export const generateWeeklySummary = async (trips: any[]) => {
  // Filtrar apenas dados essenciais para reduzir tokens e focar a análise
  const relevantData = trips.map(t => ({
    motorista: t.employeeName,
    veiculo: t.vehicle || "Veículo Padrão",
    status: t.status,
    km_percorrido: t.endOdometer ? (t.endOdometer - t.startOdometer) : 0,
    rota: t.itinerary
  }));

  const tripsData = JSON.stringify(relevantData);
  
  const prompt = `Atue como o Gerente de Frota da Fleet Control. Com base nestes registros de veículos: ${tripsData}. Gere um insight executivo curto e direto (máximo 40 palavras) sobre a produtividade da frota hoje. Cite quem rodou mais, qual veículo foi mais usado e se há algo fora do comum. Use um tom profissional e motivador.`;

  return callGeminiProxy(prompt, 'gemini-3-flash-preview');
};
