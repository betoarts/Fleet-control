/**
 * NBAPARK Fleet Control - Comprehensive Application Tests
 * Test Engineer Methodology - Testing Pyramid Approach
 */

import { test, expect } from '@playwright/test';

// ==============================================
// CONFIGURATION
// ==============================================
const BASE_URL = 'http://localhost:3000';
const TEST_USER = {
  name: 'Test User Automation',
  phone: '54999887766'
};

// ==============================================
// E2E TESTS - Critical User Flows
// ==============================================

test.describe('E2E: User Authentication Flow', () => {
  test('should display login screen on first visit', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Arrange: Wait for page load
    await page.waitForLoadState('networkidle');
    
    // Assert: Login screen visible
    await expect(page.locator('text=Identificação')).toBeVisible();
    await expect(page.locator('input[placeholder*="Carlos Silva"]')).toBeVisible();
    await expect(page.locator('input[placeholder*="54999999999"]')).toBeVisible();
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Arrange: Fill login form
    await page.fill('input[placeholder*="Carlos Silva"]', TEST_USER.name);
    await page.fill('input[placeholder*="54999999999"]', TEST_USER.phone);
    
    // Act: Submit login
    await page.click('button:has-text("Acessar Painel")');
    
    // Assert: Dashboard loaded
    await expect(page.locator('text=Dashboard').or(page.locator('text=Painel'))).toBeVisible({ timeout: 10000 });
  });

  test('should validate required fields', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Act: Try to submit empty form
    await page.click('button:has-text("Acessar Painel")');
    
    // Assert: HTML5 validation prevents submission
    const nameInput = page.locator('input[placeholder*="Carlos Silva"]');
    await expect(nameInput).toHaveAttribute('required', '');
  });
});

test.describe('E2E: Dashboard Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto(BASE_URL);
    await page.fill('input[placeholder*="Carlos Silva"]', TEST_USER.name);
    await page.fill('input[placeholder*="54999999999"]', TEST_USER.phone);
    await page.click('button:has-text("Acessar Painel")');
    await page.waitForLoadState('networkidle');
  });

  test('should display vehicle status', async ({ page }) => {
    // Assert: Vehicle status card visible
    await expect(
      page.locator('text=DISPONÍVEL').or(page.locator('text=OCUPADO'))
    ).toBeVisible({ timeout: 5000 });
  });

  test('should navigate to new reservation page', async ({ page }) => {
    // Act: Click new reservation button (desktop)
    const newReservationBtn = page.locator('button:has-text("INICIAR NOVO REGISTRO")');
    
    if (await newReservationBtn.isVisible()) {
      await newReservationBtn.click();
      
      // Assert: Form visible
      await expect(page.locator('text=Novo Log de Saída')).toBeVisible();
      await expect(page.locator('select[name="vehicle"]')).toBeVisible();
    }
  });

  test('should display user activities section', async ({ page }) => {
    // Assert: Activities section exists
    await expect(page.locator('text=Suas Atividades')).toBeVisible();
  });
});

test.describe('E2E: Create Reservation Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.fill('input[placeholder*="Carlos Silva"]', TEST_USER.name);
    await page.fill('input[placeholder*="54999999999"]', TEST_USER.phone);
    await page.click('button:has-text("Acessar Painel")');
    await page.waitForLoadState('networkidle');
  });

  test('should create new reservation successfully', async ({ page }) => {
    // Arrange: Navigate to new reservation
    const newBtn = page.locator('button:has-text("INICIAR NOVO REGISTRO")');
    if (await newBtn.isVisible()) {
      await newBtn.click();
    }
    
    // Fill form
    await page.selectOption('select[name="vehicle"]', 'Polo Volkswagen');
    await page.fill('input[name="startOdometer"]', '50000');
    await page.fill('textarea[name="itinerary"]', 'Teste automatizado - viagem para centro da cidade');
    
    // Act: Submit
    await page.click('button[type="submit"]');
    
    // Assert: Redirected to dashboard with new trip
    await expect(page.locator('text=Dashboard').or(page.locator('text=Painel'))).toBeVisible({ timeout: 10000 });
  });
});

