require("dns").setServers(["8.8.8.8", "1.1.1.1"]);
require("e:/code/codeinity-internship/RideHailingApp/apps/backend/node_modules/dotenv").config({
  path: "e:/code/codeinity-internship/RideHailingApp/apps/backend/.env",
});
const { PrismaClient } = require("e:/code/codeinity-internship/RideHailingApp/apps/backend/dist/generated/prisma/client");
const { PrismaPg } = require("e:/code/codeinity-internship/RideHailingApp/apps/backend/node_modules/@prisma/adapter-pg");
const { io } = require("e:/code/codeinity-internship/RideHailingApp/apps/mobile/node_modules/socket.io-client");
const jwt = require("e:/code/codeinity-internship/RideHailingApp/apps/backend/node_modules/jsonwebtoken");

const API_BASE = "http://localhost:3000";

function makeToken(sub, role) {
  return jwt.sign({ sub, role }, process.env.JWT_ACCESS_SECRET, { expiresIn: "1h" });
}

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

function connectSocket(token, extraOpts = {}) {
  return io(API_BASE, {
    auth: token ? { token } : {},
    extraHeaders: token ? { authorization: `Bearer ${token}` } : {},
    transports: ["websocket", "polling"],
    reconnection: false,
    timeout: 5000,
    ...extraOpts,
  });
}

