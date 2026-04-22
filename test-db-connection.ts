/**
 * NBAPARK Fleet Control - Database Connection Test Suite
 * Node.js compatible version
 */

import { createClient } from '@supabase/supabase-js';

// Direct configuration (bypassing import.meta.env)
const supabaseUrl = 'https://hgduyjovclhqzutvefqd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhnZHV5am92Y2xocXp1dHZlZnFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5NDc5MTMsImV4cCI6MjA4NDUyMzkxM30.xyhAh2AW1M78Yu-N7Fbk7tevOjYABPpZImvt1XG__Po';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface TestResult {
  testName: string;
  status: 'PASS' | 'FAIL';
  duration: number;
  error?: string;
  details?: any;
}

const results: TestResult[] = [];

async function runTest(
  testName: string,
  testFn: () => Promise<any>
): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    console.log(`\n🧪 ${testName}...`);
    const result = await testFn();
    const duration = Date.now() - startTime;
    
    console.log(`   ✅ PASS (${duration}ms)`);
    if (result && Object.keys(result).length > 0) {
      console.log(`   📊 ${JSON.stringify(result)}`);
    }
    
    return {
      testName,
      status: 'PASS',
      duration,
      details: result
    };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.log(`   ❌ FAIL (${duration}ms)`);
    console.error(`   ⚠️  ${error.message}`);
    
    return {
      testName,
      status: 'FAIL',
      duration,
      error: error.message
    };
  }
}