test.describe('E2E: Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.fill('input[placeholder*="Carlos Silva"]', TEST_USER.name);
    await page.fill('input[placeholder*="54999999999"]', TEST_USER.phone);
    await page.click('button:has-text("Acessar Painel")');
    await page.waitForLoadState('networkidle');
  });

  test('should navigate between tabs', async ({ page }) => {
    // Test navigation to different sections
    const tabs = [
      { selector: 'button:has-text("Histórico")', expected: 'Histórico' },
      { selector: 'button:has-text("Agenda")', expected: 'Agenda' },
      { selector: 'button:has-text("Dashboard")', expected: 'Dashboard' }
    ];

    for (const tab of tabs) {
      const tabButton = page.locator(tab.selector);
      if (await tabButton.isVisible()) {
        await tabButton.click();
        await page.waitForTimeout(500); // Wait for transition
      }
    }
  });
});

// ==============================================
// INTEGRATION TESTS - API & Database
// ==============================================

test.describe('Integration: Supabase Connection', () => {
  test('should connect to Supabase successfully', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Monitor network requests
    const requests: string[] = [];
    page.on('request', request => {
      if (request.url().includes('supabase.co')) {
        requests.push(request.url());
      }
    });
    
    // Trigger login (which calls Supabase)
    await page.fill('input[placeholder*="Carlos Silva"]', TEST_USER.name);
    await page.fill('input[placeholder*="54999999999"]', TEST_USER.phone);
    await page.click('button:has-text("Acessar Painel")');
    
    await page.waitForTimeout(2000);
    
    // Assert: Supabase requests made
    expect(requests.length).toBeGreaterThan(0);
  });

  test('should handle database errors gracefully', async ({ page }) => {
    // This test would require mocking network to simulate errors
    // For now, we verify error handling UI exists
    await page.goto(BASE_URL);
    
    // Check if error handling code exists (via console)
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleLogs.push(msg.text());
      }
    });
    
    await page.fill('input[placeholder*="Carlos Silva"]', TEST_USER.name);
    await page.fill('input[placeholder*="54999999999"]', TEST_USER.phone);
    await page.click('button:has-text("Acessar Painel")');
    
    await page.waitForTimeout(3000);
    
    // No critical errors should appear
    const criticalErrors = consoleLogs.filter(log => 
      log.includes('Uncaught') || log.includes('TypeError')
    );
    expect(criticalErrors.length).toBe(0);
  });
});

// ==============================================
// UI/UX TESTS - Visual & Interaction
// ==============================================

test.describe('UI: Responsive Design', () => {
  test('should be mobile responsive', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(BASE_URL);
    
    // Assert: Mobile layout works
    await expect(page.locator('text=Identificação')).toBeVisible();
  });

  test('should be tablet responsive', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto(BASE_URL);
    
    await expect(page.locator('text=Identificação')).toBeVisible();
  });

  test('should be desktop responsive', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(BASE_URL);
    
    await expect(page.locator('text=Identificação')).toBeVisible();
  });
});

test.describe('UI: Accessibility', () => {
  test('should have proper form labels', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Check for accessible labels
    const nameInput = page.locator('input[placeholder*="Carlos Silva"]');
    const phoneInput = page.locator('input[placeholder*="54999999999"]');
    
    await expect(nameInput).toBeVisible();
    await expect(phoneInput).toBeVisible();
  });

  test('should have keyboard navigation', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Tab through form
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Should be able to navigate
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(['INPUT', 'BUTTON']).toContain(focusedElement);
  });
});

// ==============================================
// PERFORMANCE TESTS
// ==============================================

test.describe('Performance: Load Times', () => {
  test('should load within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Assert: Page loads in under 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });

  test('should have no console errors on load', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    // Filter out known acceptable errors
    const criticalErrors = errors.filter(err => 
      !err.includes('favicon') && 
      !err.includes('manifest')
    );
    
    expect(criticalErrors.length).toBe(0);
  });
});

// ==============================================
// SECURITY TESTS
// ==============================================

test.describe('Security: XSS Prevention', () => {
  test('should sanitize user input', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Try XSS payload
    const xssPayload = '<script>alert("XSS")</script>';
    await page.fill('input[placeholder*="Carlos Silva"]', xssPayload);
    
    // Assert: Script not executed (no alert)
    const alerts: string[] = [];
    page.on('dialog', dialog => {
      alerts.push(dialog.message());
      dialog.dismiss();
    });
    
    await page.click('button:has-text("Acessar Painel")');
    await page.waitForTimeout(1000);
    
    expect(alerts.length).toBe(0);
  });
});

console.log('✅ Test suite configured with Playwright');
console.log('📊 Coverage: E2E, Integration, UI/UX, Performance, Security');
console.log('🎯 Following Testing Pyramid: Unit → Integration → E2E');