function waitForEvent(socket, eventName, timeoutMs = 40000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timeout waiting for event "${eventName}" after ${timeoutMs}ms`));
    }, timeoutMs);

    socket.once(eventName, (data) => {
      clearTimeout(timer);
      resolve(data);
    });
  });
}

async function runPhase6RealtimeVerification() {
  console.log("================================================================");
  console.log("PHASE 6 — SOCKET.IO REALTIME RIDE & OFFER VERIFICATION");
  console.log("================================================================");

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });

  const testResults = {
    unauthenticatedRejected: false,
    invalidTokenRejected: false,
    authenticatedConnection: false,
    userRoomJoinEnforced: false,
    driverRoomJoinEnforced: false,
    rideRoomJoinEnforced: false,
    liveOfferCreatedDelivered: false,
    liveRideAcceptedDelivered: false,
    liveOfferUpdatedDelivered: false,
    stateReconciliationConsistent: false,
    reconnectResilience: false,
  };

  const openSockets = [];

  try {
    const ts = Date.now().toString().slice(-6);

    // -------------------------------------------------------------
    // Test 1: Unauthenticated Socket connection is rejected
    // -------------------------------------------------------------
    console.log("\n[Test 1] Verifying unauthenticated connection rejection...");
    await new Promise((resolve) => {
      const unauthSocket = connectSocket(null);
      let errorReceived = false;

      unauthSocket.on("error", (err) => {
        errorReceived = true;
      });

      unauthSocket.on("disconnect", () => {
        if (errorReceived) {
          testResults.unauthenticatedRejected = true;
          console.log("✓ Unauthenticated socket was correctly rejected and disconnected");
        }
        resolve();
      });

      setTimeout(() => {
        if (!testResults.unauthenticatedRejected) {
          unauthSocket.disconnect();
          resolve();
        }
      }, 3000);
    });

    // -------------------------------------------------------------
    // Test 2: Invalid/tampered token is rejected
    // -------------------------------------------------------------
    console.log("\n[Test 2] Verifying invalid/tampered token rejection...");
    await new Promise((resolve) => {
      const badSocket = connectSocket("invalid.token.payload");
      let errorReceived = false;

      badSocket.on("error", () => {
        errorReceived = true;
      });

      badSocket.on("disconnect", () => {
        if (errorReceived) {
          testResults.invalidTokenRejected = true;
          console.log("✓ Invalid token socket was correctly rejected and disconnected");
        }
        resolve();
      });

      setTimeout(() => {
        if (!testResults.invalidTokenRejected) {
          badSocket.disconnect();
          resolve();
        }
      }, 3000);
    });

    // -------------------------------------------------------------
    // Test 3: Set up test entities (Passenger + 2 Drivers)
    // -------------------------------------------------------------
    console.log("\n[Setup] Creating test passenger and drivers...");
    await prisma.driver.updateMany({ data: { isOnline: false } });

    // Passenger
    const pPhone = `+141561${ts}`;
    const pEmail = `p6_passenger_${ts}@example.com`;
    const regP = await request("/auth/register/passenger", {
      method: "POST",
      body: { name: "Phase6 Passenger", phone: pPhone, email: pEmail, password: "Password123!" },
    });
    if (!regP.ok) throw new Error(`Failed to create passenger: ${JSON.stringify(regP.data)}`);
    const passengerId = regP.data.id;
    const passengerToken = makeToken(passengerId, "passenger");
    console.log(`✓ Passenger created: ${passengerId}`);

    // Driver 1 (Nearby: ~1.2 km away)
    const d1Phone = `+141562${ts}`;
    const d1Email = `p6_driver1_${ts}@example.com`;
    const regD1 = await request("/auth/register/driver", {
      method: "POST",
      body: { name: "Phase6 Driver One", phone: d1Phone, email: d1Email, password: "Password123!" },
    });
    if (!regD1.ok) throw new Error(`Failed to create driver 1: ${JSON.stringify(regD1.data)}`);
    const driver1Id = regD1.data.id;
    const driver1Token = makeToken(driver1Id, "driver");

    await prisma.driver.update({
      where: { id: driver1Id },
      data: {
        verificationStatus: "approved",
        isOnline: true,
        currentLat: 37.7858,
        currentLng: -122.4064,
        rating: 4.95,
      },
    });
    console.log(`✓ Driver 1 created & online: ${driver1Id}`);

    // Driver 2 (Nearby: ~2.5 km away)
    const d2Phone = `+141563${ts}`;
    const d2Email = `p6_driver2_${ts}@example.com`;
    const regD2 = await request("/auth/register/driver", {
      method: "POST",
      body: { name: "Phase6 Driver Two", phone: d2Phone, email: d2Email, password: "Password123!" },
    });
    if (!regD2.ok) throw new Error(`Failed to create driver 2: ${JSON.stringify(regD2.data)}`);
    const driver2Id = regD2.data.id;
    const driver2Token = makeToken(driver2Id, "driver");

    await prisma.driver.update({
      where: { id: driver2Id },
      data: {
        verificationStatus: "approved",
        isOnline: true,
        currentLat: 37.7950,
        currentLng: -122.4100,
        rating: 4.88,
      },
    });
    console.log(`✓ Driver 2 created & online: ${driver2Id}`);

    // -------------------------------------------------------------
    // Test 4: Authenticated Socket Connections
    // -------------------------------------------------------------
    console.log("\n[Test 4] Connecting authenticated Passenger & Driver sockets...");
    const pSocket = connectSocket(passengerToken);
    openSockets.push(pSocket);
    const d1Socket = connectSocket(driver1Token);
    openSockets.push(d1Socket);
    const d2Socket = connectSocket(driver2Token);
    openSockets.push(d2Socket);

    const pAuth = await waitForEvent(pSocket, "authenticated");
    const d1Auth = await waitForEvent(d1Socket, "authenticated");
    const d2Auth = await waitForEvent(d2Socket, "authenticated");

    if (
      pAuth.userId === passengerId &&
      pAuth.role === "passenger" &&
      d1Auth.userId === driver1Id &&
      d1Auth.role === "driver" &&
      d2Auth.userId === driver2Id &&
      d2Auth.role === "driver"
    ) {
      testResults.authenticatedConnection = true;
      console.log("✓ Sockets successfully authenticated with correct identities and roles");
    } else {
      throw new Error(`Unexpected auth payloads: ${JSON.stringify({ pAuth, d1Auth, d2Auth })}`);
    }

    // -------------------------------------------------------------
    // Test 5: Room Authorization Enforcement
    // -------------------------------------------------------------
    console.log("\n[Test 5] Verifying Room Authorization rules...");

    // 5a. User room join
    const ownUserJoin = await new Promise((res) => {
      pSocket.emit("room:join", { room: `user:${passengerId}` }, res);
    });
    const otherUserJoin = await new Promise((res) => {
      pSocket.emit("room:join", { room: `user:${driver1Id}` }, res);
    });

    if (ownUserJoin.success === true && otherUserJoin.success === false) {
      testResults.userRoomJoinEnforced = true;
      console.log("✓ User room join enforced (own: allowed, other: forbidden)");
    } else {
      throw new Error(`User room join violation: own=${JSON.stringify(ownUserJoin)}, other=${JSON.stringify(otherUserJoin)}`);
    }

    // 5b. Driver room join
    const driverOwnJoin = await new Promise((res) => {
      d1Socket.emit("room:join", { room: `driver:${driver1Id}` }, res);
    });
    const passengerDriverJoin = await new Promise((res) => {
      pSocket.emit("room:join", { room: `driver:${driver1Id}` }, res);
    });

    if (driverOwnJoin.success === true && passengerDriverJoin.success === false) {
      testResults.driverRoomJoinEnforced = true;
      console.log("✓ Driver room join enforced (driver: allowed, passenger: forbidden)");
    } else {
      throw new Error(`Driver room join violation: driver=${JSON.stringify(driverOwnJoin)}, passenger=${JSON.stringify(passengerDriverJoin)}`);
    }

    // -------------------------------------------------------------
    // Test 6: Live Offer Delivery (ride:offer-created)
    // -------------------------------------------------------------
    console.log("\n[Test 6] Passenger creates ride; verifying live offer delivery via Socket.IO...");

    // Prepare listeners before creating the ride
    const pOfferPromise = waitForEvent(pSocket, "ride:offer-created");
    const d1OfferPromise = waitForEvent(d1Socket, "ride:offer-created");
    const d2OfferPromise = waitForEvent(d2Socket, "ride:offer-created");

    const rideRes = await request("/rides", {
      method: "POST",
      headers: { Authorization: `Bearer ${passengerToken}` },
      body: {
        pickupLat: 37.7749,
        pickupLng: -122.4194,
        pickupAddress: "100 Market St, SF",
        dropoffLat: 37.7891,
        dropoffLng: -122.4014,
        dropoffAddress: "500 Montgomery St, SF",
        distanceKm: 2.3,
        etaMinutes: 8,
        proposedFare: 18.5,
      },
    });

    if (!rideRes.ok) throw new Error(`Failed to create ride: ${JSON.stringify(rideRes.data)}`);
    const rideId = rideRes.data.id;
    console.log(`✓ Ride created: ${rideId} (status: ${rideRes.data.status})`);

    // Await live socket events
    const [pOfferEvent, d1OfferEvent, d2OfferEvent] = await Promise.all([
      pOfferPromise,
      d1OfferPromise,
      d2OfferPromise,
    ]);

    if (
      pOfferEvent.rideId === rideId &&
      d1OfferEvent.rideId === rideId &&
      d2OfferEvent.rideId === rideId &&
      pOfferEvent.status === "pending" &&
      d1OfferEvent.driverId === driver1Id &&
      d2OfferEvent.driverId === driver2Id
    ) {
      testResults.liveOfferCreatedDelivered = true;
      console.log(`✓ Real-time ride:offer-created delivered cleanly to Passenger, Driver 1, and Driver 2`);
      console.log(`  Payload sample: offerId=${d1OfferEvent.offerId}, fare=$${d1OfferEvent.proposedFare}`);
    } else {
      throw new Error(`Mismatch in live offer delivery: ${JSON.stringify({ pOfferEvent, d1OfferEvent, d2OfferEvent })}`);
    }

    // -------------------------------------------------------------
    // Test 7: Ride room authorization for ride:${rideId}
    // -------------------------------------------------------------
    console.log("\n[Test 7] Verifying Ride Room join authorization...");
    const pRideJoin = await new Promise((res) => {
      pSocket.emit("room:join", { room: `ride:${rideId}` }, res);
    });
    const d1RideJoin = await new Promise((res) => {
      d1Socket.emit("room:join", { room: `ride:${rideId}` }, res);
    });

    // Create an unrelated user to test ride room denial
    const otherPassengerToken = makeToken("00000000-0000-0000-0000-000000000000", "passenger");
    const otherSocket = connectSocket(otherPassengerToken);
    openSockets.push(otherSocket);
    await waitForEvent(otherSocket, "authenticated");

    const otherRideJoin = await new Promise((res) => {
      otherSocket.emit("room:join", { room: `ride:${rideId}` }, res);
    });

    if (pRideJoin.success === true && d1RideJoin.success === true && otherRideJoin.success === false) {
      testResults.rideRoomJoinEnforced = true;
      console.log("✓ Ride room join enforced (participant: allowed, stranger: forbidden)");
    } else {
      throw new Error(`Ride room join violation: p=${JSON.stringify(pRideJoin)}, d1=${JSON.stringify(d1RideJoin)}, other=${JSON.stringify(otherRideJoin)}`);
    }

    // -------------------------------------------------------------
    // Test 8: Passenger Accepts Driver 1's Offer (ride:accepted & ride:offer-updated)
    // -------------------------------------------------------------
    console.log("\n[Test 8] Passenger accepts Driver 1 offer; verifying live updates...");
    const offer1Id = d1OfferEvent.offerId;

    const pAcceptedPromise = waitForEvent(pSocket, "ride:accepted");
    const d1AcceptedPromise = waitForEvent(d1Socket, "ride:accepted");
    const d1OfferUpdatedPromise = waitForEvent(d1Socket, "ride:offer-updated");

    const acceptRes = await request(`/rides/${rideId}/offers/${offer1Id}/accept`, {
      method: "POST",
      headers: { Authorization: `Bearer ${passengerToken}` },
    });

    if (!acceptRes.ok) throw new Error(`Failed to accept offer: ${JSON.stringify(acceptRes.data)}`);
    console.log("✓ REST accept response received (status 200/201)");

    const [pAcceptedEvent, d1AcceptedEvent, d1OfferUpdatedEvent] = await Promise.all([
      pAcceptedPromise,
      d1AcceptedPromise,
      d1OfferUpdatedPromise,
    ]);

    if (
      pAcceptedEvent.rideId === rideId &&
      pAcceptedEvent.driverId === driver1Id &&
      pAcceptedEvent.status === "accepted" &&
      d1AcceptedEvent.rideId === rideId &&
      d1AcceptedEvent.driverId === driver1Id &&
      d1AcceptedEvent.status === "accepted"
    ) {
      testResults.liveRideAcceptedDelivered = true;
      console.log("✓ Real-time ride:accepted delivered to both Passenger and accepted Driver 1");
    }

    if (
      d1OfferUpdatedEvent.offerId === offer1Id &&
      d1OfferUpdatedEvent.status === "accepted"
    ) {
      testResults.liveOfferUpdatedDelivered = true;
      console.log("✓ Real-time ride:offer-updated delivered with status: accepted");
    }

    // -------------------------------------------------------------
    // Test 9: State Reconciliation via Authoritative REST
    // -------------------------------------------------------------
    console.log("\n[Test 9] Authoritative REST state reconciliation...");
    const rideCheck = await request(`/rides/${rideId}`, {
      headers: { Authorization: `Bearer ${passengerToken}` },
    });
    const offersCheck = await request(`/rides/${rideId}/offers`, {
      headers: { Authorization: `Bearer ${passengerToken}` },
    });

    if (
      rideCheck.ok &&
      rideCheck.data.status === "accepted" &&
      rideCheck.data.driverId === driver1Id &&
      offersCheck.ok &&
      offersCheck.data.length >= 1
    ) {
      const acceptedRecord = offersCheck.data.find((o) => o.id === offer1Id);
      if (acceptedRecord && acceptedRecord.status === "accepted") {
        testResults.stateReconciliationConsistent = true;
        console.log("✓ REST endpoints perfectly reconciled with database state");
      }
    }

    // -------------------------------------------------------------
    // Test 10: Disconnect / Reconnect Resilience
    // -------------------------------------------------------------
    console.log("\n[Test 10] Testing disconnect and reconnect event delivery...");
    d1Socket.disconnect();
    console.log("  Driver 1 disconnected.");

    // Advance ride to ongoing via driver REST
    await request(`/rides/${rideId}/status`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${driver1Token}` },
      body: { status: "ongoing" },
    });

    // Reconnect Driver 1 socket
    const d1ReconnectedSocket = connectSocket(driver1Token);
    openSockets.push(d1ReconnectedSocket);
    await waitForEvent(d1ReconnectedSocket, "authenticated");
    console.log("  Driver 1 reconnected successfully.");

    // Listen for completion event
    const completePromise = waitForEvent(d1ReconnectedSocket, "ride:status-changed");

    await request(`/rides/${rideId}/status`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${driver1Token}` },
      body: { status: "completed" },
    });

    const completedEvent = await completePromise;
    if (completedEvent.rideId === rideId && completedEvent.status === "completed") {
      testResults.reconnectResilience = true;
      console.log("✓ Reconnected socket received subsequent ride:status-changed event cleanly");
    }

    // -------------------------------------------------------------
    // SUMMARY
    // -------------------------------------------------------------
    console.log("\n================================================================");
    console.log("PHASE 6 REALTIME AUDIT RESULTS SUMMARY");
    console.log("================================================================");
    let allPassed = true;
    for (const [key, value] of Object.entries(testResults)) {
      console.log(`- ${key}: ${value ? "PASS" : "FAIL"}`);
      if (!value) allPassed = false;
    }

    if (allPassed) {
      console.log("\n🎉 ALL PHASE 6 REALTIME AUDIT CHECKS PASSED!");
    } else {
      throw new Error("One or more Phase 6 audit checks failed!");
    }
  } finally {
    for (const s of openSockets) {
      try {
        s.disconnect();
      } catch {}
    }
    await prisma.$disconnect();
  }
}

runPhase6RealtimeVerification().catch((err) => {
  console.error("\n❌ PHASE 6 AUDIT FAILED:", err);
  process.exit(1);
});
