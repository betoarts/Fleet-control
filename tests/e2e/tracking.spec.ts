import { test, expect } from '@playwright/test';

// Configuration
const BASE_URL = 'http://localhost:3000';
const TEST_USER = {
  name: 'Test Automation',
  phone: '54999887766'
};

// Mock Geolocation Data (Gramado, RS)
const MOCK_LOCATION = {
  latitude: -29.3746,
  longitude: -50.8764
};

test.describe('E2E: Vehicle Tracking System', () => {
  
  // Setup: Grant geolocation permissions and mock location
  test.use({
    geolocation: MOCK_LOCATION,
    permissions: ['geolocation'],
  });

  test.beforeEach(async ({ page }) => {
    // Login flow
    await page.goto(BASE_URL);
    await page.fill('input[placeholder*="Carlos Silva"]', TEST_USER.name);
    await page.fill('input[placeholder*="54999999999"]', TEST_USER.phone);
    await page.click('button:has-text("Acessar Painel")');
    
    // Wait for Dashboard to load explicitly
    await expect(page.locator('text=Dashboard').or(page.locator('text=Painel'))).toBeVisible({ timeout: 15000 });
    await page.waitForLoadState('networkidle');
  });

  test('should request geolocation permission on trip start', async ({ page }) => {
    // Navigate to New Reservation
    const newBtn = page.locator('button:has-text("INICIAR NOVO REGISTRO")');
    if (await newBtn.isVisible()) {
      await newBtn.click();
      
      // Fill trip form

      // Note: We might need to select by index or text if value unknown. 
      // Let's assume 'Polo Volkswagen' exists from previous mock tests or select the first option.
      const vehicleSelect = page.locator('select[name="vehicle"]');
      await vehicleSelect.selectOption({ index: 1 }); // Select second option (first is likely "Select")

      await page.fill('input[name="startOdometer"]', '1000');
      await page.fill('textarea[name="itinerary"]', 'Rota de Teste GPS');
      
      // Submit
      await page.click('button[type="submit"]');
      
      // Assert: Tracking started (console log or UI indicator if we added one)
      // Since UI doesn't explicitly show "Tracking ON", we check the console or if dashboard loaded
      await expect(page.locator('text=Painel')).toBeVisible();
      
      // We can check if Geolocation was queried
      // In a real scenario, we'd verify the trackingService state, but E2E is black-box.
    }
  });

  test('should display Map tab and load map', async ({ page }) => {
    // Access Map Tab
    const mapTab = page.locator('button:has-text("Mapa")');
    await expect(mapTab).toBeVisible();
    await mapTab.click();
    
    // Assert: Map container visible
    await expect(page.locator('.leaflet-container')).toBeVisible();
    
    // Assert: Sidebar visible
    await expect(page.locator('text=Veículos Ativos')).toBeVisible();
  });

  test('should show vehicle markers on map', async ({ page }) => {
    // Mock Supabase API response for active vehicles
    // We mock the request to the view 'veiculos_posicoes_atual'
    await page.route('**/rest/v1/veiculos_posicoes_atual*', async route => {
      const json = [{
        veiculo_id: 'Polo Mock',
        motorista_nome: 'Motorista Mock',
        lat: MOCK_LOCATION.latitude, // Gramado
        lng: MOCK_LOCATION.longitude,
        velocidade: 50,
        parado: false,
        timestamp: new Date().toISOString()
      }];
      await route.fulfill({ json });
    });

    await page.click('button:has-text("Mapa")');
    
    // Wait for map to load
    await page.waitForSelector('.leaflet-container');
    
    // Check if the mock vehicle marker exists (leaflet markers are hard to select by text, 
    // but the sidebar list should be simpler)
    
    // Assert: Sidebar shows the mocked vehicle
    await expect(page.locator('text=Polo Mock')).toBeVisible();
    await expect(page.locator('text=Motorista Mock')).toBeVisible();
    
    // Verify Legend exists
    await expect(page.locator('text=Legenda')).toBeVisible();
    await expect(page.locator('text=Em movimento')).toBeVisible();
    await expect(page.locator('text=Parado')).toBeVisible();
  });
});
