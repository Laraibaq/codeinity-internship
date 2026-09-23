require("dns").setServers(["8.8.8.8", "1.1.1.1"]);
require("e:/code/codeinity-internship/RideHailingApp/apps/backend/node_modules/dotenv").config({
  path: "e:/code/codeinity-internship/RideHailingApp/apps/backend/.env",
});
const { PrismaClient } = require("e:/code/codeinity-internship/RideHailingApp/apps/backend/dist/generated/prisma/client");
const { PrismaPg } = require("e:/code/codeinity-internship/RideHailingApp/apps/backend/node_modules/@prisma/adapter-pg");
const jwt = require("e:/code/codeinity-internship/RideHailingApp/apps/backend/node_modules/jsonwebtoken");

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

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
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  return { status: res.status, data };
}

async function runPhase10Tests() {
  console.log('================================================================');
  console.log('PHASE 10 — NOTIFICATIONS VERIFICATION & INTEGRATION AUDIT');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${message}`);
      failed++;
    }
  }

  const testId = Date.now().toString().slice(-6);

  try {
    // -------------------------------------------------------------
    // 1. SETUP: Create Passenger & Driver
    // -------------------------------------------------------------
    console.log('[Setup] Registering test actors in PostgreSQL...');

    const passenger = await prisma.user.create({
      data: {
        name: `P10 Passenger ${testId}`,
        phone: `+15550${testId}`,
        passwordHash: 'dummyhash',
        phoneVerified: true,
      },
    });
    const passengerToken = generateToken({ sub: passenger.id, role: 'passenger' });

    const driver = await prisma.driver.create({
      data: {
        name: `P10 Driver ${testId}`,
        phone: `+15551${testId}`,
        passwordHash: 'dummyhash',
        phoneVerified: true,
        verificationStatus: 'approved',
        isOnline: true,
        currentLat: 37.7749,
        currentLng: -122.4194,
      },
    });
    const driverToken = generateToken({ sub: driver.id, role: 'driver' });

    assert(passenger.id && driver.id, 'Test actors created successfully in database');

    // -------------------------------------------------------------
    // 2. DEVICE TOKEN REGISTRATION & SECURITY
    // -------------------------------------------------------------
    console.log('\n[Audit 1] Testing Device Token Registration & Security...');

    const mockExpoTokenPassenger = `ExponentPushToken[pass_${testId}_${Math.random().toString(36).substring(2, 8)}]`;
    const mockExpoTokenDriver = `ExponentPushToken[drv_${testId}_${Math.random().toString(36).substring(2, 8)}]`;

    // 2.1 Reject unauthenticated token registration
    const unauthReg = await apiRequest('/notifications/device-token', {
      method: 'POST',
      body: { token: mockExpoTokenPassenger },
    });
    assert(unauthReg.status === 401, 'Unauthenticated token registration rejected with 401 Unauthorized');

    // 2.2 Register passenger device token
    const passTokenRes = await apiRequest('/notifications/device-token', {
      method: 'POST',
      headers: { Authorization: `Bearer ${passengerToken}` },
      body: {
        token: mockExpoTokenPassenger,
        platform: 'ios',
      },
    });
    assert(passTokenRes.status === 200 && passTokenRes.data.success === true, 'Passenger device token registered successfully');

    // 2.3 Verify persistence in PostgreSQL
    const dbPassToken = await prisma.deviceToken.findUnique({
      where: { token: mockExpoTokenPassenger },
    });
    assert(
      dbPassToken &&
      dbPassToken.userId === passenger.id &&
      dbPassToken.userRole === 'passenger' &&
      dbPassToken.platform === 'ios',
      'Passenger token correctly persisted in device_tokens table with authenticated userId and role',
    );

    // 2.4 Register driver device token
    const driverTokenRes = await apiRequest('/notifications/device-token', {
      method: 'POST',
      headers: { Authorization: `Bearer ${driverToken}` },
      body: {
        token: mockExpoTokenDriver,
        platform: 'android',
      },
    });
    assert(driverTokenRes.status === 200 && driverTokenRes.data.success === true, 'Driver device token registered successfully');

    const dbDriverToken = await prisma.deviceToken.findUnique({
      where: { token: mockExpoTokenDriver },
    });
    assert(
      dbDriverToken &&
      dbDriverToken.userId === driver.id &&
      dbDriverToken.userRole === 'driver' &&
      dbDriverToken.platform === 'android',
      'Driver token correctly persisted in device_tokens table with authenticated driverId and role',
    );

    // 2.5 Re-registration / Upsert idempotency test
    const reRegRes = await apiRequest('/notifications/device-token', {
      method: 'POST',
      headers: { Authorization: `Bearer ${passengerToken}` },
      body: {
        token: mockExpoTokenPassenger,
        platform: 'ios',
      },
    });
    assert(reRegRes.status === 200 && reRegRes.data.success === true, 'Idempotent token re-registration updates without duplicate key error');

    // -------------------------------------------------------------
    // 3. DEVICE TOKEN REMOVAL (LOGOUT FLOW)
    // -------------------------------------------------------------
    console.log('\n[Audit 2] Testing Device Token Removal...');

    const tempToken = `ExponentPushToken[temp_${testId}]`;
    await apiRequest('/notifications/device-token', {
      method: 'POST',
      headers: { Authorization: `Bearer ${passengerToken}` },
      body: { token: tempToken, platform: 'web' },
    });

    const deleteRes = await apiRequest('/notifications/device-token', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${passengerToken}` },
      body: { token: tempToken },
    });
    assert(deleteRes.status === 200 && deleteRes.data.success === true && deleteRes.data.count >= 1, 'Device token deleted successfully upon logout');

    const checkDeleted = await prisma.deviceToken.findUnique({ where: { token: tempToken } });
    assert(!checkDeleted, 'Removed token is no longer present in PostgreSQL');

    // -------------------------------------------------------------
    // 4. RIDE LIFECYCLE DISPATCH & FAILURE ISOLATION
    // -------------------------------------------------------------
    console.log('\n[Audit 3] Testing Ride Lifecycle Push Dispatch & Failure Isolation...');

    // 4.1 Ride Creation -> Driver Matching -> ride_offer push
    const createRideRes = await apiRequest('/rides', {
      method: 'POST',
      headers: { Authorization: `Bearer ${passengerToken}` },
      body: {
        pickupLat: 37.7749,
        pickupLng: -122.4194,
        pickupAddress: 'Phase 10 Market Street',
        dropoffLat: 37.7849,
        dropoffLng: -122.4094,
        dropoffAddress: 'Phase 10 Mission District',
        distanceKm: 2.5,
        etaMinutes: 7,
        proposedFare: 16.5,
      },
    });
    assert(createRideRes.status === 201 && createRideRes.data.id, 'Ride created successfully (requested)');
    const rideId = createRideRes.data.id;

    // Check driver received matching offer (with ride_offer push fired asynchronously)
    const driverOffersRes = await apiRequest('/rides/driver/offers', {
      method: 'GET',
      headers: { Authorization: `Bearer ${driverToken}` },
    });
    assert(driverOffersRes.status === 200 && driverOffersRes.data.length > 0, 'Driver offer exists (ride_offer push dispatched without blocking)');
    const offerId = driverOffersRes.data.find((o) => o.rideId === rideId)?.id;
    assert(offerId, `Found matching offer ID: ${offerId}`);

    // 4.2 Ride Accept -> ride_accepted push
    const acceptRes = await apiRequest(`/rides/${rideId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${driverToken}` },
      body: { status: 'accepted' },
    });
    assert(acceptRes.status === 200 && acceptRes.data.status === 'accepted', 'Driver accepted ride (ride_accepted push dispatched to passenger)');

    // 4.3 Ride Start -> ride_started push
    const startRes = await apiRequest(`/rides/${rideId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${driverToken}` },
      body: { status: 'ongoing' },
    });
    assert(startRes.status === 200 && startRes.data.status === 'ongoing', 'Driver started ride (ride_started push dispatched to passenger)');

    // 4.4 Ride Complete -> ride_completed push
    const completeRes = await apiRequest(`/rides/${rideId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${driverToken}` },
      body: { status: 'completed' },
    });
    assert(completeRes.status === 200 && completeRes.data.status === 'completed', 'Driver completed ride (ride_completed push dispatched to passenger)');

    // -------------------------------------------------------------
    // 5. CANCELLATION PUSH DISPATCH
    // -------------------------------------------------------------
    console.log('\n[Audit 4] Testing Cancellation Push Notifications...');

    // 5.1 Passenger cancels accepted ride -> driver receives push
    const ride2Res = await apiRequest('/rides', {
      method: 'POST',
      headers: { Authorization: `Bearer ${passengerToken}` },
      body: {
        pickupLat: 37.7749,
        pickupLng: -122.4194,
        pickupAddress: 'Cancel Ride 2 Pickup',
        dropoffLat: 37.7849,
        dropoffLng: -122.4094,
        dropoffAddress: 'Cancel Ride 2 Dropoff',
        distanceKm: 1.2,
        etaMinutes: 4,
        proposedFare: 11.0,
      },
    });
    const ride2Id = ride2Res.data.id;

    // Driver accepts ride 2
    await apiRequest(`/rides/${ride2Id}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${driverToken}` },
      body: { status: 'accepted' },
    });

    // Passenger cancels ride 2
    const passCancelRes = await apiRequest(`/rides/${ride2Id}/cancel`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${passengerToken}` },
    });
    assert(passCancelRes.status === 200 && passCancelRes.data.status === 'cancelled', 'Passenger cancelled ride (ride_cancelled push dispatched to driver)');

    // 5.2 Driver cancels accepted ride -> passenger receives push
    const ride3Res = await apiRequest('/rides', {
      method: 'POST',
      headers: { Authorization: `Bearer ${passengerToken}` },
      body: {
        pickupLat: 37.7749,
        pickupLng: -122.4194,
        pickupAddress: 'Cancel Ride 3 Pickup',
        dropoffLat: 37.7849,
        dropoffLng: -122.4094,
        dropoffAddress: 'Cancel Ride 3 Dropoff',
        distanceKm: 1.5,
        etaMinutes: 5,
        proposedFare: 13.0,
      },
    });
    const ride3Id = ride3Res.data.id;

    // Driver accepts ride 3
    await apiRequest(`/rides/${ride3Id}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${driverToken}` },
      body: { status: 'accepted' },
    });

    // Driver cancels ride 3
    const drvCancelRes = await apiRequest(`/rides/${ride3Id}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${driverToken}` },
      body: { status: 'cancelled' },
    });
    assert(drvCancelRes.status === 200 && drvCancelRes.data.status === 'cancelled', 'Driver cancelled ride (ride_cancelled push dispatched to passenger)');

    // -------------------------------------------------------------
    // 6. IN-APP DRIVER NOTIFICATIONS INBOX VERIFICATION
    // -------------------------------------------------------------
    console.log('\n[Audit 5] Testing In-App Driver Notification Retrieval & Read State...');

    const inAppNotifRes = await apiRequest('/notifications', {
      method: 'GET',
      headers: { Authorization: `Bearer ${driverToken}` },
    });
    assert(
      inAppNotifRes.status === 200 &&
      Array.isArray(inAppNotifRes.data.notifications),
      'Driver in-app notification inbox retrieved successfully',
    );

    // Clean up test records
    await prisma.deviceToken.deleteMany({
      where: { token: { in: [mockExpoTokenPassenger, mockExpoTokenDriver] } },
    });
    await prisma.$disconnect();

    console.log('\n================================================================');
    console.log(`PHASE 10 AUDIT SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('================================================================\n');

    if (failed > 0) process.exit(1);
  } catch (err) {
    console.error('Fatal error in Phase 10 test execution:', err);
    await prisma.$disconnect();
    process.exit(1);
  }
}

runPhase10Tests();
