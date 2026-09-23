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

async function runPhase9Audit() {
  console.log('================================================================');
  console.log('PHASE 9 — RATINGS & REVIEWS COMPREHENSIVE VERIFICATION AUDIT');
  console.log('================================================================\n');

  const testId = Date.now().toString().slice(-6);
  const checklist = [];

  function record(name, pass, detail = '') {
    checklist.push({ name, pass, detail });
    const mark = pass ? '✓ PASS' : '✗ FAIL';
    console.log(`[${mark}] ${name}${detail ? ` -> ${detail}` : ''}`);
  }

  try {
    // -------------------------------------------------------------
    // SETUP: Test Actors and Rides
    // -------------------------------------------------------------
    console.log('[Setup] Creating test passengers, drivers, and rides in PostgreSQL...');

    const passenger1 = await prisma.user.create({
      data: {
        name: `Passenger One ${testId}`,
        phone: `+18881${testId}`,
        passwordHash: 'dummyhash',
        phoneVerified: true,
      },
    });
    const tokenP1 = generateToken({ sub: passenger1.id, role: 'passenger' });

    const passenger2 = await prisma.user.create({
      data: {
        name: `Passenger Two ${testId}`,
        phone: `+18882${testId}`,
        passwordHash: 'dummyhash',
        phoneVerified: true,
      },
    });
    const tokenP2 = generateToken({ sub: passenger2.id, role: 'passenger' });

    const driver1 = await prisma.driver.create({
      data: {
        name: `Driver One ${testId}`,
        phone: `+18883${testId}`,
        passwordHash: 'dummyhash',
        phoneVerified: true,
        verificationStatus: 'approved',
      },
    });
    const tokenD1 = generateToken({ sub: driver1.id, role: 'driver' });

    const driver2 = await prisma.driver.create({
      data: {
        name: `Driver Two ${testId}`,
        phone: `+18884${testId}`,
        passwordHash: 'dummyhash',
        phoneVerified: true,
        verificationStatus: 'approved',
      },
    });
    const tokenD2 = generateToken({ sub: driver2.id, role: 'driver' });

    // Completed Ride: Passenger 1 & Driver 1
    const completedRide = await prisma.ride.create({
      data: {
        passengerId: passenger1.id,
        driverId: driver1.id,
        pickupLat: 31.5204,
        pickupLng: 74.3587,
        pickupAddress: 'Gulberg III, Lahore',
        dropoffLat: 31.5497,
        dropoffLng: 74.3436,
        dropoffAddress: 'Mall Road, Lahore',
        distanceKm: 5.2,
        etaMinutes: 15,
        proposedFare: 25.00,
        aiRecommendedFare: 25.00,
        status: 'completed',
        completedAt: new Date(),
      },
    });

    // Ongoing Ride: Passenger 2 & Driver 2
    const ongoingRide = await prisma.ride.create({
      data: {
        passengerId: passenger2.id,
        driverId: driver2.id,
        pickupLat: 31.5204,
        pickupLng: 74.3587,
        pickupAddress: 'Gulberg III, Lahore',
        dropoffLat: 31.5497,
        dropoffLng: 74.3436,
        dropoffAddress: 'Mall Road, Lahore',
        distanceKm: 5.2,
        etaMinutes: 15,
        proposedFare: 20.00,
        aiRecommendedFare: 20.00,
        status: 'ongoing',
        startedAt: new Date(),
      },
    });

    console.log(`[Setup Complete] CompletedRide: ${completedRide.id}, OngoingRide: ${ongoingRide.id}\n`);

    // -------------------------------------------------------------
    // TEST 1: Reject Rating on Non-Completed Ride
    // -------------------------------------------------------------
    console.log('--- TEST 1: Reject Rating on Non-Completed Ride ---');
    const ongoingRateRes = await apiRequest(`/rides/${ongoingRide.id}/rate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenP2}` },
      body: { score: 5, comment: 'Trying to rate early' },
    });
    record(
      'Non-completed ride rating rejected with 400 Bad Request',
      ongoingRateRes.status === 400,
      `Status: ${ongoingRateRes.status}, Error: ${ongoingRateRes.data?.message || ongoingRateRes.data}`
    );

    // -------------------------------------------------------------
    // TEST 2: Authorization & Role Enforcement
    // -------------------------------------------------------------
    console.log('\n--- TEST 2: Authorization & Participant Role Enforcement ---');
    // Driver 2 trying to rate Passenger 1's ride
    const nonParticipantDriverRes = await apiRequest(`/rides/${completedRide.id}/rate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenD2}` },
      body: { score: 5, comment: 'I was not the driver' },
    });
    record(
      'Non-assigned driver rejected with 403 Forbidden',
      nonParticipantDriverRes.status === 403,
      `Status: ${nonParticipantDriverRes.status}`
    );

    // Passenger 2 trying to rate Driver 1 on Ride 1
    const nonParticipantPassengerRes = await apiRequest(`/rides/${completedRide.id}/rate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenP2}` },
      body: { score: 5, comment: 'I was not the rider' },
    });
    record(
      'Non-assigned passenger rejected with 403 Forbidden',
      nonParticipantPassengerRes.status === 403,
      `Status: ${nonParticipantPassengerRes.status}`
    );

    // -------------------------------------------------------------
    // TEST 3: Score & Payload Validation (1-5 range, comment length)
    // -------------------------------------------------------------
    console.log('\n--- TEST 3: Payload Validation (Score 1-5, Comment MaxLength) ---');
    const scoreZeroRes = await apiRequest(`/rides/${completedRide.id}/rate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenP1}` },
      body: { score: 0 },
    });
    record(
      'Score < 1 rejected with 400 Bad Request',
      scoreZeroRes.status === 400,
      `Status: ${scoreZeroRes.status}`
    );

    const scoreSixRes = await apiRequest(`/rides/${completedRide.id}/rate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenP1}` },
      body: { score: 6 },
    });
    record(
      'Score > 5 rejected with 400 Bad Request',
      scoreSixRes.status === 400,
      `Status: ${scoreSixRes.status}`
    );

    const longCommentRes = await apiRequest(`/rides/${completedRide.id}/rate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenP1}` },
      body: { score: 5, comment: 'x'.repeat(501) },
    });
    record(
      'Comment > 500 characters rejected with 400 Bad Request',
      longCommentRes.status === 400,
      `Status: ${longCommentRes.status}`
    );

    // -------------------------------------------------------------
    // TEST 4: Legitimate Passenger Rating Submission & Driver Aggregation
    // -------------------------------------------------------------
    console.log('\n--- TEST 4: Passenger Rates Driver & Recalculates Driver Rating ---');
    const p1RateRes = await apiRequest(`/rides/${completedRide.id}/rate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenP1}` },
      body: { score: 5, comment: 'Smooth driving and polite driver!' },
    });
    record(
      'Passenger rates driver successfully (201 Created)',
      p1RateRes.status === 201,
      `Rating ID: ${p1RateRes.data?.id}`
    );

    const updatedDriver1 = await prisma.driver.findUnique({ where: { id: driver1.id } });
    record(
      'Driver aggregate rating updated in PostgreSQL',
      updatedDriver1?.rating === 5.0,
      `Driver.rating: ${updatedDriver1?.rating}`
    );

    // -------------------------------------------------------------
    // TEST 5: Legitimate Driver Rating Submission & Passenger Aggregation
    // -------------------------------------------------------------
    console.log('\n--- TEST 5: Driver Rates Passenger & Recalculates Passenger Rating ---');
    const d1RateRes = await apiRequest(`/rides/${completedRide.id}/rate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenD1}` },
      body: { score: 4, comment: 'Punctual and respectful passenger.' },
    });
    record(
      'Driver rates passenger successfully (201 Created)',
      d1RateRes.status === 201,
      `Rating ID: ${d1RateRes.data?.id}`
    );

    const updatedPassenger1 = await prisma.user.findUnique({ where: { id: passenger1.id } });
    record(
      'Passenger aggregate rating updated in PostgreSQL',
      updatedPassenger1?.rating === 4.0,
      `User.rating: ${updatedPassenger1?.rating}`
    );

    // -------------------------------------------------------------
    // TEST 6: Prevent Duplicate Ratings (One-Rating-Per-Completed-Ride)
    // -------------------------------------------------------------
    console.log('\n--- TEST 6: Prevent Duplicate Ratings ---');
    const duplicateP1Res = await apiRequest(`/rides/${completedRide.id}/rate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenP1}` },
      body: { score: 4, comment: 'Second attempt' },
    });
    record(
      'Passenger duplicate rating rejected with 409 Conflict',
      duplicateP1Res.status === 409,
      `Status: ${duplicateP1Res.status}, Error: ${duplicateP1Res.data?.message}`
    );

    const duplicateD1Res = await apiRequest(`/rides/${completedRide.id}/rate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenD1}` },
      body: { score: 5, comment: 'Second driver attempt' },
    });
    record(
      'Driver duplicate rating rejected with 409 Conflict',
      duplicateD1Res.status === 409,
      `Status: ${duplicateD1Res.status}, Error: ${duplicateD1Res.data?.message}`
    );

    // Database-level constraint check
    let dbUniqueFailed = false;
    try {
      await prisma.rating.create({
        data: {
          rideId: completedRide.id,
          fromUserId: passenger1.id,
          toUserId: driver1.id,
          fromRole: 'passenger',
          score: 3,
        },
      });
    } catch (dbErr) {
      dbUniqueFailed = true;
    }
    record(
      'PostgreSQL unique index ratings_rideId_fromUserId_key rejects duplicate INSERT',
      dbUniqueFailed,
      'Direct duplicate DB insert aborted by unique constraint'
    );

    // -------------------------------------------------------------
    // TEST 7: Ratings Retrieval & Profiles
    // -------------------------------------------------------------
    console.log('\n--- TEST 7: Ratings Retrieval & Cross-Role Access Control ---');
    const driverRatingsRes = await apiRequest('/drivers/me/ratings', {
      headers: { Authorization: `Bearer ${tokenD1}` },
    });
    record(
      'Driver can retrieve ratings breakdown & reviews',
      driverRatingsRes.status === 200 &&
        driverRatingsRes.data?.averageRating === 5.0 &&
        driverRatingsRes.data?.totalRatings === 1 &&
        driverRatingsRes.data?.reviews?.[0]?.stars === 5,
      `Avg: ${driverRatingsRes.data?.averageRating}, Reviews: ${driverRatingsRes.data?.reviews?.length}`
    );

    const passengerRatingsRes = await apiRequest('/passengers/me/ratings', {
      headers: { Authorization: `Bearer ${tokenP1}` },
    });
    record(
      'Passenger can retrieve ratings breakdown & reviews',
      passengerRatingsRes.status === 200 &&
        passengerRatingsRes.data?.averageRating === 4.0 &&
        passengerRatingsRes.data?.totalRatings === 1 &&
        passengerRatingsRes.data?.reviews?.[0]?.stars === 4,
      `Avg: ${passengerRatingsRes.data?.averageRating}, Reviews: ${passengerRatingsRes.data?.reviews?.length}`
    );

    // Cross-role protection
    const passengerAsDriverRatings = await apiRequest('/drivers/me/ratings', {
      headers: { Authorization: `Bearer ${tokenP1}` },
    });
    record(
      'Passenger accessing driver ratings returns 403 Forbidden',
      passengerAsDriverRatings.status === 403,
      `Status: ${passengerAsDriverRatings.status}`
    );

    const driverAsPassengerRatings = await apiRequest('/passengers/me/ratings', {
      headers: { Authorization: `Bearer ${tokenD1}` },
    });
    record(
      'Driver accessing passenger ratings returns 403 Forbidden',
      driverAsPassengerRatings.status === 403,
      `Status: ${driverAsPassengerRatings.status}`
    );

    // -------------------------------------------------------------
    // CLEANUP
    // -------------------------------------------------------------
    console.log('\n[Cleanup] Cleaning up test records...');
    await prisma.rating.deleteMany({
      where: { rideId: { in: [completedRide.id, ongoingRide.id] } },
    });
    await prisma.ride.deleteMany({
      where: { id: { in: [completedRide.id, ongoingRide.id] } },
    });
    await prisma.driver.deleteMany({
      where: { id: { in: [driver1.id, driver2.id] } },
    });
    await prisma.user.deleteMany({
      where: { id: { in: [passenger1.id, passenger2.id] } },
    });
    console.log('[Cleanup Complete]\n');

    // Final Summary
    console.log('================================================================');
    console.log('AUDIT SUMMARY');
    console.log('================================================================');
    const total = checklist.length;
    const passed = checklist.filter((c) => c.pass).length;
    console.log(`TOTAL CHECKS: ${total}`);
    console.log(`PASSED: ${passed}`);
    console.log(`FAILED: ${total - passed}`);
    if (total === passed) {
      console.log('\n>>> ALL PHASE 9 CRITERIA VERIFIED SUCCESSFULLY! <<<');
    } else {
      console.error('\n>>> SOME CRITERIA FAILED! Check logs above. <<<');
      process.exit(1);
    }
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runPhase9Audit();
