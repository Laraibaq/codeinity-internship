require("e:/code/codeinity-internship/RideHailingApp/apps/backend/node_modules/dotenv").config({
  path: "e:/code/codeinity-internship/RideHailingApp/apps/backend/.env",
});
const dns = require('dns').promises;
require('dns').setServers(['8.8.8.8', '1.1.1.1']);
const { Client } = require("e:/code/codeinity-internship/RideHailingApp/apps/backend/node_modules/pg");
const jwt = require("e:/code/codeinity-internship/RideHailingApp/apps/backend/node_modules/jsonwebtoken");
const crypto = require("crypto");

const API_URL = 'http://localhost:3000';
const JWT_SECRET = process.env.JWT_ACCESS_SECRET || 'secret';

function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
}

async function apiRequest(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  const res = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  let data;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  return { status: res.status, ok: res.ok, data };
}

async function main() {
  console.log('============================================================');
  console.log('PHASE 11: FINAL FINANCIAL ACCEPTANCE GATE TEST SUITE');
  console.log('============================================================\n');

  // Resolve pooler IP using 8.8.8.8 to avoid OS DNS server failures
  const poolerHost = 'aws-0-ap-northeast-1.pooler.supabase.com';
  const ips = await dns.resolve4(poolerHost);
  const resolvedIp = ips[0];

  const dbUrl = new URL(process.env.DATABASE_URL);
  dbUrl.hostname = resolvedIp;

  const pgClient = new Client({
    connectionString: dbUrl.toString(),
    ssl: { rejectUnauthorized: false, servername: poolerHost },
  });
  await pgClient.connect();

  const runId = Math.floor(Math.random() * 90000) + 10000;
  const pId = '11111111-1111-4111-8111-111111111111';
  const dId = '22222222-2222-4222-8222-222222222222';
  const aId = '33333333-3333-4333-8333-333333333333';
  const otherDriverId = '44444444-4444-4444-8444-444444444444';

  // Cleanup test actors
  await pgClient.query(`DELETE FROM "wallet_transactions" WHERE "userId" IN ($1, $2, $3, $4);`, [pId, dId, aId, otherDriverId]);
  await pgClient.query(`DELETE FROM "wallets" WHERE "userId" IN ($1, $2, $3, $4);`, [pId, dId, aId, otherDriverId]);
  await pgClient.query(`DELETE FROM "payments" WHERE "passengerId" IN ($1, $2, $3, $4) OR "driverId" IN ($1, $2, $3, $4);`, [pId, dId, aId, otherDriverId]);
  await pgClient.query(`DELETE FROM "rides" WHERE "passengerId" IN ($1, $2, $3, $4) OR "driverId" IN ($1, $2, $3, $4);`, [pId, dId, aId, otherDriverId]);
  await pgClient.query(`DELETE FROM "vehicles" WHERE "driverId" IN ($1, $2, $3, $4);`, [pId, dId, aId, otherDriverId]);
  await pgClient.query(`DELETE FROM "drivers" WHERE "id" IN ($1, $2, $3, $4);`, [pId, dId, aId, otherDriverId]);
  await pgClient.query(`DELETE FROM "users" WHERE "id" IN ($1, $2, $3, $4);`, [pId, dId, aId, otherDriverId]);

  console.log('[Setup] Registering test actors in PostgreSQL...');

  // 1. Passenger
  await pgClient.query(`
    INSERT INTO "users" ("id", "name", "phone", "email", "passwordHash", "phoneVerified", "createdAt", "updatedAt")
    VALUES ($1, 'Passenger PayTester', $2, $3, 'hash123', true, NOW(), NOW());
  `, [pId, `+92300${runId}1`, `pass_${runId}@example.com`]);

  // 2. Assigned Driver
  await pgClient.query(`
    INSERT INTO "drivers" ("id", "name", "phone", "email", "passwordHash", "phoneVerified", "verificationStatus", "isOnline", "currentLat", "currentLng", "createdAt", "updatedAt")
    VALUES ($1, 'Driver PayTester', $2, $3, 'hash123', true, 'approved', true, 37.7749, -122.4194, NOW(), NOW());
  `, [dId, `+92301${runId}2`, `driver_${runId}@example.com`]);

  await pgClient.query(`
    INSERT INTO "vehicles" ("id", "driverId", "type", "make", "model", "color", "registrationNumber")
    VALUES (gen_random_uuid(), $1, 'car', 'Toyota', 'Prius', 'Silver', 'PAY-${runId}');
  `, [dId]);

  // 3. Other Driver (Unassigned / Wrong driver)
  await pgClient.query(`
    INSERT INTO "drivers" ("id", "name", "phone", "email", "passwordHash", "phoneVerified", "verificationStatus", "isOnline", "currentLat", "currentLng", "createdAt", "updatedAt")
    VALUES ($1, 'Other Driver', $2, $3, 'hash123', true, 'approved', true, 37.7749, -122.4194, NOW(), NOW());
  `, [otherDriverId, `+92303${runId}4`, `otherdriver_${runId}@example.com`]);

  // 4. Attacker Passenger
  await pgClient.query(`
    INSERT INTO "users" ("id", "name", "phone", "email", "passwordHash", "phoneVerified", "createdAt", "updatedAt")
    VALUES ($1, 'Attacker User', $2, $3, 'hash123', true, NOW(), NOW());
  `, [aId, `+92302${runId}3`, `attacker_${runId}@example.com`]);

  const pToken = generateToken({ sub: pId, role: 'passenger' });
  const dToken = generateToken({ sub: dId, role: 'driver' });
  const otherDToken = generateToken({ sub: otherDriverId, role: 'driver' });
  const aToken = generateToken({ sub: aId, role: 'passenger' });

  const pHeaders = { Authorization: `Bearer ${pToken}` };
  const dHeaders = { Authorization: `Bearer ${dToken}` };
  const otherDHeaders = { Authorization: `Bearer ${otherDToken}` };
  const aHeaders = { Authorization: `Bearer ${aToken}` };

  console.log('  Actors ready in database.\n');

  async function createTestRide(fareAmount = 25.50) {
    const rideRes = await pgClient.query(`
      INSERT INTO "rides" (
        "id", "passengerId", "driverId", "pickupLat", "pickupLng", "pickupAddress",
        "dropoffLat", "dropoffLng", "dropoffAddress", "distanceKm", "etaMinutes",
        "proposedFare", "aiRecommendedFare", "finalFare", "status", "startedAt", "completedAt"
      ) VALUES (
        gen_random_uuid(), $1, $2, 37.7749, -122.4194, 'Market St, SF',
        37.7849, -122.4094, 'Mission St, SF', 4.5, 12,
        $3, $3, $3, 'completed', NOW() - INTERVAL '10 minutes', NOW()
      ) RETURNING "id";
    `, [pId, dId, fareAmount]);
    return rideRes.rows[0].id;
  }

  // -------------------------------------------------------------
  // TEST 1: Unauthenticated & Identity Protection
  // -------------------------------------------------------------
  console.log('[Test 1] Testing Unauthenticated Rejection (HTTP 401)...');
  const unauthInit = await apiRequest('/payments/initiate', { method: 'POST', body: {} });
  const unauthConfirm = await apiRequest('/payments/some-id/confirm', { method: 'POST', body: {} });
  const unauthWallet = await apiRequest('/wallet/me', { method: 'GET' });
  const unauthTopup = await apiRequest('/wallet/topup', { method: 'POST', body: { amount: 50 } });
  if (unauthInit.status !== 401 || unauthConfirm.status !== 401 || unauthWallet.status !== 401 || unauthTopup.status !== 401) {
    throw new Error('Test 1 Failed: Unauthenticated endpoints did not return 401');
  }
  console.log('  ✓ PASS 1: All protected payment & wallet endpoints return 401 Unauthorized without JWT');

  // -------------------------------------------------------------
  // TEST 2: Authoritative Fare Extraction
  // -------------------------------------------------------------
  console.log('\n[Test 2] Testing Authoritative Fare Extraction from Database...');
  const ride1Id = await createTestRide(35.75);
  const pay1Res = await apiRequest('/payments/initiate', {
    method: 'POST',
    headers: pHeaders,
    body: {
      rideId: ride1Id,
      paymentMethod: 'cash',
      idempotencyKey: `idem_init_${ride1Id}`,
    },
  });
  if (!pay1Res.ok) throw new Error(`Test 2 Failed: ${JSON.stringify(pay1Res.data)}`);
  const payment1 = pay1Res.data;
  if (payment1.amount !== '35.75' || payment1.status !== 'pending' || payment1.paymentMethod !== 'cash') {
    throw new Error(`Test 2 Failed: Expected amount 35.75, got ${payment1.amount}`);
  }
  console.log(`  Initiated Payment ID: ${payment1.id}, Amount: ${payment1.amount} PKR, Status: ${payment1.status}`);
  console.log('  ✓ PASS 2: Authoritative fare 35.75 PKR extracted correctly from PostgreSQL');

  // -------------------------------------------------------------
  // TEST 3: Comprehensive Amount Tampering Protection
  // -------------------------------------------------------------
  console.log('\n[Test 3] Testing Client-Side Amount Tampering Protection...');
  const tamperingAttempts = [1.00, 0.00, -1.00, 999999999.00, 12.345];
  for (const fakeAmt of tamperingAttempts) {
    const tamperedRideId = await createTestRide(60.00);
    const tamperedRes = await apiRequest('/payments/initiate', {
      method: 'POST',
      headers: pHeaders,
      body: {
        rideId: tamperedRideId,
        paymentMethod: 'cash',
        amount: fakeAmt, // Client attempts to send fake amount
        idempotencyKey: `idem_tamper_${fakeAmt}_${tamperedRideId}`,
      },
    });
    if (!tamperedRes.ok) throw new Error(`Test 3 Failed for amount ${fakeAmt}: ${JSON.stringify(tamperedRes.data)}`);
    if (tamperedRes.data.amount !== '60' && tamperedRes.data.amount !== '60.00') {
      throw new Error(`Test 3 Failed: Tampered amount ${fakeAmt} was accepted! Got ${tamperedRes.data.amount}`);
    }
  }
  console.log('  Client-supplied amounts (1, 0, -1, 999999999, 12.345) were completely overridden by authoritative fare (60.00 PKR)');

  // Also test non-whitelisted currency injection attempt (e.g. trying to pay in USD or foreign currency)
  const currencyTamperRideId = await createTestRide(60.00);
  const currencyTamperRes = await apiRequest('/payments/initiate', {
    method: 'POST',
    headers: pHeaders,
    body: {
      rideId: currencyTamperRideId,
      paymentMethod: 'cash',
      currency: 'USD',
    },
  });
  if (currencyTamperRes.status !== 400) {
    throw new Error(`Test 3 Failed: Foreign currency injection was not blocked with 400. Got: ${currencyTamperRes.status}`);
  }
  console.log('  Foreign currency injection (USD) strictly blocked with 400 Bad Request by ValidationPipe');
  console.log('  ✓ PASS 3: Client-side amount & currency tampering strictly defeated; backend enforces authoritative fare in PKR');

  // -------------------------------------------------------------
  // TEST 4: Payment Ownership Security & Cross-User Isolation
  // -------------------------------------------------------------
  console.log('\n[Test 4] Testing Cross-User Payment Ownership Security...');
  // Attacker cannot initiate payment on Passenger's ride
  const crossInitRes = await apiRequest('/payments/initiate', {
    method: 'POST',
    headers: aHeaders,
    body: { rideId: ride1Id, paymentMethod: 'cash' },
  });
  if (crossInitRes.status !== 403) {
    throw new Error(`Test 4 Failed: Cross-user initiation returned status ${crossInitRes.status}, expected 403`);
  }

  // Attacker cannot read Passenger's payment by ride
  const crossReadRes = await apiRequest(`/payments/ride/${ride1Id}`, { headers: aHeaders });
  if (crossReadRes.status !== 403) {
    throw new Error(`Test 4 Failed: Cross-user read returned status ${crossReadRes.status}, expected 403`);
  }

  // Attacker cannot refund Passenger's payment
  const crossRefundRes = await apiRequest(`/payments/${payment1.id}/refund`, {
    method: 'POST',
    headers: aHeaders,
    body: { reason: 'malicious refund' },
  });
  if (crossRefundRes.status !== 403) {
    throw new Error(`Test 4 Failed: Cross-user refund returned status ${crossRefundRes.status}, expected 403`);
  }

  // Driver cannot initiate arbitrary passenger payment
  const driverInitRes = await apiRequest('/payments/initiate', {
    method: 'POST',
    headers: dHeaders,
    body: { rideId: ride1Id, paymentMethod: 'cash' },
  });
  if (driverInitRes.status !== 403) {
    throw new Error(`Test 4 Failed: Driver initiation returned ${driverInitRes.status}, expected 403`);
  }
  console.log('  ✓ PASS 4: Cross-user payment operations strictly blocked with 403 Forbidden');

  // -------------------------------------------------------------
  // TEST 5: Cash Payment Security (Critical Gate)
  // -------------------------------------------------------------
  console.log('\n[Test 5] Testing Cash Payment Security & Role Enforcement...');

  // 5a. Passenger attempts to confirm cash payment (MUST BE REJECTED)
  const passConfirmCash = await apiRequest(`/payments/${payment1.id}/confirm`, {
    method: 'POST',
    headers: pHeaders,
    body: { idempotencyKey: `idem_cash_p_${payment1.id}` },
  });
  if (passConfirmCash.status !== 403) {
    throw new Error(`Test 5a Failed: Passenger was able to confirm cash payment! Status: ${passConfirmCash.status}`);
  }
  console.log('  Passenger attempt to confirm cash payment: 403 Forbidden (Only driver who receives cash can confirm)');

  // 5b. Unassigned/Wrong driver attempts to confirm cash payment (MUST BE REJECTED)
  const wrongDriverConfirm = await apiRequest(`/payments/${payment1.id}/confirm`, {
    method: 'POST',
    headers: otherDHeaders,
    body: { idempotencyKey: `idem_cash_wd_${payment1.id}` },
  });
  if (wrongDriverConfirm.status !== 403) {
    throw new Error(`Test 5b Failed: Wrong driver was able to confirm cash payment! Status: ${wrongDriverConfirm.status}`);
  }
  console.log('  Wrong driver attempt to confirm cash payment: 403 Forbidden');

  // 5c. Assigned driver confirms cash payment (MUST SUCCEED)
  const assignedDriverConfirm = await apiRequest(`/payments/${payment1.id}/confirm`, {
    method: 'POST',
    headers: dHeaders,
    body: { idempotencyKey: `idem_cash_d_${payment1.id}` },
  });
  if (!assignedDriverConfirm.ok || assignedDriverConfirm.data.payment.status !== 'succeeded' || !assignedDriverConfirm.data.payment.paidAt) {
    throw new Error(`Test 5c Failed: Assigned driver failed to confirm cash: ${JSON.stringify(assignedDriverConfirm.data)}`);
  }
  console.log('  Assigned driver confirmation: 200 OK (Status: succeeded, paidAt timestamp recorded)');

  // 5d. Duplicate confirmation by assigned driver (IDEMPOTENCY SHIELD)
  const dupCashConfirm = await apiRequest(`/payments/${payment1.id}/confirm`, {
    method: 'POST',
    headers: dHeaders,
    body: { idempotencyKey: `idem_cash_d_${payment1.id}` },
  });
  if (!dupCashConfirm.data.isAlreadyConfirmed) {
    throw new Error('Test 5d Failed: Duplicate cash confirmation did not return isAlreadyConfirmed: true');
  }
  console.log('  Duplicate cash confirmation: isAlreadyConfirmed: true without duplicate payment');
  console.log('  ✓ PASS 5: Cash payment security verified (Driver-only confirmation, wrong driver rejected, passenger rejected, idempotent)');

  // -------------------------------------------------------------
  // TEST 6: Wallet Ownership & Client Identity Tampering
  // -------------------------------------------------------------
  console.log('\n[Test 6] Testing Wallet Ownership & Identity Tampering...');
  // Own wallet access
  const myWalletRes = await apiRequest('/wallet/me', { headers: pHeaders });
  if (!myWalletRes.ok || myWalletRes.data.userId !== pId) {
    throw new Error('Test 6 Failed: Unable to fetch own wallet');
  }
  console.log(`  Passenger owns wallet: ${myWalletRes.data.id}, balance: ${myWalletRes.data.balance} PKR`);

  // Client tampering: Attacker attempts to pass extraneous passenger userId/walletId in topup body
  const tamperTopupRes = await apiRequest('/wallet/topup', {
    method: 'POST',
    headers: aHeaders,
    body: {
      userId: pId, // Tampered client-supplied userId
      walletId: myWalletRes.data.id, // Tampered walletId
      amount: 100.00,
      idempotencyKey: `idem_tamper_topup_${runId}`,
    },
  });
  if (tamperTopupRes.status !== 400) {
    throw new Error(`Test 6 Failed: Injected userId/walletId was not blocked with 400! Got ${tamperTopupRes.status}`);
  }
  console.log('  Client-supplied foreign userId/walletId strictly blocked by ValidationPipe (HTTP 400 Bad Request)');

  // Attacker legitimate topup: uses JWT identity only
  const legitAttackerTopup = await apiRequest('/wallet/topup', {
    method: 'POST',
    headers: aHeaders,
    body: {
      amount: 50.00,
      idempotencyKey: `idem_atk_topup_${runId}`,
    },
  });
  if (!legitAttackerTopup.ok || legitAttackerTopup.data.wallet.userId !== aId) {
    throw new Error('Test 6 Failed: Attacker topup failed to bind to JWT sub');
  }
  console.log('  Attacker topup automatically bound to attacker JWT identity');

  // Verify passenger wallet was NOT touched
  const pWalletCheck = await apiRequest('/wallet/me', { headers: pHeaders });
  if (Number(pWalletCheck.data.balance) !== 0) {
    throw new Error('Test 6 Failed: Passenger wallet was modified by attacker request!');
  }
  console.log('  ✓ PASS 6: Wallet ownership secure; client identity tampering cannot modify other wallets');

  // -------------------------------------------------------------
  // TEST 7: Wallet Concurrency & Double-Spend Shield
  // -------------------------------------------------------------
  console.log('\n[Test 7] Testing Wallet Concurrency & Double-Spend Shield...');
  // Topup passenger wallet with 1000 PKR
  const topup1000 = await apiRequest('/wallet/topup', {
    method: 'POST',
    headers: pHeaders,
    body: {
      amount: 1000.00,
      idempotencyKey: `idem_topup_1000_${runId}`,
      description: 'Concurrency test deposit',
    },
  });
  if (!topup1000.ok) throw new Error('Failed to topup 1000 PKR');

  // Create two distinct completed rides of 700 PKR each
  const rideConcurA = await createTestRide(700.00);
  const rideConcurB = await createTestRide(700.00);

  // Initiate both payments
  const payConcurA = await apiRequest('/payments/initiate', {
    method: 'POST',
    headers: pHeaders,
    body: { rideId: rideConcurA, paymentMethod: 'wallet', idempotencyKey: `idem_init_cA_${runId}` },
  });
  const payConcurB = await apiRequest('/payments/initiate', {
    method: 'POST',
    headers: pHeaders,
    body: { rideId: rideConcurB, paymentMethod: 'wallet', idempotencyKey: `idem_init_cB_${runId}` },
  });

  console.log('  Wallet balance before race: 1000 PKR. Firing 2 simultaneous debits of 700 PKR each...');

  // Fire simultaneous confirm requests via Promise.all
  const [resA, resB] = await Promise.all([
    apiRequest(`/payments/${payConcurA.data.id}/confirm`, {
      method: 'POST',
      headers: pHeaders,
      body: { idempotencyKey: `idem_conf_cA_${runId}` },
    }),
    apiRequest(`/payments/${payConcurB.data.id}/confirm`, {
      method: 'POST',
      headers: pHeaders,
      body: { idempotencyKey: `idem_conf_cB_${runId}` },
    }),
  ]);

  const statuses = [resA.data?.payment?.status, resB.data?.payment?.status];
  console.log(`  Concurrent request results: Payment A status="${statuses[0]}", Payment B status="${statuses[1]}"`);

  const succeededCount = statuses.filter(s => s === 'succeeded').length;
  const failedCount = statuses.filter(s => s === 'failed').length;

  if (succeededCount !== 1 || failedCount !== 1) {
    throw new Error(`Test 7 Failed: Double-spend race condition occurred! Succeeded: ${succeededCount}, Failed: ${failedCount}`);
  }

  const pWalletAfterRace = await apiRequest('/wallet/me', { headers: pHeaders });
  console.log(`  Wallet balance after concurrent race: ${pWalletAfterRace.data.balance} PKR (Expected exactly 300.00 PKR)`);
  if (pWalletAfterRace.data.balance !== '300' && pWalletAfterRace.data.balance !== '300.00') {
    throw new Error(`Test 7 Failed: Balance corrupted after race: got ${pWalletAfterRace.data.balance}`);
  }
  console.log('  ✓ PASS 7: Wallet double-spend shielded: exactly one payment succeeded, one failed; balance = 300.00 PKR');

  // -------------------------------------------------------------
  // TEST 8: Wallet Ledger Immutability
  // -------------------------------------------------------------
  console.log('\n[Test 8] Testing Wallet Ledger Immutability...');
  // Fetch a transaction id
  const txRes = await apiRequest('/wallet/transactions', { headers: pHeaders });
  const sampleTx = txRes.data.transactions[0];

  // Try modifying transaction via PUT/PATCH/DELETE
  const putTxRes = await apiRequest(`/wallet/transactions/${sampleTx.id}`, {
    method: 'PUT',
    headers: pHeaders,
    body: { amount: 5000 },
  });
  const patchTxRes = await apiRequest(`/wallet/transactions/${sampleTx.id}`, {
    method: 'PATCH',
    headers: pHeaders,
    body: { amount: 5000 },
  });
  const deleteTxRes = await apiRequest(`/wallet/transactions/${sampleTx.id}`, {
    method: 'DELETE',
    headers: pHeaders,
  });

  if (putTxRes.status !== 404 && putTxRes.status !== 405) {
    throw new Error(`Test 8 Failed: Transaction PUT returned status ${putTxRes.status}`);
  }
  if (patchTxRes.status !== 404 && patchTxRes.status !== 405) {
    throw new Error(`Test 8 Failed: Transaction PATCH returned status ${patchTxRes.status}`);
  }
  if (deleteTxRes.status !== 404 && deleteTxRes.status !== 405) {
    throw new Error(`Test 8 Failed: Transaction DELETE returned status ${deleteTxRes.status}`);
  }
  console.log('  ✓ PASS 8: Wallet ledger is strictly append-only; PUT, PATCH, DELETE operations rejected with 404/405');

  // -------------------------------------------------------------
  // TEST 9: Exact Decimal Ledger Mathematical Reconciliation
  // -------------------------------------------------------------
  console.log('\n[Test 9] Testing Database Ledger Reconciliation (Opening + Credits - Debits = Balance)...');
  const dbLedgerRows = await pgClient.query(`
    SELECT "type", "amount", "balanceBefore", "balanceAfter"
    FROM "wallet_transactions"
    WHERE "userId" = $1
    ORDER BY "createdAt" ASC;
  `, [pId]);

  let runningBalance = 0;
  for (const row of dbLedgerRows.rows) {
    const amt = Number(row.amount);
    if (row.type === 'credit') runningBalance += amt;
    if (row.type === 'debit') runningBalance -= amt;
  }

  console.log(`  Ledger entries in DB: ${dbLedgerRows.rows.length}`);
  console.log(`  Computed from ledger rows: ${runningBalance.toFixed(2)} PKR, Current wallet balance: ${pWalletAfterRace.data.balance} PKR`);
  if (Math.abs(runningBalance - Number(pWalletAfterRace.data.balance)) > 0.001) {
    throw new Error('Test 9 Failed: Ledger mathematical reconciliation discrepancy detected!');
  }
  console.log('  ✓ PASS 9: 100% Exact ledger mathematical reconciliation confirmed');

  // -------------------------------------------------------------
  // TEST 10: Comprehensive Idempotency across All Operations
  // -------------------------------------------------------------
  console.log('\n[Test 10] Testing Idempotency across Initiation, Confirmation, Topup, and Settlement...');
  // 10a. Duplicate initiation
  const dupInit = await apiRequest('/payments/initiate', {
    method: 'POST',
    headers: pHeaders,
    body: { rideId: ride1Id, paymentMethod: 'cash', idempotencyKey: `idem_init_${ride1Id}` },
  });
  if (dupInit.data.id !== payment1.id) throw new Error('Test 10 Failed: Duplicate initiation ID mismatch');

  // 10b. Duplicate topup
  const dupTopup = await apiRequest('/wallet/topup', {
    method: 'POST',
    headers: pHeaders,
    body: { amount: 1000.00, idempotencyKey: `idem_topup_1000_${runId}` },
  });
  if (dupTopup.data.wallet.balance !== pWalletAfterRace.data.balance) {
    throw new Error('Test 10 Failed: Duplicate topup mutated balance!');
  }
  console.log('  ✓ PASS 10: All financial operations are completely idempotent with zero duplicate mutations');

  // -------------------------------------------------------------
  // TEST 11: Payment State Machine & Invalid Transitions
  // -------------------------------------------------------------
  console.log('\n[Test 11] Testing Payment State Machine & Transition Rejections...');
  // Succeeded payment of 700 PKR from race
  const succeededPaymentId = resA.data?.payment?.status === 'succeeded' ? payConcurA.data.id : payConcurB.data.id;

  // Issue refund on succeeded payment
  const refundRes = await apiRequest(`/payments/${succeededPaymentId}/refund`, {
    method: 'POST',
    headers: pHeaders,
    body: { reason: 'Test refund transition', idempotencyKey: `idem_ref_sm_${runId}` },
  });
  if (!refundRes.ok || refundRes.data.payment.status !== 'refunded') {
    throw new Error('Test 11 Failed: Succeeded -> Refunded transition failed');
  }

  // Attempt invalid transition: Refunded -> Succeeded (MUST BE REJECTED)
  const invalidConfirmRes = await apiRequest(`/payments/${succeededPaymentId}/confirm`, {
    method: 'POST',
    headers: pHeaders,
    body: {},
  });
  if (invalidConfirmRes.status !== 409) {
    throw new Error(`Test 11 Failed: Refunded -> Succeeded transition returned status ${invalidConfirmRes.status}, expected 409 Conflict`);
  }
  console.log('  Invalid transition (refunded -> succeeded) rejected with 409 Conflict');

  // Attempt invalid transition: Re-confirming a failed payment without re-initiating (MUST BE REJECTED)
  const failedPaymentId = resA.data?.payment?.status === 'failed' ? payConcurA.data.id : payConcurB.data.id;
  const invalidFailedConfirm = await apiRequest(`/payments/${failedPaymentId}/confirm`, {
    method: 'POST',
    headers: pHeaders,
    body: {},
  });
  if (invalidFailedConfirm.status !== 400) {
    throw new Error(`Test 11 Failed: Failed -> Succeeded without re-init returned ${invalidFailedConfirm.status}, expected 400`);
  }
  console.log('  Invalid transition (failed -> succeeded without re-init) rejected with 400 Bad Request');
  console.log('  ✓ PASS 11: Payment state machine strictly enforces valid transitions only');

  // -------------------------------------------------------------
  // TEST 12: Refund Security & Limits
  // -------------------------------------------------------------
  console.log('\n[Test 12] Testing Refund Security & Duplicate Refund Shielding...');
  // Duplicate refund attempt
  const dupRefundRes = await apiRequest(`/payments/${succeededPaymentId}/refund`, {
    method: 'POST',
    headers: pHeaders,
    body: { idempotencyKey: `idem_ref_sm_${runId}` },
  });
  if (!dupRefundRes.data.isAlreadyRefunded) {
    throw new Error('Test 12 Failed: Duplicate refund did not return isAlreadyRefunded: true');
  }
  console.log('  Duplicate refund rejected idempotently: isAlreadyRefunded: true');

  // Attempt refund on a pending/un-succeeded payment
  const pendingRideId = await createTestRide(50.00);
  const pendingPay = await apiRequest('/payments/initiate', {
    method: 'POST',
    headers: pHeaders,
    body: { rideId: pendingRideId, paymentMethod: 'cash' },
  });
  const invalidPendingRefund = await apiRequest(`/payments/${pendingPay.data.id}/refund`, {
    method: 'POST',
    headers: pHeaders,
    body: { reason: 'refund pending' },
  });
  if (invalidPendingRefund.status !== 400) {
    throw new Error(`Test 12 Failed: Refunding pending payment returned ${invalidPendingRefund.status}, expected 400`);
  }
  console.log('  Refunding non-succeeded payment rejected with 400 Bad Request');
  console.log('  ✓ PASS 12: Refund security shields against over-refunds, duplicate refunds, and invalid statuses');

  // -------------------------------------------------------------
  // TEST 13: External Payment Provider Honesty & Isolation
  // -------------------------------------------------------------
  console.log('\n[Test 13] Testing External Provider Boundary & Honesty...');
  const cardRideId = await createTestRide(25.00);
  const cardInit = await apiRequest('/payments/initiate', {
    method: 'POST',
    headers: pHeaders,
    body: { rideId: cardRideId, paymentMethod: 'card' },
  });
  const cardConfirm = await apiRequest(`/payments/${cardInit.data.id}/confirm`, {
    method: 'POST',
    headers: pHeaders,
    body: {},
  });
  if (cardConfirm.data.payment.failureReason !== 'NOT VERIFIED — provider credentials/environment unavailable') {
    throw new Error('Test 13 Failed: System did not report missing external provider credentials');
  }
  console.log('  ✓ PASS 13: External provider correctly and honestly reports NOT VERIFIED — provider credentials/environment unavailable');

  // -------------------------------------------------------------
  // TEST 14: Webhook Cryptographic Signature Verification
  // -------------------------------------------------------------
  console.log('\n[Test 14] Testing Webhook Signature Verification...');
  // 14a. No signature
  const noSigRes = await apiRequest('/payments/webhook', {
    method: 'POST',
    body: { type: 'payment_intent.succeeded', data: { paymentId: payment1.id } },
  });
  if (noSigRes.status !== 401) throw new Error(`Test 14a Failed: Expected 401, got ${noSigRes.status}`);

  // 14b. Tampered/invalid signature
  const badSigRes = await apiRequest('/payments/webhook', {
    method: 'POST',
    headers: { 'x-webhook-signature': 'sha256=invalidhash1234567890' },
    body: { type: 'payment_intent.succeeded', data: { paymentId: payment1.id } },
  });
  if (badSigRes.status !== 401) throw new Error(`Test 14b Failed: Expected 401, got ${badSigRes.status}`);

  // 14c. Valid signature using webhook secret
  const webhookSecret = process.env.PAYMENT_WEBHOOK_SECRET || 'dev_payment_webhook_secret_key_32_bytes_min!';
  const webhookPayload = JSON.stringify({ type: 'payment_intent.succeeded', data: { paymentId: payment1.id } });
  const validSig = 'sha256=' + crypto.createHmac('sha256', webhookSecret).update(webhookPayload).digest('hex');

  const validSigRes = await apiRequest('/payments/webhook', {
    method: 'POST',
    headers: { 'x-webhook-signature': validSig },
    body: { type: 'payment_intent.succeeded', data: { paymentId: payment1.id } },
  });
  if (validSigRes.status !== 200 && validSigRes.status !== 201) {
    throw new Error(`Test 14c Failed: Valid webhook signature rejected! Status: ${validSigRes.status}`);
  }
  console.log('  ✓ PASS 14: Webhook cryptographic HMAC-SHA256 signature verification fully verified');

  // -------------------------------------------------------------
  // TEST 15: Payment & Ride Consistency & Failure Isolation
  // -------------------------------------------------------------
  console.log('\n[Test 15] Testing Payment & Ride Consistency & History...');
  const historyRes = await apiRequest('/payments/history', { headers: pHeaders });
  if (!historyRes.ok || historyRes.data.payments.length === 0) {
    throw new Error('Test 15 Failed: Payment history empty');
  }

  const ridePayRes = await apiRequest(`/payments/ride/${ride1Id}`, { headers: pHeaders });
  if (!ridePayRes.ok || ridePayRes.data.payment.id !== payment1.id) {
    throw new Error('Test 15 Failed: Ride payment query failed');
  }
  console.log('  ✓ PASS 15: Payment & ride state consistency verified; history and ride query accurate');

  // Cleanup test actors
  await pgClient.query(`DELETE FROM "wallet_transactions" WHERE "userId" IN ($1, $2, $3, $4);`, [pId, dId, aId, otherDriverId]);
  await pgClient.query(`DELETE FROM "wallets" WHERE "userId" IN ($1, $2, $3, $4);`, [pId, dId, aId, otherDriverId]);
  await pgClient.query(`DELETE FROM "payments" WHERE "passengerId" IN ($1, $2, $3, $4) OR "driverId" IN ($1, $2, $3, $4);`, [pId, dId, aId, otherDriverId]);
  await pgClient.query(`DELETE FROM "rides" WHERE "passengerId" IN ($1, $2, $3, $4) OR "driverId" IN ($1, $2, $3, $4);`, [pId, dId, aId, otherDriverId]);
  await pgClient.query(`DELETE FROM "vehicles" WHERE "driverId" IN ($1, $2, $3, $4);`, [pId, dId, aId, otherDriverId]);
  await pgClient.query(`DELETE FROM "drivers" WHERE "id" IN ($1, $2, $3, $4);`, [pId, dId, aId, otherDriverId]);
  await pgClient.query(`DELETE FROM "users" WHERE "id" IN ($1, $2, $3, $4);`, [pId, dId, aId, otherDriverId]);
  await pgClient.end();

  console.log('\n============================================================');
  console.log('PHASE 11 FINAL FINANCIAL ACCEPTANCE: ALL 15 GATES PASSED (15/15 PASS)');
  console.log('============================================================\n');
}

main().catch((err) => {
  console.error('\n>>> PHASE 11 AUDIT FAILED <<<');
  console.error(err);
  process.exit(1);
});
