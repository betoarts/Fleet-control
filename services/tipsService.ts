/**
 * Serviço de Dicas Estáticas - Substitui o Gemini AI
 * Gera dicas contextuais baseadas em horário, veículo e destino
 */

// Dicas de segurança por período do dia
const safetyTips: Record<string, string[]> = {
  morning: [
    "Atenção redobrada nas curvas da serra, pode haver neblina matinal.",
    "Bom dia! Estradas podem estar úmidas. Mantenha distância segura.",
    "Cuidado com pedestres nas áreas escolares neste horário.",
  ],
  afternoon: [
    "Sol forte pode ofuscar a visão. Use óculos de sol se necessário.",
    "Horário de movimento intenso. Paciência no trânsito!",
    "Atenção aos ciclistas e pedestres no centro.",
  ],
  evening: [
    "Trânsito intenso no final da tarde. Planeje rotas alternativas.",
    "Atenção redobrada com a mudança de luminosidade.",
    "Cuidado com pedestres atravessando fora da faixa.",
  ],
  night: [
    "Redobre a atenção nas vias pouco iluminadas.",
    "Mantenha os faróis limpos e bem regulados.",
    "Cuidado com animais na pista nas áreas rurais.",
  ],
};

// Dicas de economia por tipo de veículo
const economyTips: Record<string, string[]> = {
  default: [
    "Evite acelerações bruscas para economizar combustível.",
    "Mantenha velocidade constante quando possível.",
    "Desligue o ar-condicionado em subidas íngremes.",
    "Calibre os pneus semanalmente para maior economia.",
    "Evite carregar peso desnecessário no veículo.",
  ],
  van: [
    "Vans consomem mais em subidas. Use marchas baixas na serra.",
    "Distribua o peso uniformemente para melhor economia.",
    "Evite frenagens bruscas - peso maior exige mais distância.",
  ],
  carro: [
    "Em trajetos curtos, evite ligar o ar-condicionado logo de início.",
    "Use a inércia do veículo nas descidas de Gramado.",
    "Mantenha RPM entre 2000-2500 para melhor eficiência.",
  ],
};

// Dicas motivacionais gerais
const motivationalTips = [
  "Boa viagem! Representamos a FleetControl em cada trajeto. 🚗",
  "Segurança em primeiro lugar! Você faz a diferença. ⭐",
  "Excelente trabalho! Cada quilômetro conta. 💪",
  "Dirija com atenção e retorne com segurança! 🏠",
  "Profissionalismo é nossa marca. Boa viagem! 🎯",
];

// Dicas específicas por destino conhecido
const destinationTips: Record<string, string> = {
  centro: "Rota para o Centro: prefira a Av. Borges de Medeiros. Estacionamento pode estar cheio.",
  loja: "Indo para a Loja Centro em Pedras Altas. Atenção na curva da entrada!",
  aeroporto: "Trajeto longo para o aeroporto. Verifique combustível antes de sair.",
  canela: "Rota Gramado-Canela: cuidado com o trânsito turístico na Via Férrea.",
};

/**
 * Retorna o período do dia baseado na hora
 */
function getPeriod(date: Date): 'morning' | 'afternoon' | 'evening' | 'night' {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 20) return 'evening';
  return 'night';
}

/**
 * Seleciona um item aleatório de um array
 */
function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Detecta tipo de veículo pelo nome
 */
function getVehicleType(vehicle: string): 'van' | 'carro' | 'default' {
  const lower = vehicle.toLowerCase();
  if (lower.includes('van') || lower.includes('sprinter') || lower.includes('ducato')) {
    return 'van';
  }
  if (lower.includes('hb20') || lower.includes('onix') || lower.includes('polo') || lower.includes('gol')) {
    return 'carro';
  }
  return 'default';
}

/**
 * Detecta destino conhecido pelo itinerário
 */
function getKnownDestination(itinerary: string): string | null {
  const lower = itinerary.toLowerCase();
  for (const [key, tip] of Object.entries(destinationTips)) {
    if (lower.includes(key)) {
      return tip;
    }
  }
  return null;
}