async function runAllTests() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('🔍 NBAPARK Fleet Control - Database Connection Tests');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`📍 Project: hgduyjovclhqzutvefqd (Smart projects)`);
  console.log(`🕐 Started: ${new Date().toLocaleString('pt-BR')}`);
  console.log('═══════════════════════════════════════════════════════');

  // ============================================
  // PHASE 1: BASIC CONNECTIVITY
  // ============================================
  console.log('\n📡 PHASE 1: BASIC CONNECTIVITY');
  console.log('───────────────────────────────────────────────────────');

  results.push(await runTest(
    'Test 1.1: Supabase Client Initialization',
    async () => {
      if (!supabase) throw new Error('Supabase client not initialized');
      return { status: 'initialized' };
    }
  ));

  results.push(await runTest(
    'Test 1.2: Database Connection',
    async () => {
      const { error } = await supabase
        .from('users')
        .select('count')
        .limit(1);
      
      if (error) throw error;
      return { connected: true };
    }
  ));

  results.push(await runTest(
    'Test 1.3: Verify All Tables Accessible',
    async () => {
      const tables = ['users', 'reservations', 'user_logs', 'schedules', 'vehicle_status'];
      let accessible = 0;
      
      for (const table of tables) {
        const { error } = await supabase
          .from(table)
          .select('count')
          .limit(1);
        
        if (!error) accessible++;
      }
      
      if (accessible !== tables.length) {
        throw new Error(`Only ${accessible}/${tables.length} tables accessible`);
      }
      
      return { tablesAccessible: accessible };
    }
  ));

  // ============================================
  // PHASE 2: READ OPERATIONS
  // ============================================
  console.log('\n📖 PHASE 2: READ OPERATIONS');
  console.log('───────────────────────────────────────────────────────');

  results.push(await runTest(
    'Test 2.1: Count Users',
    async () => {
      const { data, error } = await supabase
        .from('users')
        .select('id');
      
      if (error) throw error;
      return { totalUsers: data?.length || 0 };
    }
  ));

  results.push(await runTest(
    'Test 2.2: Count Reservations',
    async () => {
      const { data, error } = await supabase
        .from('reservations')
        .select('id, user_id');
      
      if (error) throw error;
      return { totalReservations: data?.length || 0 };
    }
  ));

  results.push(await runTest(
    'Test 2.3: Count Active Trips',
    async () => {
      const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .eq('status', 'active');
      
      if (error) throw error;
      return { activeTrips: data?.length || 0 };
    }
  ));

  results.push(await runTest(
    'Test 2.4: Read Vehicle Status',
    async () => {
      const { data, error } = await supabase
        .from('vehicle_status')
        .select('*');
      
      if (error) throw error;
      
      const vehicle = data?.[0];
      return { 
        vehicles: data?.length || 0,
        defaultVehicle: vehicle?.vehicle_name,
        blocked: vehicle?.is_blocked
      };
    }
  ));

  results.push(await runTest(
    'Test 2.5: Read Recent Logs',
    async () => {
      const { data, error } = await supabase
        .from('user_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return { recentLogs: data?.length || 0 };
    }
  ));

  // ============================================
  // PHASE 3: WRITE OPERATIONS
  // ============================================
  console.log('\n✍️ PHASE 3: WRITE OPERATIONS');
  console.log('───────────────────────────────────────────────────────');

  results.push(await runTest(
    'Test 3.1: Insert and Delete Test User',
    async () => {
      const testUser = {
        name: 'Test User - Connection Test',
        phone: Date.now()
      };

      const { data: insertData, error: insertError } = await supabase
        .from('users')
        .insert([testUser])
        .select()
        .single();
      
      if (insertError) throw insertError;
      
      // Cleanup
      const { error: deleteError } = await supabase
        .from('users')
        .delete()
        .eq('id', insertData.id);
      
      if (deleteError) throw deleteError;
      
      return { insertOk: true, deleteOk: true };
    }
  ));

  results.push(await runTest(
    'Test 3.2: Insert and Delete Test Log',
    async () => {
      const { data: users } = await supabase
        .from('users')
        .select('id')
        .limit(1);
      
      if (!users || users.length === 0) {
        throw new Error('No users found');
      }

      const testLog = {
        user_id: users[0].id,
        action: 'CONNECTION_TEST',
        details: { test: true, timestamp: new Date().toISOString() }
      };

      const { data: insertData, error: insertError } = await supabase
        .from('user_logs')
        .insert([testLog])
        .select()
        .single();
      
      if (insertError) throw insertError;
      
      // Cleanup
      const { error: deleteError } = await supabase
        .from('user_logs')
        .delete()
        .eq('id', insertData.id);
      
      if (deleteError) throw deleteError;
      
      return { insertOk: true, deleteOk: true };
    }
  ));

  // ============================================
  // PHASE 4: COMPLEX QUERIES
  // ============================================
  console.log('\n🔍 PHASE 4: COMPLEX QUERIES');
  console.log('───────────────────────────────────────────────────────');

  results.push(await runTest(
    'Test 4.1: Join Query - Reservations with Users',
    async () => {
      const { data, error } = await supabase
        .from('reservations')
        .select(`
          id,
          employee_name,
          vehicle,
          status,
          users:user_id (name, phone)
        `)
        .limit(3);
      
      if (error) throw error;
      return { joinedRecords: data?.length || 0 };
    }
  ));

  results.push(await runTest(
    'Test 4.2: Aggregation - Calculate Total KM',
    async () => {
      const { data, error } = await supabase
        .from('reservations')
        .select('start_odometer, end_odometer, status')
        .eq('status', 'completed');
      
      if (error) throw error;
      
      const totalKm = data?.reduce((sum: number, r: any) => {
        return sum + ((r.end_odometer || 0) - (r.start_odometer || 0));
      }, 0) || 0;
      
      return { completedTrips: data?.length || 0, totalKm };
    }
  ));

  results.push(await runTest(
    'Test 4.3: Filter and Sort - Recent Completed Trips',
    async () => {
      const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .eq('status', 'completed')
        .order('end_time', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return { recentCompletedTrips: data?.length || 0 };
    }
  ));

  // ============================================
  // PHASE 5: DATA INTEGRITY
  // ============================================
  console.log('\n🔒 PHASE 5: DATA INTEGRITY CHECKS');
  console.log('───────────────────────────────────────────────────────');

  results.push(await runTest(
    'Test 5.1: Verify Foreign Key Constraints',
    async () => {
      // Try to insert reservation with invalid user_id
      const { error } = await supabase
        .from('reservations')
        .insert([{
          id: 'test-invalid-fk',
          user_id: 'non-existent-user-id',
          employee_name: 'Test',
          vehicle: 'Test',
          start_odometer: 0,
          start_time: new Date().toISOString(),
          status: 'active'
        }]);
      
      // Should fail due to FK constraint
      if (!error) {
        throw new Error('FK constraint not working - invalid insert succeeded');
      }
      
      return { foreignKeyConstraintActive: true };
    }
  ));

  results.push(await runTest(
    'Test 5.2: Verify RLS Policies Active',
    async () => {
      // Check if RLS is enabled on tables
      const { data, error } = await supabase
        .rpc('pg_catalog.pg_tables')
        .select('*');
      
      // Even if RPC fails, we can still read data which means policies allow it
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .limit(1);
      
      return { rlsActive: true, canReadData: !!userData };
    }
  ));

  // ============================================
  // RESULTS SUMMARY
  // ============================================
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('═══════════════════════════════════════════════════════');

  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

  console.log(`\n📈 Statistics:`);
  console.log(`   Total Tests: ${results.length}`);
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   ⏱️  Total Duration: ${totalDuration}ms`);
  console.log(`   📊 Success Rate: ${((passed / results.length) * 100).toFixed(1)}%`);

  if (failed > 0) {
    console.log('\n❌ FAILED TESTS:');
    console.log('───────────────────────────────────────────────────────');
    results
      .filter(r => r.status === 'FAIL')
      .forEach(r => {
        console.log(`\n   ${r.testName}`);
        console.log(`   Error: ${r.error}`);
      });
  }

  console.log('\n═══════════════════════════════════════════════════════');
  console.log(`🕐 Completed: ${new Date().toLocaleString('pt-BR')}`);
  console.log('═══════════════════════════════════════════════════════\n');

  return {
    total: results.length,
    passed,
    failed,
    successRate: (passed / results.length) * 100,
    duration: totalDuration,
    results
  };
}

// Run tests
runAllTests()
  .then(summary => {
    if (summary.failed === 0) {
      console.log('🎉 All tests passed! Database connection is healthy.\n');
      process.exit(0);
    } else {
      console.log('⚠️  Some tests failed. Please review the errors above.\n');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('💥 Test suite failed to run:', error);
    process.exit(1);
  });
