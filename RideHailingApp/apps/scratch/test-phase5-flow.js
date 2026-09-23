require("dns").setServers(["8.8.8.8", "1.1.1.1"]);
require("e:/code/codeinity-internship/RideHailingApp/apps/backend/node_modules/dotenv").config({ path: "e:/code/codeinity-internship/RideHailingApp/apps/backend/.env" });
const { PrismaClient } = require("e:/code/codeinity-internship/RideHailingApp/apps/backend/dist/generated/prisma/client");
const { PrismaPg } = require("e:/code/codeinity-internship/RideHailingApp/apps/backend/node_modules/@prisma/adapter-pg");


const API_BASE = "http://localhost:3000";

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  const res = await fetch(url, {
    method: options.method || "GET",
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

async function runPhase5Verification() {
  console.log("========================================================");
  console.log("PHASE 5 — REAL DRIVER MATCHING & RIDE OFFERS VERIFICATION");
  console.log("========================================================");

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });

  const testReport = {
    driverDiscovery: false,
    offersCreation: false,
    passengerOffersList: false,
    raceConditionProtection: false,
    competingOffersRejected: false,
    occupiedDriverExcluded: false,
    offerExpirationHandled: false,
    authorizationGuards: false,
    databasePersistence: false,
  };

  try {
    const ts = Date.now().toString().slice(-6);

    // Reset any previous drivers from older test runs to offline
    await prisma.driver.updateMany({ data: { isOnline: false } });

    // 1. Create Passenger
    const jwt = require("e:/code/codeinity-internship/RideHailingApp/apps/backend/node_modules/jsonwebtoken");

    function makeToken(sub, role) {
      return jwt.sign({ sub, role }, process.env.JWT_ACCESS_SECRET, { expiresIn: "1h" });
    }


    console.log("\n[1] Registering and authenticating Passenger...");
    const pPhone = `+141551${ts}`;
    const pEmail = `phase5_p_${ts}@example.com`;
    const regP = await request("/auth/register/passenger", {
      method: "POST",
      body: { name: "Phase5 Passenger", phone: pPhone, email: pEmail, password: "Password123!" },
    });
    if (!regP.ok) throw new Error(`Failed to register passenger: ${JSON.stringify(regP.data)}`);
    const passengerId = regP.data.id;
    const pToken = makeToken(passengerId, "passenger");
    console.log(`✓ Passenger created: ${passengerId}`);

    // 2. Create Driver 1 (Close: ~1.5 km away)
    console.log("\n[2] Setting up Driver 1 (Nearby - 1.5 km)...");
    const d1Phone = `+141552${ts}`;
    const d1Email = `phase5_d1_${ts}@example.com`;
    const regD1 = await request("/auth/register/driver", {
      method: "POST",
      body: { name: "Driver One (Nearby)", phone: d1Phone, email: d1Email, password: "Password123!" },
    });
    const d1Id = regD1.data.id;
    const d1Token = makeToken(d1Id, "driver");


    // Approve Driver 1 and set location near Market St (37.7749, -122.4194)
    // 37.7850, -122.4100 is ~1.4 km
    await prisma.driver.update({
      where: { id: d1Id },
      data: {
        verificationStatus: "approved",
        isOnline: true,
        currentLat: 37.7850,
        currentLng: -122.4100,
      },
    });
    // Create vehicle for Driver 1
    await prisma.vehicle.create({
      data: {
        driverId: d1Id,
        make: "Toyota",
        model: "Camry",
        color: "Silver",
        registrationNumber: `D1-${ts}`,
      },
    });
    console.log(`✓ Driver 1 approved, online, vehicle attached, at (37.7850, -122.4100)`);

    // 3. Create Driver 2 (Medium distance: ~5.5 km away)
    console.log("\n[3] Setting up Driver 2 (Medium - 5.5 km)...");
    const d2Phone = `+141553${ts}`;
    const d2Email = `phase5_d2_${ts}@example.com`;
    const regD2 = await request("/auth/register/driver", {
      method: "POST",
      body: { name: "Driver Two (Mid)", phone: d2Phone, email: d2Email, password: "Password123!" },
    });
    const d2Id = regD2.data.id;
    const d2Token = makeToken(d2Id, "driver");



    // 37.8100, -122.3800 is ~5.5 km
    await prisma.driver.update({
      where: { id: d2Id },
      data: {
        verificationStatus: "approved",
        isOnline: true,
        currentLat: 37.8100,
        currentLng: -122.3800,
      },
    });
    await prisma.vehicle.create({
      data: {
        driverId: d2Id,
        make: "Honda",
        model: "Accord",
        color: "Black",
        registrationNumber: `D2-${ts}`,
      },
    });
    console.log(`✓ Driver 2 approved, online, vehicle attached, at (37.8100, -122.3800)`);

    // 4. Create Driver 3 (Far / Ineligible: ~35 km away)
    console.log("\n[4] Setting up Driver 3 (Far - 35 km away)...");
    const d3Phone = `+141554${ts}`;
    const d3Email = `phase5_d3_${ts}@example.com`;
    const regD3 = await request("/auth/register/driver", {
      method: "POST",
      body: { name: "Driver Three (Far)", phone: d3Phone, email: d3Email, password: "Password123!" },
    });
    const d3Id = regD3.data.id;
    // Set 35 km away
    await prisma.driver.update({
      where: { id: d3Id },
      data: {
        verificationStatus: "approved",
        isOnline: true,
        currentLat: 37.5000,
        currentLng: -122.2000,
      },
    });
    console.log(`✓ Driver 3 approved & online, but 35 km away (exceeds 10 km limit)`);

    // 5. Passenger Creates Ride 1
    console.log("\n[5] Passenger creating Ride 1...");
    const ridePayload = {
      pickupLat: 37.7749,
      pickupLng: -122.4194,
      pickupAddress: "1450 Market St, San Francisco, CA",
      dropoffLat: 37.8080,
      dropoffLng: -122.4177,
      dropoffAddress: "Pier 39, Fisherman's Wharf, San Francisco, CA",
      distanceKm: 4.8,
      etaMinutes: 14,
      proposedFare: 18.50,
    };


    const createRideRes = await request("/rides", {
      method: "POST",
      headers: { Authorization: `Bearer ${pToken}` },
      body: ridePayload,
    });
    if (!createRideRes.ok) throw new Error(`Failed to create ride: ${JSON.stringify(createRideRes.data)}`);
    const rideId = createRideRes.data.id;
    console.log(`✓ Ride 1 created with ID: ${rideId}, status: ${createRideRes.data.status}`);

    // 6. Verify Offers Generated via MatchingService
    console.log("\n[6] Checking RideOffers generated for Ride 1 in Database...");
    const dbOffers = await prisma.rideOffer.findMany({
      where: { rideId },
      include: { driver: true },
    });
    console.log(`✓ Total RideOffers generated: ${dbOffers.length}`);
    const matchedDriverIds = dbOffers.map((o) => o.driverId);
    console.log(`  Matched Driver IDs: ${matchedDriverIds.join(", ")}`);

    const hasDriver1 = matchedDriverIds.includes(d1Id);
    const hasDriver2 = matchedDriverIds.includes(d2Id);
    const hasDriver3 = matchedDriverIds.includes(d3Id);

    if (hasDriver1 && hasDriver2 && !hasDriver3) {
      console.log("✓ SUCCESS: Eligible nearby Driver 1 & Driver 2 matched; Far Driver 3 excluded!");
      testReport.driverDiscovery = true;
      testReport.offersCreation = true;
    } else {
      console.error(`✗ Discovery mismatch: D1=${hasDriver1}, D2=${hasDriver2}, D3=${hasDriver3}`);
    }

    // 7. Verify Passenger gets offers via GET /rides/:id/offers
    console.log("\n[7] Passenger fetching offers via GET /rides/:id/offers...");
    const pOffersRes = await request(`/rides/${rideId}/offers`, {
      headers: { Authorization: `Bearer ${pToken}` },
    });
    console.log(`✓ Passenger received ${pOffersRes.data.length} offers via API`);
    if (pOffersRes.ok && pOffersRes.data.length === 2) {
      const off1 = pOffersRes.data.find((o) => o.driverId === d1Id);
      const off2 = pOffersRes.data.find((o) => o.driverId === d2Id);
      console.log(`  Driver 1 Offer: ${off1.driverName}, Fare: $${off1.offeredFare}, Dist: ${off1.distanceKm.toFixed(1)} km, ETA: ${off1.estimatedArrivalMinutes} min`);
      console.log(`  Driver 2 Offer: ${off2.driverName}, Fare: $${off2.offeredFare}, Dist: ${off2.distanceKm.toFixed(1)} km, ETA: ${off2.estimatedArrivalMinutes} min`);
      testReport.passengerOffersList = true;
    }

    // 8. Test Parallel Race Condition: Driver 1 and Driver 2 accept concurrently
    console.log("\n[8] Testing Race Condition: Driver 1 and Driver 2 accept concurrently...");
    const [resD1Accept, resD2Accept] = await Promise.all([
      request(`/rides/${rideId}/status`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${d1Token}` },
        body: { status: "accepted" },
      }),
      request(`/rides/${rideId}/status`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${d2Token}` },
        body: { status: "accepted" },
      }),
    ]);

    console.log(`  Driver 1 response status: ${resD1Accept.status}`);
    console.log(`  Driver 2 response status: ${resD2Accept.status}`);

    const winner = resD1Accept.status === 200 ? "Driver 1" : resD2Accept.status === 200 ? "Driver 2" : null;
    const loserStatus = resD1Accept.status === 200 ? resD2Accept.status : resD1Accept.status;

    if (winner && loserStatus === 409) {
      console.log(`✓ RACE CONDITION SHIELD VERIFIED: ${winner} won (200 OK), competing driver blocked with (409 Conflict)`);
      testReport.raceConditionProtection = true;
    } else {
      console.error(`✗ Race condition failure: D1=${resD1Accept.status}, D2=${resD2Accept.status}`);
    }

    // 9. Verify Database State post-assignment
    console.log("\n[9] Verifying PostgreSQL atomic state...");
    const assignedRide = await prisma.ride.findUnique({
      where: { id: rideId },
      include: { driver: true, offers: true },
    });
    console.log(`✓ Ride Status: ${assignedRide.status}`);
    console.log(`✓ Assigned Driver: ${assignedRide.driver.name} (${assignedRide.driverId})`);
    console.log(`✓ Final Fare: $${assignedRide.finalFare}`);

    const winningOffer = assignedRide.offers.find((o) => o.driverId === assignedRide.driverId);
    const rejectedOffers = assignedRide.offers.filter((o) => o.driverId !== assignedRide.driverId);

    console.log(`✓ Winning Offer Status: ${winningOffer?.status}`);
    console.log(`✓ Competing Offers Status: ${rejectedOffers.map((o) => o.status).join(", ")}`);

    if (assignedRide.status === "accepted" && winningOffer?.status === "accepted" && rejectedOffers.every((o) => o.status === "rejected")) {
      console.log("✓ PostgreSQL verification passed: atomic assignment and competing offers rejected!");
      testReport.competingOffersRejected = true;
      testReport.databasePersistence = true;
    }

    // 10. Test Occupied Driver Exclusion
    console.log("\n[10] Testing Occupied Driver Exclusion with Ride 2...");
    console.log(`  (Winning driver is currently busy with accepted Ride 1)`);
    const ride2Res = await request("/rides", {
      method: "POST",
      headers: { Authorization: `Bearer ${pToken}` },
      body: {
        ...ridePayload,
        proposedFare: 22.00,
      },
    });
    const ride2Id = ride2Res.data.id;
    const ride2Offers = await prisma.rideOffer.findMany({
      where: { rideId: ride2Id },
    });
    const ride2MatchedDriverIds = ride2Offers.map((o) => o.driverId);
    console.log(`  Ride 2 matched drivers: ${ride2MatchedDriverIds.join(", ")}`);

    if (!ride2MatchedDriverIds.includes(assignedRide.driverId)) {
      console.log(`✓ SUCCESS: Occupied driver (${assignedRide.driver.name}) was correctly excluded from Ride 2!`);
      testReport.occupiedDriverExcluded = true;
    } else {
      console.error(`✗ FAILED: Occupied driver was matched to Ride 2!`);
    }

    // 11. Test Expired Offer Handling
    console.log("\n[11] Testing Expired Offer Protection...");
    // Create an expired offer for Driver 3
    const expiredOffer = await prisma.rideOffer.create({
      data: {
        rideId: ride2Id,
        driverId: d3Id,
        offerType: "accept",
        offerAmount: 22.00,
        status: "pending",
        expiresAt: new Date(Date.now() - 60000), // 1 minute in the past
      },
    });

    const acceptExpiredRes = await request(`/rides/${ride2Id}/offers/${expiredOffer.id}/accept`, {
      method: "POST",
      headers: { Authorization: `Bearer ${pToken}` },
    });
    console.log(`  Accept expired offer response: ${acceptExpiredRes.status} (${JSON.stringify(acceptExpiredRes.data)})`);
    if (acceptExpiredRes.status === 400) {
      console.log("✓ SUCCESS: Expired offer was rejected with HTTP 400!");
      const recheckedOffer = await prisma.rideOffer.findUnique({ where: { id: expiredOffer.id } });
      console.log(`✓ Offer status in DB updated to: ${recheckedOffer.status}`);
      if (recheckedOffer.status === "expired") {
        testReport.offerExpirationHandled = true;
      }
    }

    // 12. Test Security & Authorization
    console.log("\n[12] Testing Authorization and Role Guards...");
    const pForbiddenRes = await request("/rides/available", {
      headers: { Authorization: `Bearer ${pToken}` },
    });
    console.log(`  Passenger requesting driver endpoint /rides/available: ${pForbiddenRes.status}`);

    const crossPassengerReg = await request("/auth/register/passenger", {
      method: "POST",
      body: { name: "Other Passenger", phone: `+141559${ts}`, email: `other_${ts}@example.com`, password: "Password123!" },
    });
    const otherPToken = makeToken(crossPassengerReg.data.id, "passenger");


    const crossOffersRes = await request(`/rides/${rideId}/offers`, {
      headers: { Authorization: `Bearer ${otherPToken}` },
    });
    console.log(`  Cross-passenger accessing ride offers: ${crossOffersRes.status}`);

    if (pForbiddenRes.status === 403 && crossOffersRes.status === 403) {
      console.log("✓ SUCCESS: Cross-role and cross-user authorization guards working!");
      testReport.authorizationGuards = true;
    }

    console.log("\n========================================================");
    console.log("FINAL PHASE 5 VERIFICATION RESULTS:");
    console.log("========================================================");
    for (const [k, v] of Object.entries(testReport)) {
      console.log(`  ${v ? "✓ PASS" : "✗ FAIL"}: ${k}`);
    }

    const allPassed = Object.values(testReport).every(Boolean);
    console.log(`\nOVERALL STATUS: ${allPassed ? "READY (ALL CHECKS PASSED)" : "INCOMPLETE"}`);
    return allPassed;
  } catch (err) {
    console.error("\nVerification error:", err);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

runPhase5Verification().then((success) => {
  process.exit(success ? 0 : 1);
});