/**
 * Gera análise de itinerário (substitui analyzeItinerary do Gemini)
 */
export const analyzeItinerary = async (data: {
  itinerary: string;
  vehicle: string;
  startOdometer: number;
  employeeName: string;
  startTime: string;
}): Promise<string> => {
  const { itinerary, vehicle, employeeName, startTime } = data;
  const date = new Date(startTime);
  const period = getPeriod(date);

  // Monta a dica personalizada
  const parts: string[] = [];

  // Saudação personalizada
  const greetings: Record<string, string> = {
    morning: `Bom dia, ${employeeName.split(' ')[0]}!`,
    afternoon: `Boa tarde, ${employeeName.split(' ')[0]}!`,
    evening: `Boa tarde, ${employeeName.split(' ')[0]}!`,
    night: `Boa noite, ${employeeName.split(' ')[0]}!`,
  };
  parts.push(greetings[period]);

  // Dica de destino conhecido ou motivacional
  const destTip = getKnownDestination(itinerary);
  if (destTip) {
    parts.push(destTip);
  }

  // Dica de economia baseada no veículo
  const vehicleType = getVehicleType(vehicle);
  const econTips = economyTips[vehicleType] || economyTips.default;
  parts.push(randomItem(econTips));

  // Dica de segurança baseada no período
  parts.push(randomItem(safetyTips[period]));

  // Finalização motivacional
  parts.push(randomItem(motivationalTips));

  // Simula delay de "processamento" para parecer mais natural
  await new Promise(resolve => setTimeout(resolve, 500));

  return parts.join(' ');
};

/**
 * Gera resumo semanal (substitui generateWeeklySummary do Gemini)
 */
export const generateWeeklySummary = async (trips: any[]): Promise<string> => {
  if (!trips || trips.length === 0) {
    return "Nenhuma viagem registrada para análise.";
  }

  // Calcula estatísticas reais
  const completedTrips = trips.filter(t => t.status === 'completed');
  const totalKm = completedTrips.reduce((acc, t) => {
    const km = t.endOdometer && t.startOdometer ? t.endOdometer - t.startOdometer : 0;
    return acc + km;
  }, 0);

  // Encontra o motorista que mais rodou
  const driverKm: Record<string, number> = {};
  completedTrips.forEach(t => {
    const km = t.endOdometer && t.startOdometer ? t.endOdometer - t.startOdometer : 0;
    const name = t.employeeName || 'Desconhecido';
    driverKm[name] = (driverKm[name] || 0) + km;
  });

  const topDriver = Object.entries(driverKm).sort((a, b) => b[1] - a[1])[0];

  // Veículo mais usado
  const vehicleCount: Record<string, number> = {};
  trips.forEach(t => {
    const v = t.vehicle || 'Não informado';
    vehicleCount[v] = (vehicleCount[v] || 0) + 1;
  });
  const topVehicle = Object.entries(vehicleCount).sort((a, b) => b[1] - a[1])[0];

  // Simula delay
  await new Promise(resolve => setTimeout(resolve, 300));

  // Verifica se há viagem ativa e qual veículo
  const activeTrip = trips.find(t => t.status === 'active');
  const currentVehicleMessage = activeTrip ? `🚗 Veículo em uso: ${activeTrip.vehicle}.` : null;

  // Monta resumo
  const parts: string[] = [];

  if (currentVehicleMessage) {
    parts.push(currentVehicleMessage);
  }

  parts.push(`📊 Histórico: ${trips.length} viagem(ns) registrada(s).`);

  if (completedTrips.length > 0) {
    parts.push(`Total percorrido: ${totalKm.toLocaleString('pt-BR')} km.`);
  }

  if (topDriver) {
    parts.push(`🏆 Destaque: ${topDriver[0].split(' ')[0]} (${topDriver[1]} km).`);
  }

  if (topVehicle && !currentVehicleMessage) {
    parts.push(`🚙 Mais utilizado: ${topVehicle[0]}.`);
  }

  parts.push("Excelente trabalho! 💪");

  return parts.join(' ');
};
