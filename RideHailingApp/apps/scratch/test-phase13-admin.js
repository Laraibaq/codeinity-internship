const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
const http = require('http');
const fs = require('fs');

const API_BASE = 'http://localhost:3000';

function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_BASE);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const json = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, headers: res.headers, body: json });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, raw: data });
        }
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

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

async function run() {
  console.log('====================================================');
  console.log('PHASE 13: ADMIN DASHBOARD — ACCEPTANCE TEST SUITE');
  console.log('====================================================\n');

  // 1. Unauthenticated rejection (401)
  console.log('--- Step 1: Unauthenticated Access Rejection ---');
  const unauthOverview = await request('GET', '/admin/dashboard/overview');
  assert(unauthOverview.status === 401, 'GET /admin/dashboard/overview unauthenticated returns 401');

  const unauthUsers = await request('GET', '/admin/users');
  assert(unauthUsers.status === 401, 'GET /admin/users unauthenticated returns 401');

  const unauthSuspend = await request('POST', '/admin/drivers/00000000-0000-0000-0000-000000000000/suspend', {});
  assert(unauthSuspend.status === 401, 'POST /admin/drivers/:id/suspend unauthenticated returns 401');

  // 2. Passenger & Driver tokens for authorization rejection (403)
  console.log('\n--- Step 2: Role Authorization Enforcement (403 for non-admins) ---');
  // Register/login a passenger
  const passPhone = `+9230${Math.floor(10000000 + Math.random() * 90000000)}`;
  const passReg = await request('POST', '/auth/register/passenger', {
    phone: passPhone,
    password: 'Password123!',
    name: 'Acceptance Passenger',
  });
  let passengerToken = passReg.body.accessToken;
  if (!passengerToken) {
    const passLogin = await request('POST', '/auth/login', {
      identifier: passPhone,
      password: 'Password123!',
    });
    passengerToken = passLogin.body.accessToken;
  }

  // Attempt admin access with passenger token
  const passOverview = await request('GET', '/admin/dashboard/overview', null, {
    Authorization: `Bearer ${passengerToken}`,
  });
  assert(passOverview.status === 403, 'GET /admin/dashboard/overview with passenger token returns 403');

  const passUsers = await request('GET', '/admin/users', null, {
    Authorization: `Bearer ${passengerToken}`,
  });
  assert(passUsers.status === 403, 'GET /admin/users with passenger token returns 403');

  const passSuspend = await request('POST', '/admin/drivers/00000000-0000-0000-0000-000000000000/suspend', {}, {
    Authorization: `Bearer ${passengerToken}`,
  });
  assert(passSuspend.status === 403, 'POST /admin/drivers/:id/suspend with passenger token returns 403');

  // Register/login a driver
  const driverPhone = `+9231${Math.floor(10000000 + Math.random() * 90000000)}`;
  const driverReg = await request('POST', '/auth/register/driver', {
    phone: driverPhone,
    password: 'Password123!',
    name: 'Acceptance Driver',
  });
  let driverId = driverReg.body.id;
  const driverLogin = await request('POST', '/auth/login', {
    identifier: driverPhone,
    password: 'Password123!',
  });
  const driverToken = driverLogin.body.accessToken;
  if (!driverId) {
    driverId = driverLogin.body.sub;
  }

  const driverOverview = await request('GET', '/admin/dashboard/overview', null, {
    Authorization: `Bearer ${driverToken}`,
  });
  assert(driverOverview.status === 403, 'GET /admin/dashboard/overview with driver token returns 403');

  // 3. Admin Authentication
  console.log('\n--- Step 3: Admin Authentication & Login ---');
  const badLogin = await request('POST', '/auth/admin/login', {
    identifier: 'admin@ridehailing.pk',
    password: 'WrongPassword!',
  });
  assert(badLogin.status === 401, 'POST /auth/admin/login with incorrect credentials returns 401');

  const adminLogin = await request('POST', '/auth/admin/login', {
    identifier: 'admin@ridehailing.pk',
    password: 'AdminSecret123!',
  });
  assert(adminLogin.status === 200, 'POST /auth/admin/login with valid credentials returns 200');
  assert(adminLogin.body.role === 'admin', 'Login response returns role: admin');
  assert(Boolean(adminLogin.body.accessToken), 'Login response contains accessToken');

  const adminToken = adminLogin.body.accessToken;
  const adminHeaders = { Authorization: `Bearer ${adminToken}` };

  // 4. Dashboard Overview (real database statistics)
  console.log('\n--- Step 4: Dashboard Overview Aggregates ---');
  const overview = await request('GET', '/admin/dashboard/overview', null, adminHeaders);
  assert(overview.status === 200, 'GET /admin/dashboard/overview returns 200');
  assert(overview.body.users && typeof overview.body.users.totalPassengers === 'number', 'Overview contains totalPassengers count');
  assert(overview.body.drivers && typeof overview.body.drivers.totalDrivers === 'number', 'Overview contains totalDrivers count');
  assert(overview.body.rides && typeof overview.body.rides.totalRides === 'number', 'Overview contains totalRides count');
  assert(overview.body.financial && overview.body.financial.currency === 'PKR', 'Overview financial currency is PKR');
  assert(typeof overview.body.financial.totalPaymentVolume === 'number', 'Overview financial contains totalPaymentVolume');
  assert(typeof overview.body.financial.totalWalletBalance === 'number', 'Overview financial contains totalWalletBalance');

  // 5. Dashboard Analytics with Date Range Filters
  console.log('\n--- Step 5: Dashboard Analytics & Date Range Filters ---');
  const analytics7d = await request('GET', '/admin/dashboard/analytics?range=7d', null, adminHeaders);
  assert(analytics7d.status === 200, 'GET /admin/dashboard/analytics?range=7d returns 200');
  assert(Array.isArray(analytics7d.body.dailyTrends), 'Analytics 7d contains dailyTrends array');

  const analyticsCustom = await request('GET', '/admin/dashboard/analytics?range=custom&startDate=2026-01-01&endDate=2026-12-31', null, adminHeaders);
  assert(analyticsCustom.status === 200, 'GET /admin/dashboard/analytics custom range returns 200');

  // 6. User Management
  console.log('\n--- Step 6: User Management (Search, Pagination, Exclusion of Secrets) ---');
  const usersList = await request('GET', '/admin/users?page=1&limit=10', null, adminHeaders);
  assert(usersList.status === 200, 'GET /admin/users returns 200');
  assert(Array.isArray(usersList.body.data), 'Users response contains data array');
  assert(typeof usersList.body.total === 'number', 'Users response contains total count');

  if (usersList.body.data.length > 0) {
    const u = usersList.body.data[0];
    assert(!('passwordHash' in u), 'User entity excludes passwordHash from response');
    const userDetail = await request('GET', `/admin/users/${u.id}`, null, adminHeaders);
    assert(userDetail.status === 200, `GET /admin/users/${u.id} returns user details`);
    assert(!('passwordHash' in userDetail.body.profile), 'User detail excludes passwordHash');
  }

  // 7. Driver Management & Verification/Suspension Workflows
  console.log('\n--- Step 7: Driver Management, Approvals & Suspension ---');
  const driversList = await request('GET', '/admin/drivers?page=1&limit=10', null, adminHeaders);
  assert(driversList.status === 200, 'GET /admin/drivers returns 200');
  assert(Array.isArray(driversList.body.data), 'Drivers response contains data array');

  if (driverId) {
    // Approve driver
    const approveRes = await request('POST', `/admin/drivers/${driverId}/approve`, { reason: 'Docs verified' }, adminHeaders);
    assert(approveRes.status === 201 || approveRes.status === 200, 'POST /admin/drivers/:id/approve succeeds');
    assert(approveRes.body.verificationStatus === 'approved', 'Driver verificationStatus updated to approved');

    // Suspend driver
    const suspendRes = await request('POST', `/admin/drivers/${driverId}/suspend`, { reason: 'Conduct issue' }, adminHeaders);
    assert(suspendRes.status === 201 || suspendRes.status === 200, 'POST /admin/drivers/:id/suspend succeeds');
    assert(suspendRes.body.verificationStatus === 'suspended', 'Driver verificationStatus updated to suspended');
    assert(suspendRes.body.isOnline === false, 'Suspended driver is forced offline');

    // Attempt to go online with suspended driver
    const onlineAttempt = await request('PATCH', '/drivers/me/status', { isOnline: true }, {
      Authorization: `Bearer ${driverToken}`,
    });
    assert(onlineAttempt.status === 403, 'Suspended driver attempting to go online is rejected with 403 Forbidden');

    // Restore to approved
    const restoreRes = await request('POST', `/admin/drivers/${driverId}/approve`, { reason: 'Reinstated' }, adminHeaders);
    assert(restoreRes.body.verificationStatus === 'approved', 'Driver restored to approved');
  }

  // 8. Ride Management & Details
  console.log('\n--- Step 8: Ride Monitoring & Inspection ---');
  const ridesList = await request('GET', '/admin/rides?page=1&limit=5', null, adminHeaders);
  assert(ridesList.status === 200, 'GET /admin/rides returns 200');
  assert(Array.isArray(ridesList.body.data), 'Rides response contains data array');

  if (ridesList.body.data.length > 0) {
    const r = ridesList.body.data[0];
    const rideDetail = await request('GET', `/admin/rides/${r.id}`, null, adminHeaders);
    assert(rideDetail.status === 200, `GET /admin/rides/${r.id} returns ride details`);
    assert(typeof rideDetail.body.proposedFare === 'number', 'Ride details numeric proposedFare parsed');
  }

  // 9. Negotiation Monitoring
  console.log('\n--- Step 9: Negotiation Monitoring ---');
  const negoList = await request('GET', '/admin/negotiations?page=1&limit=5', null, adminHeaders);
  assert(negoList.status === 200, 'GET /admin/negotiations returns 200');
  assert(Array.isArray(negoList.body.data), 'Negotiations response contains data array');

  // 10. Financial & Payment Monitoring
  console.log('\n--- Step 10: Financial & Payment Reporting ---');
  const payList = await request('GET', '/admin/payments?page=1&limit=5', null, adminHeaders);
  assert(payList.status === 200, 'GET /admin/payments returns 200');
  assert(Array.isArray(payList.body.data), 'Payments response contains data array');

  const finOverview = await request('GET', '/admin/financial/overview?range=30d', null, adminHeaders);
  assert(finOverview.status === 200, 'GET /admin/financial/overview returns 200');
  assert(finOverview.body.currency === 'PKR', 'Financial overview currency is PKR');
  assert(typeof finOverview.body.grossRideValue === 'number', 'Financial overview contains numeric grossRideValue');

  // 11. Wallets & Ledger Monitoring (Read-Only)
  console.log('\n--- Step 11: Wallet & Ledger Monitoring (Strictly Read-Only) ---');
  const wallets = await request('GET', '/admin/wallets?page=1&limit=5', null, adminHeaders);
  assert(wallets.status === 200, 'GET /admin/wallets returns 200');
  assert(Array.isArray(wallets.body.data), 'Wallets response contains data array');

  const walletTxs = await request('GET', '/admin/wallet-transactions?page=1&limit=5', null, adminHeaders);
  assert(walletTxs.status === 200, 'GET /admin/wallet-transactions returns 200');

  // 12. Ratings Monitoring
  console.log('\n--- Step 12: Ratings Monitoring ---');
  const ratingsList = await request('GET', '/admin/ratings?page=1&limit=5', null, adminHeaders);
  assert(ratingsList.status === 200, 'GET /admin/ratings returns 200');

  // 13. Support Tickets Management
  console.log('\n--- Step 13: Support Ticket Management ---');
  const ticketsList = await request('GET', '/admin/support-tickets?page=1&limit=5', null, adminHeaders);
  assert(ticketsList.status === 200, 'GET /admin/support-tickets returns 200');

  // 14. Audit Logs Verification
  console.log('\n--- Step 14: Append-Only Audit Logging Verification ---');
  const auditLogs = await request('GET', '/admin/audit-logs?page=1&limit=10', null, adminHeaders);
  assert(auditLogs.status === 200, 'GET /admin/audit-logs returns 200');
  assert(auditLogs.body.total > 0, 'Audit logs have recorded administrative actions');
  const actions = auditLogs.body.data.map((l) => l.action);
  assert(actions.includes('DRIVER_APPROVED'), 'Audit log contains DRIVER_APPROVED action');
  assert(actions.includes('DRIVER_SUSPENDED'), 'Audit log contains DRIVER_SUSPENDED action');

  console.log('\n====================================================');
  console.log(`PHASE 13 ACCEPTANCE RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('[Acceptance Suite Error]', err);
  process.exit(1);
});
