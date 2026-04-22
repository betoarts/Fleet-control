/**
 * Simulation Script for Real-Time Vehicle Tracking
 * 
 * Usage: 
 *   1. Open a terminal
 *   2. Run: node scripts/simulate-tracking.js <SUPABASE_ANON_KEY>
 * 
 * This script sends a sequence of GPS positions to the Edge Function to simulate
 * a vehicle moving and then stopping, allowing verification of the dashboard map and alerts.
 */

const SUPABASE_URL = 'https://hgduyjovclhqzutvefqd.supabase.co';
const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/receive-position`;

// Get Anon Key from headers or args
const ANON_KEY = process.argv[2];

if (!ANON_KEY) {
  console.error('Error: Please provide your Supabase Anon Key as an argument.');
  console.error('Usage: node scripts/simulate-tracking.js <YOUR_SUPABASE_ANON_KEY>');
  process.exit(1);
}

// Simulation Config
const RESERVATION_ID = `sim-${Date.now()}`;
let VEHICLE_ID = 'Polo Volkswagen';
let DRIVER_NAME = 'Simulado Admin';

// Route: Start at Gramado, RS
const START_LAT = -29.3746;
const START_LNG = -50.8764;

const steps = [
  // Moving phase (Speed > 5 km/h)
  { lat: -29.3746, lng: -50.8764, speed: 30, desc: 'Moving - Start' },
  { lat: -29.3751, lng: -50.8764, speed: 35, desc: 'Moving' },
  { lat: -29.3756, lng: -50.8764, speed: 40, desc: 'Moving' },
  { lat: -29.3761, lng: -50.8764, speed: 20, desc: 'Moving - Slowing down' },
  
  // Stopping phase (Speed 0 km/h)
  // We need > 45 seconds of stop to trigger alert.
  // We'll send update every 15s. So 4 updates (0, 15, 30, 45) should trigger.
  { lat: -29.3766, lng: -50.8764, speed: 0, desc: 'Stopped (0s)' },
  { lat: -29.3766, lng: -50.8764, speed: 0, desc: 'Stopped (15s)' },
  { lat: -29.3766, lng: -50.8764, speed: 0, desc: 'Stopped (30s)' },
  { lat: -29.3766, lng: -50.8764, speed: 0, desc: 'Stopped (45s) - ALERT EXPECTED' },
  { lat: -29.3766, lng: -50.8764, speed: 0, desc: 'Stopped (60s)' },
  
  // Moving again
  { lat: -29.3771, lng: -50.8764, speed: 25, desc: 'Moving Again' },
];

async function sendPosition(step, index) {
  const payload = {
    reservation_id: RESERVATION_ID,
    veiculo_id: VEHICLE_ID,
    motorista_nome: DRIVER_NAME,
    lat: step.lat,
    lng: step.lng,
    velocidade: step.speed, // km/h (Edge function expects km/h directly? No, checking trackingService... it sends km/h)
    // Actually trackingService converts m/s to km/h before sending?
    // trackingService.ts line 72: velocidade: ... * 3.6
    // Edge function receives 'velocidade'.
    // So here we send km/h directly.
    precisao: 10,
    heading: 180,
    timestamp: new Date().toISOString()
  };

  try {
    const response = await fetch(FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ANON_KEY}`
      },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      const result = await response.json();
      console.log(`[${index + 1}/${steps.length}] Sent: ${step.desc} | Speed: ${step.speed} km/h | Success:`, result.success);
      if (result.notificacao_criada) {
        console.log('>>> NOTIFICATION TRIGGERED! <<<');
      }
    } else {
      console.error(`[${index + 1}/${steps.length}] Failed:`, response.status, await response.text());
    }
  } catch (error) {
    console.error(`[${index + 1}/${steps.length}] Error:`, error.message);
  }
}

async function runSimulation() {
  console.log('Starting Vehicle Tracking Simulation...');
  console.log(`Vehicle: ${VEHICLE_ID}`);
  console.log(`Driver: ${DRIVER_NAME}`);
  console.log(`Reservation: ${RESERVATION_ID}`);
  console.log('-----------------------------------');

  for (let i = 0; i < steps.length; i++) {
    await sendPosition(steps[i], i);
    
    if (i < steps.length - 1) {
      console.log('Waiting 15 seconds...');
      await new Promise(resolve => setTimeout(resolve, 15000));
    }
  }

  console.log('-----------------------------------');
  console.log('Simulation Complete.');
}

runSimulation();
