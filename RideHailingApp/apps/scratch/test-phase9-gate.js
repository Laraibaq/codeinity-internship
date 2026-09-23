require("dns").setServers(["8.8.8.8", "1.1.1.1"]);
require("e:/code/codeinity-internship/RideHailingApp/apps/backend/node_modules/dotenv").config({
  path: "e:/code/codeinity-internship/RideHailingApp/apps/backend/.env",
});
const { PrismaClient } = require("e:/code/codeinity-internship/RideHailingApp/apps/backend/dist/generated/prisma/client");
const { PrismaPg } = require("e:/code/codeinity-internship/RideHailingApp/apps/backend/node_modules/@prisma/adapter-pg");
const jwt = require("e:/code/codeinity-internship/RideHailingApp/apps/backend/node_modules/jsonwebtoken");
const { Client } = require("e:/code/codeinity-internship/RideHailingApp/apps/backend/node_modules/pg");

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

async function runGateVerification() {
  console.log('================================================================');
  console.log('PHASE 9 — FINAL VERIFICATION GATE SUITE');
  console.log('================================================================\n');

  const testId = Date.now().toString().slice(-6);
  const gateReport = {};

  try {
    // -------------------------------------------------------------------------
    // 1. Direct PostgreSQL Index Verification (Section 2)
    // -------------------------------------------------------------------------
    console.log('[Gate 1] Direct PostgreSQL Constraint & Index Inspection...');
    const pgClient = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
    await pgClient.connect();

    const indexRes = await pgClient.query(`
      SELECT indexname, indexdef 
      FROM pg_indexes 
      WHERE tablename = 'ratings';
    `);
    console.log('Ratings table indexes in PostgreSQL:');
    indexRes.rows.forEach(r => console.log(` - ${r.indexname}: ${r.indexdef}`));

    const targetIndex = indexRes.rows.find(r => r.indexname === 'ratings_rideId_fromUserId_key');
    gateReport.uniqueIndexPresent = !!targetIndex && targetIndex.indexdef.includes('UNIQUE');
    console.log(`Unique index "ratings_rideId_fromUserId_key" verified: ${gateReport.uniqueIndexPresent}\n`);
    await pgClient.end();

    // -------------------------------------------------------------------------
    // Setup Test Actors
    // -------------------------------------------------------------------------
    console.log('[Setup] Creating test actors...');
    const pA = await prisma.user.create({
      data: { name: `Pass A ${testId}`, phone: `+19991${testId}`, passwordHash: 'hash', phoneVerified: true }
    });
    const tokenPA = generateToken({ sub: pA.id, role: 'passenger' });

    const pB = await prisma.user.create({
      data: { name: `Pass B ${testId}`, phone: `+19992${testId}`, passwordHash: 'hash', phoneVerified: true }
    });
    const tokenPB = generateToken({ sub: pB.id, role: 'passenger' });

    const dA = await prisma.driver.create({
      data: { name: `Driver A ${testId}`, phone: `+19993${testId}`, passwordHash: 'hash', phoneVerified: true, verificationStatus: 'approved' }
    });
    const tokenDA = generateToken({ sub: dA.id, role: 'driver' });

    const dB = await prisma.driver.create({
      data: { name: `Driver B ${testId}`, phone: `+19994${testId}`, passwordHash: 'hash', phoneVerified: true, verificationStatus: 'approved' }
    });
    const tokenDB = generateToken({ sub: dB.id, role: 'driver' });

    // Completed Ride between Passenger A and Driver A
    const rideCompleted = await prisma.ride.create({
      data: {
        passengerId: pA.id,
        driverId: dA.id,
        pickupLat: 31.5, pickupLng: 74.3, pickupAddress: 'A',
        dropoffLat: 31.6, dropoffLng: 74.4, dropoffAddress: 'B',
        distanceKm: 5, etaMinutes: 10, proposedFare: 20, aiRecommendedFare: 20,
        status: 'completed', completedAt: new Date()
      }
    });

    // -------------------------------------------------------------------------
    // 2. Self-Rating Test (Section 5)
    // -------------------------------------------------------------------------
    console.log('[Gate 2] Testing Self-Rating Prevention...');
    // Create a User with the same UUID as driver dA to test self-rating
    const pSameAsD = await prisma.user.create({
      data: {
        id: dA.id,
        name: `Self User ${testId}`,
        phone: `+19999${testId}`,
        passwordHash: 'hash',
        phoneVerified: true
      }
    });
    const tokenSelfPassenger = generateToken({ sub: dA.id, role: 'passenger' });
    const tokenSelfDriver = generateToken({ sub: dA.id, role: 'driver' });

    // Self-ride where driverId === passengerId === dA.id
    const selfRide = await prisma.ride.create({
      data: {
        passengerId: dA.id,
        driverId: dA.id,
        pickupLat: 31.5, pickupLng: 74.3, pickupAddress: 'A',
        dropoffLat: 31.6, dropoffLng: 74.4, dropoffAddress: 'B',
        distanceKm: 5, etaMinutes: 10, proposedFare: 20, aiRecommendedFare: 20,
        status: 'completed', completedAt: new Date()
      }
    });

    const selfRateResPassenger = await apiRequest(`/rides/${selfRide.id}/rate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenSelfPassenger}` },
      body: { score: 5, comment: 'Passenger rating myself' }
    });
    console.log(`Self-rating (passenger) response: HTTP ${selfRateResPassenger.status} (${JSON.stringify(selfRateResPassenger.data)})`);

    const selfRateResDriver = await apiRequest(`/rides/${selfRide.id}/rate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenSelfDriver}` },
      body: { score: 5, comment: 'Driver rating myself' }
    });
    console.log(`Self-rating (driver) response: HTTP ${selfRateResDriver.status} (${JSON.stringify(selfRateResDriver.data)})`);

    gateReport.selfRatingRejected = selfRateResPassenger.status === 400 && selfRateResDriver.status === 400;

    await prisma.ride.delete({ where: { id: selfRide.id } });
    await prisma.user.delete({ where: { id: pSameAsD.id } });

    // -------------------------------------------------------------------------
    // 3. Both Directions Test (Section 6)
    // -------------------------------------------------------------------------
    console.log('\n[Gate 3] Testing Both Directions (Passenger -> Driver & Driver -> Passenger)...');
    const pToDRes = await apiRequest(`/rides/${rideCompleted.id}/rate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenPA}` },
      body: { score: 5, comment: 'Great driver!' }
    });
    console.log(`Passenger -> Driver response: ${pToDRes.status} (ID: ${pToDRes.data?.id})`);

    const dToPRes = await apiRequest(`/rides/${rideCompleted.id}/rate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenDA}` },
      body: { score: 4, comment: 'Good passenger.' }
    });
    console.log(`Driver -> Passenger response: ${dToPRes.status} (ID: ${dToPRes.data?.id})`);

    const rideRatings = await prisma.rating.findMany({ where: { rideId: rideCompleted.id } });
    console.log(`Database count of ratings for ride ${rideCompleted.id}: ${rideRatings.length}`);
    gateReport.bothDirectionsCount = rideRatings.length;

    // -------------------------------------------------------------------------
    // 4. Sequential Duplicate Rating Test (Section 7)
    // -------------------------------------------------------------------------
    console.log('\n[Gate 4] Testing Sequential Duplicate Rating...');
    const duplicateSeqRes = await apiRequest(`/rides/${rideCompleted.id}/rate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenPA}` },
      body: { score: 5, comment: 'Second rating attempt' }
    });
    console.log(`Duplicate rating attempt status: ${duplicateSeqRes.status} (Body: ${JSON.stringify(duplicateSeqRes.data)})`);
    gateReport.sequentialDuplicateStatus = duplicateSeqRes.status;

    const pARatingsCount = await prisma.rating.count({
      where: { rideId: rideCompleted.id, fromUserId: pA.id }
    });
    console.log(`Database count for (rideId, fromUserId=pA): ${pARatingsCount}`);
    gateReport.pARatingsCount = pARatingsCount;

    // -------------------------------------------------------------------------
    // 5. Concurrent Duplicate Rating Test (Section 8)
    // -------------------------------------------------------------------------
    console.log('\n[Gate 5] Testing Concurrent Duplicate Rating...');
    const rideConcurrent = await prisma.ride.create({
      data: {
        passengerId: pB.id,
        driverId: dB.id,
        pickupLat: 31.5, pickupLng: 74.3, pickupAddress: 'A',
        dropoffLat: 31.6, dropoffLng: 74.4, dropoffAddress: 'B',
        distanceKm: 5, etaMinutes: 10, proposedFare: 20, aiRecommendedFare: 20,
        status: 'completed', completedAt: new Date()
      }
    });

    const [raceRes1, raceRes2] = await Promise.all([
      apiRequest(`/rides/${rideConcurrent.id}/rate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenPB}` },
        body: { score: 5, comment: 'Concurrent 1' }
      }),
      apiRequest(`/rides/${rideConcurrent.id}/rate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenPB}` },
        body: { score: 5, comment: 'Concurrent 2' }
      })
    ]);

    console.log(`Concurrent Request 1 status: ${raceRes1.status}`);
    console.log(`Concurrent Request 2 status: ${raceRes2.status}`);
    const concurrentStatuses = [raceRes1.status, raceRes2.status].sort();
    const concurrentRacePass = concurrentStatuses[0] === 201 && concurrentStatuses[1] === 409;
    console.log(`Concurrent race: exactly one 201 and one 409: ${concurrentRacePass}`);

    const concurrentDbCount = await prisma.rating.count({
      where: { rideId: rideConcurrent.id, fromUserId: pB.id }
    });
    console.log(`Database count for concurrent ride: ${concurrentDbCount}`);
    gateReport.concurrentRacePass = concurrentRacePass && concurrentDbCount === 1;

    // -------------------------------------------------------------------------
    // 6. Non-Completed Rides Test (Section 9)
    // -------------------------------------------------------------------------
    console.log('\n[Gate 6] Testing All Non-Completed Ride Statuses...');
    const statusesToTest = ['requested', 'offered', 'accepted', 'ongoing', 'cancelled', 'completed'];
    const statusResults = {};

    for (const st of statusesToTest) {
      const testRide = await prisma.ride.create({
        data: {
          passengerId: pA.id,
          driverId: dA.id,
          pickupLat: 31.5, pickupLng: 74.3, pickupAddress: 'A',
          dropoffLat: 31.6, dropoffLng: 74.4, dropoffAddress: 'B',
          distanceKm: 5, etaMinutes: 10, proposedFare: 20, aiRecommendedFare: 20,
          status: st
        }
      });
      const res = await apiRequest(`/rides/${testRide.id}/rate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenPA}` },
        body: { score: 5 }
      });
      statusResults[st] = res.status;
      console.log(` - Status "${st}": HTTP ${res.status}`);
      await prisma.rating.deleteMany({ where: { rideId: testRide.id } });
      await prisma.ride.delete({ where: { id: testRide.id } });
    }
    gateReport.statusResults = statusResults;

    // -------------------------------------------------------------------------
    // 7. Cross-User Access Test (Section 10)
    // -------------------------------------------------------------------------
    console.log('\n[Gate 7] Testing Cross-User Access & Role Restrictions...');
    // Passenger B attempts to rate Passenger A's ride
    const crossPassRes = await apiRequest(`/rides/${rideCompleted.id}/rate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenPB}` },
      body: { score: 5 }
    });
    console.log(`Passenger B rating Passenger A's ride: HTTP ${crossPassRes.status}`);

    // Driver B attempts to rate Driver A's ride
    const crossDriverRes = await apiRequest(`/rides/${rideCompleted.id}/rate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenDB}` },
      body: { score: 5 }
    });
    console.log(`Driver B rating Driver A's ride: HTTP ${crossDriverRes.status}`);

    // Passenger attempts driver-only ratings
    const passAsDriverRatingsRes = await apiRequest('/drivers/me/ratings', {
      headers: { Authorization: `Bearer ${tokenPA}` }
    });
    console.log(`Passenger accessing /drivers/me/ratings: HTTP ${passAsDriverRatingsRes.status}`);

    // Driver attempts passenger-only ratings
    const driverAsPassRatingsRes = await apiRequest('/passengers/me/ratings', {
      headers: { Authorization: `Bearer ${tokenDA}` }
    });
    console.log(`Driver accessing /passengers/me/ratings: HTTP ${driverAsPassRatingsRes.status}`);

    gateReport.crossUserPass = crossPassRes.status === 403 &&
      crossDriverRes.status === 403 &&
      passAsDriverRatingsRes.status === 403 &&
      driverAsPassRatingsRes.status === 403;

    // -------------------------------------------------------------------------
    // 8. Score Validation Test (Section 11)
    // -------------------------------------------------------------------------
    console.log('\n[Gate 8] Testing Score Validation...');
    const invalidScores = [0, -1, 6, 100, 1.5, null, "five"];
    const invalidScoreStatuses = [];
    for (const sc of invalidScores) {
      const r = await prisma.ride.create({
        data: {
          passengerId: pA.id, driverId: dA.id,
          pickupLat: 31.5, pickupLng: 74.3, pickupAddress: 'A',
          dropoffLat: 31.6, dropoffLng: 74.4, dropoffAddress: 'B',
          distanceKm: 5, etaMinutes: 10, proposedFare: 20, aiRecommendedFare: 20,
          status: 'completed', completedAt: new Date()
        }
      });
      const res = await apiRequest(`/rides/${r.id}/rate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenPA}` },
        body: { score: sc }
      });
      invalidScoreStatuses.push({ score: sc, status: res.status });
      await prisma.ride.delete({ where: { id: r.id } });
    }
    console.log('Invalid scores rejections:', invalidScoreStatuses);
    gateReport.allInvalidScoresRejected = invalidScoreStatuses.every(s => s.status === 400);

    // Valid scores 1, 2, 3, 4, 5
    const validScores = [1, 2, 3, 4, 5];
    const validScoreStatuses = [];
    for (const sc of validScores) {
      const r = await prisma.ride.create({
        data: {
          passengerId: pA.id, driverId: dA.id,
          pickupLat: 31.5, pickupLng: 74.3, pickupAddress: 'A',
          dropoffLat: 31.6, dropoffLng: 74.4, dropoffAddress: 'B',
          distanceKm: 5, etaMinutes: 10, proposedFare: 20, aiRecommendedFare: 20,
          status: 'completed', completedAt: new Date()
        }
      });
      const res = await apiRequest(`/rides/${r.id}/rate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenPA}` },
        body: { score: sc }
      });
      validScoreStatuses.push({ score: sc, status: res.status });
      await prisma.rating.deleteMany({ where: { rideId: r.id } });
      await prisma.ride.delete({ where: { id: r.id } });
    }
    console.log('Valid scores acceptance:', validScoreStatuses);
    gateReport.allValidScoresAccepted = validScoreStatuses.every(s => s.status === 201);

    // -------------------------------------------------------------------------
    // 9. Review Validation Test (Section 12)
    // -------------------------------------------------------------------------
    console.log('\n[Gate 9] Testing Review Length Validation...');
    const commentsToTest = [
      { name: 'empty string', val: '', expect: 201 },
      { name: 'whitespace', val: '   ', expect: 201 },
      { name: '500 chars', val: 'a'.repeat(500), expect: 201 },
      { name: '501 chars', val: 'a'.repeat(501), expect: 400 }
    ];
    const commentStatuses = [];
    for (const c of commentsToTest) {
      const r = await prisma.ride.create({
        data: {
          passengerId: pA.id, driverId: dA.id,
          pickupLat: 31.5, pickupLng: 74.3, pickupAddress: 'A',
          dropoffLat: 31.6, dropoffLng: 74.4, dropoffAddress: 'B',
          distanceKm: 5, etaMinutes: 10, proposedFare: 20, aiRecommendedFare: 20,
          status: 'completed', completedAt: new Date()
        }
      });
      const res = await apiRequest(`/rides/${r.id}/rate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenPA}` },
        body: { score: 5, comment: c.val }
      });
      commentStatuses.push({ name: c.name, status: res.status, expected: c.expect, pass: res.status === c.expect });
      await prisma.rating.deleteMany({ where: { rideId: r.id } });
      await prisma.ride.delete({ where: { id: r.id } });
    }
    console.log('Comment validation results:', commentStatuses);
    gateReport.commentValidationPass = commentStatuses.every(c => c.pass);

    // -------------------------------------------------------------------------
    // 10. Aggregate Rating Verification (Section 13 & 14)
    // -------------------------------------------------------------------------
    console.log('\n[Gate 10] Testing Mathematical Aggregate Rating Calculation & Atomicity...');
    // Create dedicated driver dCalc and passenger pCalc
    const dCalc = await prisma.driver.create({
      data: { name: `Driver Calc ${testId}`, phone: `+19997${testId}`, passwordHash: 'hash', phoneVerified: true, verificationStatus: 'approved', rating: null }
    });
    const pCalc = await prisma.user.create({
      data: { name: `Pass Calc ${testId}`, phone: `+19998${testId}`, passwordHash: 'hash', phoneVerified: true }
    });
    const tokenPCalc = generateToken({ sub: pCalc.id, role: 'passenger' });

    // We will submit ratings: 5, 4, 3 (Expected average: (5+4+3)/3 = 4.00)
    const scoresStep1 = [5, 4, 3];
    for (const s of scoresStep1) {
      const r = await prisma.ride.create({
        data: {
          passengerId: pCalc.id, driverId: dCalc.id,
          pickupLat: 31.5, pickupLng: 74.3, pickupAddress: 'A',
          dropoffLat: 31.6, dropoffLng: 74.4, dropoffAddress: 'B',
          distanceKm: 5, etaMinutes: 10, proposedFare: 20, aiRecommendedFare: 20,
          status: 'completed', completedAt: new Date()
        }
      });
      await apiRequest(`/rides/${r.id}/rate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenPCalc}` },
        body: { score: s }
      });
    }

    const dCalcStep1 = await prisma.driver.findUnique({ where: { id: dCalc.id } });
    console.log(`Driver rating after [5, 4, 3]: Stored DB Value = ${dCalcStep1.rating} (Expected 4.00)`);
    const step1Correct = Math.abs(dCalcStep1.rating - 4.0) < 0.01;

    // Now attempt a rejected duplicate rating on one of the rides
    const existingRideForCalc = await prisma.ride.findFirst({ where: { driverId: dCalc.id, passengerId: pCalc.id } });
    const failedDupRes = await apiRequest(`/rides/${existingRideForCalc.id}/rate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenPCalc}` },
      body: { score: 1 } // Trying to inject 1 star
    });
    console.log(`Failed duplicate attempt returned: ${failedDupRes.status}`);
    const dCalcAfterFailedDup = await prisma.driver.findUnique({ where: { id: dCalc.id } });
    console.log(`Driver rating after failed duplicate: Stored DB Value = ${dCalcAfterFailedDup.rating} (Must remain 4.00)`);
    const atomicityUnchanged = Math.abs(dCalcAfterFailedDup.rating - 4.0) < 0.01;

    // Now submit a 4th rating with score 5 (Expected average: (5+4+3+5)/4 = 17/4 = 4.25)
    const r4 = await prisma.ride.create({
      data: {
        passengerId: pCalc.id, driverId: dCalc.id,
        pickupLat: 31.5, pickupLng: 74.3, pickupAddress: 'A',
        dropoffLat: 31.6, dropoffLng: 74.4, dropoffAddress: 'B',
        distanceKm: 5, etaMinutes: 10, proposedFare: 20, aiRecommendedFare: 20,
        status: 'completed', completedAt: new Date()
      }
    });
    await apiRequest(`/rides/${r4.id}/rate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenPCalc}` },
      body: { score: 5 }
    });

    const dCalcStep2 = await prisma.driver.findUnique({ where: { id: dCalc.id } });
    console.log(`Driver rating after adding 5: Stored DB Value = ${dCalcStep2.rating} (Expected 4.25)`);
    const step2Correct = Math.abs(dCalcStep2.rating - 4.25) < 0.01;

    gateReport.aggregateVerification = {
      step1: { expected: 4.00, actual: dCalcStep1.rating, pass: step1Correct },
      atomicityShield: { expected: 4.00, actual: dCalcAfterFailedDup.rating, pass: atomicityUnchanged },
      step2: { expected: 4.25, actual: dCalcStep2.rating, pass: step2Correct }
    };

    // -------------------------------------------------------------------------
    // Cleanup
    // -------------------------------------------------------------------------
    console.log('\n[Cleanup] Cleaning up test gate data...');
    const userIds = [pA.id, pB.id, pCalc.id];
    const driverIds = [dA.id, dB.id, dCalc.id];

    await prisma.rating.deleteMany({
      where: {
        OR: [
          { fromUserId: { in: [...userIds, ...driverIds] } },
          { toUserId: { in: [...userIds, ...driverIds] } }
        ]
      }
    });
    await prisma.ride.deleteMany({
      where: {
        OR: [
          { passengerId: { in: userIds } },
          { driverId: { in: driverIds } }
        ]
      }
    });
    await prisma.driver.deleteMany({ where: { id: { in: driverIds } } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    console.log('[Cleanup Complete]\n');

    console.log('================================================================');
    console.log('GATE AUDIT JSON SUMMARY:');
    console.log(JSON.stringify(gateReport, null, 2));
    console.log('================================================================');

  } catch (err) {
    console.error('Error during gate verification:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runGateVerification();
