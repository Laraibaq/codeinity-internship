require("dns").setServers(["8.8.8.8", "1.1.1.1"]);
require("e:/code/codeinity-internship/RideHailingApp/apps/backend/node_modules/dotenv").config({
  path: "e:/code/codeinity-internship/RideHailingApp/apps/backend/.env",
});
const { PrismaClient } = require("e:/code/codeinity-internship/RideHailingApp/apps/backend/dist/generated/prisma/client");
const { PrismaPg } = require("e:/code/codeinity-internship/RideHailingApp/apps/backend/node_modules/@prisma/adapter-pg");
const { io } = require("e:/code/codeinity-internship/RideHailingApp/apps/mobile/node_modules/socket.io-client");
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

async function runPhase8LifecycleAudit() {
  console.log('================================================================');
  console.log('PHASE 8 — RIDE LIFECYCLE & COMPLETION COMPREHENSIVE AUDIT');
  console.log('================================================================\n');

  const testId = Date.now().toString().slice(-6);
  const results = {};

  try {
    // -------------------------------------------------------------
    // SETUP: Create Passengers & Drivers
    // -------------------------------------------------------------
    console.log('[Setup] Registering test actors in PostgreSQL...');

    const passengerA = await prisma.user.create({
      data: {
        name: `Passenger A ${testId}`,
        phone: `+15551${testId}`,
        passwordHash: 'dummyhash',
        phoneVerified: true,
      },
    });
    const tokenPassengerA = generateToken({ sub: passengerA.id, role: 'passenger' });

    const passengerB = await prisma.user.create({
      data: {
        name: `Passenger B ${testId}`,
        phone: `+15552${testId}`,
        passwordHash: 'dummyhash',
        phoneVerified: true,
      },
    });
    const tokenPassengerB = generateToken({ sub: passengerB.id, role: 'passenger' });

    const driver1 = await prisma.driver.create({
      data: {
        name: `Driver 1 ${testId}`,
        phone: `+15553${testId}`,
        passwordHash: 'dummyhash',
        phoneVerified: true,
        verificationStatus: 'approved',
        isOnline: true,
        currentLat: 37.7800,
        currentLng: -122.4100,
      },
    });
    const tokenDriver1 = generateToken({ sub: driver1.id, role: 'driver' });

    const driver2 = await prisma.driver.create({
      data: {
        name: `Driver 2 ${testId}`,
        phone: `+15554${testId}`,
        passwordHash: 'dummyhash',
        phoneVerified: true,
        verificationStatus: 'approved',
        isOnline: true,
        currentLat: 37.7810,
        currentLng: -122.4110,
      },
    });
    const tokenDriver2 = generateToken({ sub: driver2.id, role: 'driver' });

    console.log(`✓ Passenger A: ${passengerA.id}`);
    console.log(`✓ Passenger B: ${passengerB.id}`);
    console.log(`✓ Driver 1 (Assigned): ${driver1.id}`);
    console.log(`✓ Driver 2 (Unassigned): ${driver2.id}\n`);

    // -------------------------------------------------------------
    // PART 1: Section 25 Ride Ownership Security Tests
    // -------------------------------------------------------------
    console.log('[Part 1] Section 25 Ride Ownership Security Tests...');

    // Passenger A creates a ride
    const rideCreateRes = await apiRequest('/rides', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenPassengerA}` },
      body: {
        pickupLat: 37.7749,
        pickupLng: -122.4194,
        pickupAddress: '789 Market St',
        dropoffLat: 37.8080,
        dropoffLng: -122.4177,
        dropoffAddress: 'Pier 39',
        distanceKm: 4.8,
        etaMinutes: 14,
        proposedFare: 22.50,
      },
    });
    if (rideCreateRes.status !== 201) {
      throw new Error(`Failed to create test ride: ${JSON.stringify(rideCreateRes.data)}`);
    }
    const rideId = rideCreateRes.data.id;
    console.log(`✓ Ride created with ID ${rideId} (status: ${rideCreateRes.data.status})`);

    // Test 1: Passenger accesses own ride -> 200 OK
    const getOwnRideRes = await apiRequest(`/rides/${rideId}`, {
      headers: { Authorization: `Bearer ${tokenPassengerA}` },
    });
    if (getOwnRideRes.status === 200 && getOwnRideRes.data.id === rideId) {
      console.log('✓ Test 1: Passenger accesses own ride -> 200 OK');
      results.secTest1OwnPassengerAccess = 'PASS';
    } else {
      throw new Error(`Test 1 Failed: Expected 200 OK, got ${getOwnRideRes.status}`);
    }

    // Test 2: Another passenger accesses Passenger A's ride -> 403 Forbidden
    const getOtherRideRes = await apiRequest(`/rides/${rideId}`, {
      headers: { Authorization: `Bearer ${tokenPassengerB}` },
    });
    if (getOtherRideRes.status === 403) {
      console.log('✓ Test 2: Passenger accesses another passenger\'s ride -> 403 Forbidden');
      results.secTest2CrossPassengerDenied = 'PASS';
    } else {
      throw new Error(`Test 2 Failed: Expected 403, got ${getOtherRideRes.status}`);
    }

    // Driver 1 accepts the ride -> status becomes accepted
    const acceptRes = await apiRequest(`/rides/${rideId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenDriver1}` },
      body: { status: 'accepted' },
    });
    if (acceptRes.status !== 200) {
      throw new Error(`Driver 1 failed to accept ride: ${JSON.stringify(acceptRes.data)}`);
    }
    console.log(`✓ Driver 1 assigned and accepted ride (status: accepted)`);

    // Test 3: Assigned driver changes own ride -> 200 OK
    const driverStartRes = await apiRequest(`/rides/${rideId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenDriver1}` },
      body: { status: 'ongoing' },
    });
    if (driverStartRes.status === 200 && driverStartRes.data.status === 'ongoing') {
      console.log('✓ Test 3: Assigned driver changes own ride to ongoing -> 200 OK');
      results.secTest3AssignedDriverUpdates = 'PASS';
    } else {
      throw new Error(`Test 3 Failed: Expected 200, got ${driverStartRes.status} (${JSON.stringify(driverStartRes.data)})`);
    }

    // Test 4: Unassigned driver changes another driver's ride -> 403 Forbidden
    const unassignedDriverRes = await apiRequest(`/rides/${rideId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenDriver2}` },
      body: { status: 'completed' },
    });
    if (unassignedDriverRes.status === 403) {
      console.log('✓ Test 4: Unassigned driver changes another driver\'s ride -> 403 Forbidden');
      results.secTest4UnassignedDriverDenied = 'PASS';
    } else {
      throw new Error(`Test 4 Failed: Expected 403 Forbidden, got ${unassignedDriverRes.status}`);
    }

    // Test 5: Unauthenticated user changes ride -> 401 Unauthorized
    const unauthRes = await apiRequest(`/rides/${rideId}/status`, {
      method: 'PATCH',
      body: { status: 'completed' },
    });
    if (unauthRes.status === 401) {
      console.log('✓ Test 5: Unauthenticated user changes ride -> 401 Unauthorized');
      results.secTest5UnauthDenied = 'PASS';
    } else {
      throw new Error(`Test 5 Failed: Expected 401 Unauthorized, got ${unauthRes.status}`);
    }

    // Driver 1 completes the ride -> status becomes completed
    const completeRes = await apiRequest(`/rides/${rideId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenDriver1}` },
      body: { status: 'completed' },
    });
    if (completeRes.status !== 200 || completeRes.data.status !== 'completed') {
      throw new Error(`Driver 1 failed to complete ride: ${JSON.stringify(completeRes.data)}`);
    }
    console.log(`✓ Driver 1 completed ride (status: completed)\n`);

    // -------------------------------------------------------------
    // PART 2: Section 26 State Machine & Invalid Transition Tests
    // -------------------------------------------------------------
    console.log('[Part 2] Section 26 State Machine & Invalid Transition Rejections...');

    // On the completed ride:
    // 1. completed -> ongoing (REJECT 400/409)
    const completedToOngoing = await apiRequest(`/rides/${rideId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenDriver1}` },
      body: { status: 'ongoing' },
    });
    if (completedToOngoing.status === 400 || completedToOngoing.status === 409) {
      console.log(`✓ Invalid transition completed -> ongoing rejected with HTTP ${completedToOngoing.status}`);
    } else {
      throw new Error(`Expected completed -> ongoing rejection, got ${completedToOngoing.status}`);
    }

    // 2. completed -> accepted (REJECT 400/409)
    const completedToAccepted = await apiRequest(`/rides/${rideId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenDriver1}` },
      body: { status: 'accepted' },
    });
    if (completedToAccepted.status === 400 || completedToAccepted.status === 409) {
      console.log(`✓ Invalid transition completed -> accepted rejected with HTTP ${completedToAccepted.status}`);
    } else {
      throw new Error(`Expected completed -> accepted rejection, got ${completedToAccepted.status}`);
    }

    // 3. completed -> cancelled (REJECT 400)
    const completedToCancelled = await apiRequest(`/rides/${rideId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenPassengerA}` },
      body: { status: 'cancelled' },
    });
    if (completedToCancelled.status === 400) {
      console.log(`✓ Invalid transition completed -> cancelled rejected with HTTP 400`);
    } else {
      throw new Error(`Expected completed -> cancelled rejection, got ${completedToCancelled.status}`);
    }

    // Create a new ride to test requested -> completed and requested -> ongoing rejections
    const newRideRes = await apiRequest('/rides', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenPassengerA}` },
      body: {
        pickupLat: 37.7749,
        pickupLng: -122.4194,
        pickupAddress: '100 Bush St',
        dropoffLat: 37.8080,
        dropoffLng: -122.4177,
        dropoffAddress: 'Embarcadero',
        distanceKm: 3.5,
        etaMinutes: 10,
        proposedFare: 18.00,
      },
    });
    const testRide2Id = newRideRes.data.id;

    // 4. requested -> completed (REJECT)
    const requestedToCompleted = await apiRequest(`/rides/${testRide2Id}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenDriver1}` },
      body: { status: 'completed' },
    });
    if (requestedToCompleted.status === 400 || requestedToCompleted.status === 403) {
      console.log(`✓ Invalid transition requested -> completed rejected with HTTP ${requestedToCompleted.status}`);
    } else {
      throw new Error(`Expected requested -> completed rejection, got ${requestedToCompleted.status}`);
    }

    // 5. requested -> ongoing (REJECT)
    const requestedToOngoing = await apiRequest(`/rides/${testRide2Id}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenDriver1}` },
      body: { status: 'ongoing' },
    });
    if (requestedToOngoing.status === 400 || requestedToOngoing.status === 403) {
      console.log(`✓ Invalid transition requested -> ongoing rejected with HTTP ${requestedToOngoing.status}`);
    } else {
      throw new Error(`Expected requested -> ongoing rejection, got ${requestedToOngoing.status}`);
    }

    // 6. Passenger cancels requested ride -> 200 OK
    const cancelRes = await apiRequest(`/rides/${testRide2Id}/cancel`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenPassengerA}` },
      body: { reason: 'Changed mind' },
    });
    if (cancelRes.status === 200 && cancelRes.data.status === 'cancelled') {
      console.log('✓ Valid transition requested -> cancelled via POST /rides/:id/cancel -> 200 OK');
    } else {
      throw new Error(`Expected successful cancel, got ${cancelRes.status} (${JSON.stringify(cancelRes.data)})`);
    }

    // 7. cancelled -> ongoing (REJECT)
    const cancelledToOngoing = await apiRequest(`/rides/${testRide2Id}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenDriver1}` },
      body: { status: 'ongoing' },
    });
    if (cancelledToOngoing.status === 400 || cancelledToOngoing.status === 403) {
      console.log(`✓ Invalid transition cancelled -> ongoing rejected with HTTP ${cancelledToOngoing.status}`);
    } else {
      throw new Error(`Expected cancelled -> ongoing rejection, got ${cancelledToOngoing.status}`);
    }

    // 8. cancelled -> completed (REJECT)
    const cancelledToCompleted = await apiRequest(`/rides/${testRide2Id}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenDriver1}` },
      body: { status: 'completed' },
    });
    if (cancelledToCompleted.status === 400 || cancelledToCompleted.status === 403) {
      console.log(`✓ Invalid transition cancelled -> completed rejected with HTTP ${cancelledToCompleted.status}`);
    } else {
      throw new Error(`Expected cancelled -> completed rejection, got ${cancelledToCompleted.status}`);
    }

    results.stateMachineTransitions = 'PASS';
    console.log('✓ All state machine invalid transitions strictly rejected!\n');

    // -------------------------------------------------------------
    // PART 3: Section 27 & 28 Concurrency & Double Completion Tests
    // -------------------------------------------------------------
    console.log('[Part 3] Section 27 & 28 Concurrency & Double Completion Tests...');

    // Create a third ride for concurrency testing
    const ride3Res = await apiRequest('/rides', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenPassengerA}` },
      body: {
        pickupLat: 37.7749,
        pickupLng: -122.4194,
        pickupAddress: 'Race Pick',
        dropoffLat: 37.8080,
        dropoffLng: -122.4177,
        dropoffAddress: 'Race Drop',
        distanceKm: 4.0,
        etaMinutes: 12,
        proposedFare: 25.00,
      },
    });
    const ride3Id = ride3Res.data.id;

    // Driver 1 accepts
    await apiRequest(`/rides/${ride3Id}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenDriver1}` },
      body: { status: 'accepted' },
    });

    // Test Race: Driver 1 starts ride vs Passenger cancels ride concurrently
    console.log('  Testing race between Driver 1 "start ride" and Passenger A "cancel"...');
    const [startRace, cancelRace] = await Promise.all([
      apiRequest(`/rides/${ride3Id}/status`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${tokenDriver1}` },
        body: { status: 'ongoing' },
      }),
      apiRequest(`/rides/${ride3Id}/cancel`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenPassengerA}` },
        body: { reason: 'Cancel race' },
      }),
    ]);

    console.log(`  Driver start status: ${startRace.status}, Passenger cancel status: ${cancelRace.status}`);
    const dbRide3 = await prisma.ride.findUnique({ where: { id: ride3Id } });
    console.log(`  Authoritative final database status: ${dbRide3.status}`);
    if (
      (dbRide3.status === 'ongoing' && startRace.status === 200 && cancelRace.status === 400) ||
      (dbRide3.status === 'cancelled' && cancelRace.status === 200 && startRace.status === 400)
    ) {
      console.log('✓ Concurrency race handled atomically! Exactly one valid outcome persisted in PostgreSQL');
      results.concurrencyRaceShield = 'PASS';
    } else {
      throw new Error(`Unexpected race result: start=${startRace.status}, cancel=${cancelRace.status}, dbStatus=${dbRide3.status}`);
    }

    // Now test Section 28: Double Completion Test
    // Create Ride 4 and bring it to 'ongoing'
    const ride4Res = await apiRequest('/rides', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenPassengerA}` },
      body: {
        pickupLat: 37.7749,
        pickupLng: -122.4194,
        pickupAddress: 'Double Comp Pick',
        dropoffLat: 37.8080,
        dropoffLng: -122.4177,
        dropoffAddress: 'Double Comp Drop',
        distanceKm: 5.0,
        etaMinutes: 15,
        proposedFare: 30.00,
      },
    });
    const ride4Id = ride4Res.data.id;
    await apiRequest(`/rides/${ride4Id}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenDriver1}` },
      body: { status: 'accepted' },
    });
    await apiRequest(`/rides/${ride4Id}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenDriver1}` },
      body: { status: 'ongoing' },
    });

    console.log('  Testing simultaneous double completion requests for Ride 4...');
    const [comp1, comp2] = await Promise.all([
      apiRequest(`/rides/${ride4Id}/status`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${tokenDriver1}` },
        body: { status: 'completed' },
      }),
      apiRequest(`/rides/${ride4Id}/status`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${tokenDriver1}` },
        body: { status: 'completed' },
      }),
    ]);

    console.log(`  Completion 1 status: ${comp1.status}, Completion 2 status: ${comp2.status}`);
    const dbRide4 = await prisma.ride.findUnique({ where: { id: ride4Id } });
    if (
      dbRide4.status === 'completed' &&
      ((comp1.status === 200 && comp2.status === 409) || (comp1.status === 409 && comp2.status === 200))
    ) {
      console.log('✓ Section 28 Double Completion Shield VERIFIED: exactly one 200 OK, duplicate blocked with 409 Conflict!');
      results.doubleCompletionShield = 'PASS';
    } else {
      throw new Error(`Double completion failed: comp1=${comp1.status}, comp2=${comp2.status}, dbStatus=${dbRide4.status}`);
    }

    // -------------------------------------------------------------
    // PART 4: Section 13 & 14 Authoritative Timestamps & Duration
    // -------------------------------------------------------------
    console.log('\n[Part 4] Testing Authoritative Server Timestamps & Trip Duration...');
    console.log(`  requestedAt: ${dbRide4.requestedAt}`);
    console.log(`  startedAt:   ${dbRide4.startedAt}`);
    console.log(`  completedAt: ${dbRide4.completedAt}`);

    if (dbRide4.startedAt && dbRide4.completedAt && dbRide4.completedAt >= dbRide4.startedAt) {
      const durationSeconds = Math.round((dbRide4.completedAt.getTime() - dbRide4.startedAt.getTime()) / 1000);
      console.log(`✓ Authoritative trip duration calculated from PostgreSQL: ${durationSeconds} seconds`);
      results.authoritativeDuration = 'PASS';
    } else {
      throw new Error('Invalid or missing timestamps on completed ride');
    }

    // -------------------------------------------------------------
    // PART 5: Section 24 Ride History Verification
    // -------------------------------------------------------------
    console.log('\n[Part 5] Section 24 Ride History Verification...');

    // Passenger A fetches history
    const passengerHistoryRes = await apiRequest('/rides/history', {
      headers: { Authorization: `Bearer ${tokenPassengerA}` },
    });
    if (passengerHistoryRes.status !== 200) {
      throw new Error(`Failed to fetch passenger history: ${JSON.stringify(passengerHistoryRes.data)}`);
    }
    const passengerHistory = passengerHistoryRes.data;
    console.log(`  Passenger A history count: ${passengerHistory.rides?.length} rides (total: ${passengerHistory.total})`);

    const hasRide1 = passengerHistory.rides.some((r) => r.id === rideId);
    const hasRide4 = passengerHistory.rides.some((r) => r.id === ride4Id);
    if (hasRide1 && hasRide4) {
      console.log('✓ Passenger A successfully retrieved completed rides in ride history');
    } else {
      throw new Error('Passenger history missing completed rides');
    }

    // Passenger B fetches history (should have 0 rides)
    const passengerBHistoryRes = await apiRequest('/rides/history', {
      headers: { Authorization: `Bearer ${tokenPassengerB}` },
    });
    if (passengerBHistoryRes.data.rides?.length === 0) {
      console.log('✓ Cross-passenger isolation verified: Passenger B has 0 rides in history');
    } else {
      throw new Error('Cross-passenger history leak detected!');
    }

    // Driver 1 fetches history
    const driverHistoryRes = await apiRequest('/rides/history', {
      headers: { Authorization: `Bearer ${tokenDriver1}` },
    });
    if (driverHistoryRes.status !== 200 || !Array.isArray(driverHistoryRes.data)) {
      throw new Error(`Failed to fetch driver history: ${JSON.stringify(driverHistoryRes.data)}`);
    }
    const hasDriverRide1 = driverHistoryRes.data.some((r) => r.id === rideId);
    const hasDriverRide4 = driverHistoryRes.data.some((r) => r.id === ride4Id);
    if (hasDriverRide1 && hasDriverRide4) {
      console.log('✓ Driver 1 successfully retrieved completed rides in driver history');
      results.rideHistoryVerification = 'PASS';
    } else {
      throw new Error('Driver history missing completed rides');
    }

    // -------------------------------------------------------------
    // PART 6: Socket.IO Realtime Status Notification Verification
    // -------------------------------------------------------------
    console.log('\n[Part 6] Testing Socket.IO Realtime Status Notification...');

    // Connect passenger socket
    const passengerSocket = io(API_URL, {
      auth: { token: tokenPassengerA },
      extraHeaders: { authorization: `Bearer ${tokenPassengerA}` },
      transports: ['websocket', 'polling'],
    });

    const statusEventsReceived = [];
    passengerSocket.on('ride:status-changed', (event) => {
      statusEventsReceived.push(event);
    });

    await new Promise((resolve) => passengerSocket.on('connect', resolve));
    console.log('✓ Passenger socket connected');

    // Create Ride 5 to trace live socket events
    const ride5Res = await apiRequest('/rides', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenPassengerA}` },
      body: {
        pickupLat: 37.7749,
        pickupLng: -122.4194,
        pickupAddress: 'Socket St',
        dropoffLat: 37.8080,
        dropoffLng: -122.4177,
        dropoffAddress: 'Socket Pier',
        distanceKm: 4.2,
        etaMinutes: 13,
        proposedFare: 21.00,
      },
    });
    const ride5Id = ride5Res.data.id;

    // Join ride room
    passengerSocket.emit('room:join', { room: `ride:${ride5Id}` });
    await new Promise((r) => setTimeout(r, 250));

    // Driver 1 accepts
    await apiRequest(`/rides/${ride5Id}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenDriver1}` },
      body: { status: 'accepted' },
    });

    // Driver 1 starts ride
    const start5Res = await apiRequest(`/rides/${ride5Id}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenDriver1}` },
      body: { status: 'ongoing' },
    });
    console.log('  Ride 5 start response:', start5Res.status, JSON.stringify(start5Res.data?.status));

    await new Promise((r) => setTimeout(r, 150));

    // Driver 1 completes ride
    const comp5Res = await apiRequest(`/rides/${ride5Id}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenDriver1}` },
      body: { status: 'completed' },
    });
    console.log('  Ride 5 completion response:', comp5Res.status, JSON.stringify(comp5Res.data?.status));

    // Wait for socket events to arrive
    await new Promise((r) => setTimeout(r, 1200));
    passengerSocket.disconnect();

    const receivedOngoing = statusEventsReceived.some((e) => e.rideId === ride5Id && e.status === 'ongoing' && e.timestamp);
    const receivedCompleted = statusEventsReceived.some((e) => e.rideId === ride5Id && e.status === 'completed' && e.timestamp);

    if (receivedOngoing && receivedCompleted) {
      console.log('✓ Socket.IO successfully delivered authoritative ride:status-changed events (ongoing, completed) with server timestamps!');
      results.socketStatusEvents = 'PASS';
    } else {
      console.warn('Events received:', statusEventsReceived);
      throw new Error('Socket.IO failed to deliver expected status-changed events with timestamps');
    }

    // -------------------------------------------------------------
    // FINAL AUDIT SUMMARY
    // -------------------------------------------------------------
    console.log('\n================================================================');
    console.log('PHASE 8 RIDE LIFECYCLE AUDIT RESULTS SUMMARY');
    console.log('================================================================');
    for (const [k, v] of Object.entries(results)) {
      console.log(`- ${k}: ${v}`);
    }
    console.log('\n🎉 ALL PHASE 8 LIFECYCLE AUDIT CHECKS PASSED!\n');

  } catch (err) {
    console.error('\n❌ PHASE 8 AUDIT FAILED:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runPhase8LifecycleAudit();
