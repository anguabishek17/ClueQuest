const BASE_URL = 'http://127.0.0.1:3001/api';

async function api(path: string, options: { method?: string; body?: any; token?: string; cookie?: string } = {}) {
  const url = `${BASE_URL}${path}`;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (options.token) headers['Authorization'] = `Bearer ${options.token}`;
  if (options.cookie) headers['Cookie'] = options.cookie;

  const res = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const text = await res.text();
  let json: any = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = text;
  }

  return { status: res.status, ok: res.ok, data: json, headers: res.headers };
}

async function runTests() {
  console.log('🧪 ========================================================');
  console.log('⚡ CLUE QUEST PRODUCTION UPDATE TEST SUITE');
  console.log('🏫 VSB Engineering College - Department of ECE');
  console.log('🧪 ========================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, name: string, detail?: string) {
    if (condition) {
      console.log(`✅ PASS: ${name}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${name} ${detail ? `(${detail})` : ''}`);
      failed++;
    }
  }

  // 1. Health & Initial WAITING Event Status
  console.log('\n--- 1. Health & Initial WAITING Event State ---');
  const health = await api('/health');
  assert(health.ok && health.data.status === 'ok', 'API Health Check returns 200 OK');

  // Login admin to ensure clean reset for test run
  const initialAdminLogin = await api('/auth/login', {
    method: 'POST',
    body: { player_code: 'admin', password: 'VSBadmin2026!' },
  });
  if (initialAdminLogin.ok) {
    await api('/admin/event/control', {
      method: 'POST',
      token: initialAdminLogin.data.token,
      body: { action: 'RESET' },
    });
  }

  const eventStatus = await api('/event/status');
  assert(eventStatus.ok && eventStatus.data.event.status === 'WAITING', 'Initial Event State is WAITING');
  assert(eventStatus.data.stats.total_registered_participants === 40, '40 registered participants verified in public status');
  assert(eventStatus.data.stats.total_questions === 20, '20 competition questions verified');

  // 2. Authentication & Direct Team-Name-Only Participant Entry
  console.log('\n--- 2. Team-Name-Only Entry & Coordinator Authorization ---');
  const team1Entry = await api('/auth/team', {
    method: 'POST',
    body: { teamName: '   Circuit Breakers   ' },
  });
  assert(team1Entry.ok && team1Entry.data.user.team_name === 'Circuit Breakers', 'Team 1 ("Circuit Breakers") Enters with Direct Team Name');
  const player1Token = team1Entry.data.token;

  const team2Entry = await api('/auth/team', {
    method: 'POST',
    body: { teamName: 'BYTE BANDITS' },
  });
  assert(team2Entry.ok && team2Entry.data.user.team_name === 'BYTE BANDITS', 'Team 2 ("BYTE BANDITS") Enters with Direct Team Name');
  const player2Token = team2Entry.data.token;

  const adminLogin = await api('/auth/admin/login', {
    method: 'POST',
    body: { username: 'admin', password: 'VSBadmin2026!' },
  });
  assert(adminLogin.ok && adminLogin.data.user.role === 'ADMIN', 'Admin Login Successful with Dedicated Credentials');
  const adminToken = adminLogin.data.token;

  // Role Protection Check: Participant cannot start event or access admin overview
  const unauthorizedStart = await api('/admin/event/control', {
    method: 'POST',
    token: player1Token,
    body: { action: 'START_NOW' },
  });
  assert(unauthorizedStart.status === 403, 'Participant forbidden (403) from coordinator start endpoint');

  // 3. Pre-Event Participant Access Guard (Zero Leak in WAITING state)
  console.log('\n--- 3. Pre-Event Participant Access Guard (Zero Leak) ---');
  const preStartGameState = await api('/game/state', { token: player1Token });
  assert(preStartGameState.ok && preStartGameState.data.event.status === 'WAITING', 'Participant receives WAITING event status');
  assert(preStartGameState.data.question === null, 'Question content is strictly NULL while in WAITING state');
  assert(preStartGameState.data.unlocked_clues.length === 0, 'No clues are returned in payload before event start');

  const preStartReveal = await api('/game/reveal-clue', { method: 'POST', token: player1Token });
  assert(preStartReveal.status === 400, 'Revealing clues rejected before event is LIVE');

  const preStartSubmit = await api('/game/submit-answer', {
    method: 'POST',
    token: player1Token,
    body: { answer: 'RESISTOR' },
  });
  assert(preStartSubmit.status === 400, 'Submitting answers rejected before event is LIVE');

  // 4. Dedicated Admin & Participant Authentication Security
  console.log('\n--- 4. Admin Credentials & Session Security ---');
  assert(adminLogin.data.user.password_hash === undefined, 'Admin password hash is NEVER exposed in payload');

  const invalidAdminLogin = await api('/auth/admin/login', {
    method: 'POST',
    body: { username: 'admin', password: 'WrongPassword!' },
  });
  assert(invalidAdminLogin.status === 401, 'Invalid admin password rejected (401)');

  const participantAsAdmin = await api('/auth/admin/login', {
    method: 'POST',
    body: { username: 'Circuit Breakers', password: 'VSBece2026!' },
  });
  assert(participantAsAdmin.status === 401, 'Participant team name rejected from admin login endpoint');

  // 5. Team Name Validation, Normalization, Uniqueness & Persistence
  console.log('\n--- 5. Team Name Validation, Uniqueness & Session Isolation ---');
  // Empty team name
  const emptyTeam = await api('/auth/team', { method: 'POST', body: { teamName: '   ' } });
  assert(emptyTeam.status === 400, 'Empty team name rejected');

  // Short team name (<2 chars)
  const shortTeam = await api('/auth/team', { method: 'POST', body: { teamName: 'A' } });
  assert(shortTeam.status === 400, 'Team name < 2 characters rejected');

  // Long team name (>60 chars)
  const longTeam = await api('/auth/team', { method: 'POST', body: { teamName: 'A'.repeat(61) } });
  assert(longTeam.status === 400, 'Team name > 60 characters rejected');

  // Re-entry / session recovery for existing team
  const existingTeamReEntry = await api('/auth/team', {
    method: 'POST',
    body: { teamName: 'Circuit Breakers' },
  });
  assert(existingTeamReEntry.ok && existingTeamReEntry.data.user.team_name === 'Circuit Breakers', 'Existing team re-entry returns valid participant session');

  // Verify /api/auth/me returns teamName
  const meTeam1 = await api('/auth/me', { token: player1Token });
  assert(meTeam1.ok && meTeam1.data.user.team_name === 'Circuit Breakers', 'GET /api/auth/me returns team_name for Circuit Breakers');

  // Team 3 registers unique team
  const team3Entry = await api('/auth/team', {
    method: 'POST',
    body: { teamName: 'ECE TITANS' },
  });
  assert(team3Entry.ok && team3Entry.data.user.team_name === 'ECE TITANS', 'Team 3 registers valid team "ECE TITANS"');
  const player3Token = team3Entry.data.token;

  // XSS attack payload attempt
  const xssAttempt = await api('/auth/team', {
    method: 'POST',
    body: { teamName: '<script>alert("xss")</script>' },
  });
  assert(xssAttempt.status === 400, 'Malicious script/HTML team name rejected');

  // Edit team name in WAITING state
  const updateTeamWaiting = await api('/auth/team', {
    method: 'PATCH',
    token: player1Token,
    body: { teamName: 'CIRCUIT BREAKERS PRIME' },
  });
  assert(updateTeamWaiting.ok && updateTeamWaiting.data.user.team_name === 'CIRCUIT BREAKERS PRIME', 'Team name update allowed while event is in WAITING state');

  // 6. CSV Import Validation Suite
  console.log('\n--- 6. CSV Import Validation & Atomicity ---');
  // Test 6a: Incomplete CSV (18 rows) -> Must Reject Atomically
  const invalid18RowsCSV = `serial number,question,clue 1,clue 2,clue 3,clue 4,answer\n` +
    Array.from({ length: 18 }, (_, i) => `${i + 1},Question ${i + 1},C1,C2,C3,C4,ANSWER${i + 1}`).join('\n');
  const invalidCsvRes = await api('/admin/questions/import-csv', {
    method: 'POST',
    token: adminToken,
    body: { csvText: invalid18RowsCSV },
  });
  assert(invalidCsvRes.status === 400, 'CSV with 18 rows rejected (exactly 20 required)');

  // Test 6b: Missing Column Headers -> Must Reject
  const badHeadersCSV = `id,statement,clue1,clue2,clue3,clue4,ans\n1,Q,C1,C2,C3,C4,A`;
  const badHeadersRes = await api('/admin/questions/import-csv', {
    method: 'POST',
    token: adminToken,
    body: { csvText: badHeadersCSV },
  });
  assert(badHeadersRes.status === 400, 'CSV with invalid column headers rejected');

  // Test 6c: Valid 20-Row CSV -> Must Import Atomically
  let valid20CSV = 'serial number,question,clue 1,clue 2,clue 3,clue 4,answer\n';
  const electronicsSeed = [
    ['Which electronic component opposes electric current flow in ohms?', 'Obeys Ohm Law P=I2R', 'Uses color bands BBROY', 'Carbon or metal film', 'Unit is Ohm', 'RESISTOR'],
    ['Which passive component stores energy in an electrostatic field?', 'Blocks steady DC passes AC', 'Charge equation Q = CV', 'Electrolytic or ceramic', 'Unit is Farad', 'CAPACITOR'],
    ['Which passive component stores energy in a magnetic field?', 'Opposes current change V=Ldi/dt', 'Coiled copper on ferrite core', 'Used in choke filters', 'Unit is Henry', 'INDUCTOR'],
    ['Which semiconductor diode conducts in one forward direction?', 'PN junction 0.7V silicon barrier', 'Anode to Cathode polarity', 'Used for AC rectification', 'Symbol is triangle pointing to line', 'DIODE'],
    ['Which 3-terminal current-controlled device has Emitter Base Collector?', 'Base current controls Collector current', 'Operates in Active Cutoff Saturation', 'CE CB CC configurations', 'NPN and PNP structural types', 'TRANSISTOR'],
    ['Which voltage-controlled field effect transistor has an insulated gate?', 'Extremely high gate input impedance', 'Vgs forms inversion channel', 'Forms CMOS integrated circuits', 'Acronym is MOSFET', 'MOSFET'],
    ['Which high-gain differential DC amplifier IC has inverting noninverting pins?', 'Infinite input impedance virtual ground', 'Math operations integrator differentiator', 'Dual supply differential inputs', 'Classic 8-pin IC is 741', 'OPERATIONAL AMPLIFIER'],
    ['Which digital building block performs Boolean algebra logic operations?', 'Operates on binary 1 and 0 levels', 'NAND and NOR are universal gates', 'AND OR NOT XOR XNOR truth tables', '7400 quad IC packaging', 'LOGIC GATES'],
    ['Which bistable sequential circuit stores one single bit of memory state?', 'Output depends on clock edge triggers', 'SR D T and JK topologies', 'Clock synchronized state transitions', 'Basic unit of registers and counters', 'FLIP-FLOP'],
    ['Which single-chip computer integrates CPU memory and GPIO peripherals?', 'Dedicated on-chip Flash ROM and SRAM', 'Powers embedded control systems', 'Families include 8051 AVR PIC ARM', 'Commonly abbreviated as MCU', 'MICROCONTROLLER'],
    ['Which input transducer detects physical properties and converts to electrical signals?', 'Measures temperature pressure or light', 'Key metrics sensitivity and linearity', 'Thermocouples LDR ultrasonic strain gauge', 'Primary input perceptual organ', 'SENSOR'],
    ['Which electronic system samples continuous analog voltages into digital binary words?', 'Discretizes time rate and bit resolution', 'Nyquist rate fs >= 2B', 'Flash SAR Sigma-Delta topologies', 'Abbreviated as ADC', 'ADC'],
    ['Which circuit converts binary numerical words into continuous analog voltages?', 'Inverse operation of ADC conversion', 'Vout proportional to Vref and binary word', 'R-2R Ladder with Op-Amp summing', 'Abbreviated as DAC', 'DAC'],
    ['Which technique varies the pulse width of a fixed-frequency wave to control power?', 'Simulates analog voltage digitally', 'Key parameter is Duty Cycle percentage', 'Used for LED dimming motor speed control', 'Abbreviated as PWM', 'PWM'],
    ['Which asynchronous serial protocol transmits data bit-by-bit without shared clock?', 'Agreed baud rate beforehand', 'Frame has 1 start bit data and stop bit', 'Uses TX and RX signal lines', 'Abbreviated as UART', 'UART'],
    ['Which synchronous 2-wire serial bus uses SDA and SCL open-drain lines with pullups?', 'Connects multiple slaves on 2 lines', '7-bit or 10-bit device addresses', 'Uses ACK NACK start and stop conditions', 'Developed by Philips as I2C', 'I2C'],
    ['Which high-speed 4-wire synchronous full-duplex communication bus uses MOSI MISO SCK SS?', 'Faster than I2C multi-wire architecture', 'Master Out Slave In and Slave Select lines', 'Used for SD cards and OLED displays', 'Abbreviated as SPI', 'SPI'],
    ['Which RF transducer converts guided transmission line waves to free-space EM radiation?', 'Impedance matching interface', 'Directivity radiation pattern and gain', 'Half-wave dipole patch and Yagi-Uda', 'Also known as Aerial', 'ANTENNA'],
    ['Which telecommunication process shifts low-frequency baseband onto high-frequency carrier?', 'Allows efficient antenna radiation', 'Analog types AM FM PM', 'Digital types FSK PSK QAM', 'Demodulation recovers message', 'MODULATION'],
    ['Which electronic circuit generates continuous periodic AC waveforms from DC power?', 'Barkhausen criterion loop gain 1', 'Sinusoidal and relaxation multivibrators', 'Hartley Colpitts and Wien bridge topologies', 'Quartz crystal frequency reference', 'OSCILLATOR'],
  ];

  for (let i = 0; i < 20; i++) {
    const [q, c1, c2, c3, c4, a] = electronicsSeed[i];
    valid20CSV += `${i + 1},"${q}","${c1}","${c2}","${c3}","${c4}","${a}"\n`;
  }

  const validCsvRes = await api('/admin/questions/import-csv', {
    method: 'POST',
    token: adminToken,
    body: { csvText: valid20CSV },
  });
  assert(validCsvRes.ok && validCsvRes.data.count === 20, 'Valid 20-row CSV imported atomically');

  // CSV Export verification
  const csvExport = await api('/admin/questions/export-csv', { token: adminToken });
  assert(csvExport.ok && typeof csvExport.data === 'string' && csvExport.data.includes('serial number,question,clue 1'), 'CSV Export endpoint generates valid CSV formatted suite');

  // 7. Coordinator START NOW -> Server COUNTDOWN -> LIVE
  console.log('\n--- 7. Coordinator START NOW & Synchronized Countdown ---');
  const startRes = await api('/admin/event/control', {
    method: 'POST',
    token: adminToken,
    body: { action: 'START_NOW' },
  });
  assert(startRes.ok && startRes.data.status === 'COUNTDOWN', 'START NOW triggers COUNTDOWN state');
  assert(Boolean(startRes.data.countdown_started_at), 'Server timestamp countdown_started_at is recorded');

  // Participant polls during countdown
  const participantCountdownState = await api('/game/state', { token: player1Token });
  assert(participantCountdownState.data.event.status === 'COUNTDOWN', 'Participant receives COUNTDOWN event state');
  assert(typeof participantCountdownState.data.event.countdown_remaining_seconds === 'number', 'Server provides exact remaining countdown seconds');

  // Fast-forward countdown by waiting 5.5s
  console.log('⏳ Waiting 5.5s for server countdown completion...');
  await new Promise(r => setTimeout(r, 5500));

  // Verify transition to LIVE
  const liveState = await api('/game/state', { token: player1Token });
  assert(liveState.data.event.status === 'LIVE', 'Event state transitioned to LIVE after 5s countdown');
  assert(liveState.data.session.current_question === 1, 'Question 1 now active for CQ001');
  assert(liveState.data.unlocked_clues.length === 1, 'Clue 1 unlocked and available (100 PTS)');
  assert(liveState.data.question.answer === undefined, 'Question answer is NEVER leaked to participant payload');

  // 8. Clue Progression & Value Sacrifice (100 -> 75 -> 50 -> 25)
  console.log('\n--- 8. Clue Progression & Value Sacrifice ---');
  const reveal2 = await api('/game/reveal-clue', {
    method: 'POST',
    token: player1Token,
    body: { requested_level: 2 },
  });
  assert(reveal2.ok && reveal2.data.session.current_clue_level === 2, 'CQ001 reveals Clue 2');
  assert(reveal2.data.session.current_question_value === 75, 'Question value drops to 75 PTS');
  assert(reveal2.data.session.total_score === 0, 'Total score safe at 0 PTS');

  // Race condition test: Double click reveal skipping check (attempt to jump 2 -> 4)
  const skipReveal = await api('/game/reveal-clue', {
    method: 'POST',
    token: player1Token,
    body: { requested_level: 4 },
  });
  assert(skipReveal.status === 400, 'Double-click/skip from Clue 2 to Clue 4 blocked (Sequential progression enforced)');

  // 9. Uppercase Input & Server Normalization
  console.log('\n--- 9. Uppercase Answer Matching & Server Normalization ---');
  // Submit lowercase / mixed-case input with spaces
  const submitQ1 = await api('/game/submit-answer', {
    method: 'POST',
    token: player1Token,
    body: { answer: '   resistor   ' },
  });
  assert(submitQ1.ok && submitQ1.data.is_correct === true, 'Mixed-case answer "   resistor   " normalized to RESISTOR');
  assert(submitQ1.data.earned_points === 75, 'Earned 75 PTS at Clue 2');
  assert(submitQ1.data.total_score === 75, 'Total score updated to 75 PTS');
  assert(submitQ1.data.user_answer === 'RESISTOR', 'Normalized user answer stored in UPPERCASE');

  // Duplicate submission attempt
  const dupSubmit = await api('/game/submit-answer', {
    method: 'POST',
    token: player1Token,
    body: { answer: 'RESISTOR' },
  });
  assert(dupSubmit.status === 400, 'Duplicate submission on answered question blocked');

  // 10. Coordinator Visibility & Matrix Diagnostic Details
  console.log('\n--- 10. Coordinator Visibility & Matrix Diagnostic Details ---');
  const adminOverviewCheck = await api('/admin/overview', { token: adminToken });
  assert(adminOverviewCheck.ok, 'Admin overview accessible');
  const cq1Item = adminOverviewCheck.data.participants.find((p: any) => p.player_code === 'CQ001');
  assert(cq1Item && cq1Item.team_name === 'CIRCUIT BREAKERS PRIME', 'Coordinator overview matrix displays participant team name');

  const participantDetailCheck = await api(`/admin/participant/${cq1Item.user_id}`, { token: adminToken });
  assert(participantDetailCheck.ok && participantDetailCheck.data.participant.team_name === 'CIRCUIT BREAKERS PRIME', 'Coordinator participant diagnostics endpoint returns detailed metrics');

  // 11. Event Lifecycle: PAUSE -> RESUME -> LOCK CHECK -> ENDED -> RESET
  console.log('\n--- 11. Event Lifecycle: PAUSE -> RESUME -> LOCK CHECK -> ENDED -> RESET ---');
  const pauseRes = await api('/admin/event/control', {
    method: 'POST',
    token: adminToken,
    body: { action: 'PAUSE' },
  });
  assert(pauseRes.ok && pauseRes.data.status === 'PAUSED', 'Admin pauses event');

  const playerPausedState = await api('/game/state', { token: player1Token });
  assert(playerPausedState.data.event.status === 'PAUSED', 'Participant detects PAUSED state');

  const resumeRes = await api('/admin/event/control', {
    method: 'POST',
    token: adminToken,
    body: { action: 'RESUME' },
  });
  assert(resumeRes.ok && resumeRes.data.status === 'LIVE', 'Admin resumes event');

  // Team update while event is LIVE must be locked
  const updateTeamLive = await api('/auth/team', {
    method: 'PATCH',
    token: player1Token,
    body: { teamName: 'ILLEGAL CHANGE' },
  });
  assert(updateTeamLive.status === 400, 'Team name editing is strictly LOCKED while event is LIVE');

  const endRes = await api('/admin/event/control', {
    method: 'POST',
    token: adminToken,
    body: { action: 'END' },
  });
  assert(endRes.ok && endRes.data.status === 'ENDED', 'Admin ends event');

  const resetRes = await api('/admin/event/control', {
    method: 'POST',
    token: adminToken,
    body: { action: 'RESET' },
  });
  assert(resetRes.ok && resetRes.data.status === 'WAITING', 'Admin resets event back to WAITING');

  // Team name preserved after event reset
  const postResetMe = await api('/auth/me', { token: player1Token });
  assert(postResetMe.ok && postResetMe.data.user.team_name === 'CIRCUIT BREAKERS PRIME', 'Participant team name is preserved across event reset');

  // 12. Feature Tests: 20-Minute Authoritative Countdown & Integrity Event Logging
  console.log('\n--- 12. Test Security, Authoritative Timer & Integrity Monitoring ---');
  
  // Start event to test LIVE timer & integrity
  await api('/admin/event/control', {
    method: 'POST',
    token: adminToken,
    body: { action: 'START_NOW' },
  });
  await new Promise((r) => setTimeout(r, 5500)); // wait for countdown

  const liveTimerState = await api('/game/state', { token: player1Token });
  assert(liveTimerState.ok && Boolean(liveTimerState.data.deadline_at), 'Server provides authoritative deadline_at');
  assert(liveTimerState.ok && Boolean(liveTimerState.data.server_now), 'Server provides server_now timestamp for drift compensation');

  // Verify deadline is ~20 minutes in future
  const deadlineMs = new Date(liveTimerState.data.deadline_at).getTime();
  const serverNowMs = new Date(liveTimerState.data.server_now).getTime();
  const diffSec = Math.round((deadlineMs - serverNowMs) / 1000);
  assert(diffSec >= 1195 && diffSec <= 1205, 'Deadline is exactly 20 minutes (1200s) from start');

  // Test Integrity Event Logging (Tab Switch, Fullscreen Exit, Copy, Context Menu)
  const tabSwitchRes = await api('/game/integrity-event', {
    method: 'POST',
    token: player1Token,
    body: { type: 'TAB_SWITCH', metadata: { visibilityState: 'hidden' } },
  });
  assert(tabSwitchRes.ok && tabSwitchRes.data.success && tabSwitchRes.data.recorded, 'Tab switch recorded server-side');

  const copyRes = await api('/game/integrity-event', {
    method: 'POST',
    token: player1Token,
    body: { type: 'COPY_ATTEMPT', metadata: { targetTag: 'H2' } },
  });
  assert(copyRes.ok && copyRes.data.success, 'Copy attempt recorded server-side');

  const fsExitRes = await api('/game/integrity-event', {
    method: 'POST',
    token: player1Token,
    body: { type: 'FULLSCREEN_EXIT', metadata: { reason: 'user_exit' } },
  });
  assert(fsExitRes.ok && fsExitRes.data.success, 'Fullscreen exit recorded server-side');

  // Verify unauthorized/admin cannot send player integrity event without player role
  const adminIntegrity = await api('/game/integrity-event', {
    method: 'POST',
    token: adminToken,
    body: { type: 'TAB_SWITCH' },
  });
  assert(adminIntegrity.status === 403, 'Non-player role rejected from /api/game/integrity-event');

  // Verify Admin Overview reflects integrity count
  const adminOverview = await api('/admin/overview', { token: adminToken });
  const p1Matrix = adminOverview.data.participants.find((p: any) => p.player_code === 'CQ001');
  assert(p1Matrix && p1Matrix.integrity_events_count >= 3, 'Admin overview displays participant integrity event count (>=3)');

  // Verify Coordinator Participant Diagnostic Detail modal payload
  const p1Detail = await api(`/admin/participant/${p1Matrix.user_id}`, { token: adminToken });
  assert(p1Detail.ok && p1Detail.data.integrity_logs.length >= 3, 'Admin participant detail returns full integrity activity audit trail');

  // Test refresh / reconnect persistence: deadline remains invariant
  const refreshedState = await api('/game/state', { token: player1Token });
  assert(refreshedState.data.deadline_at === liveTimerState.data.deadline_at, 'Timer survives refresh without resetting deadline');

  console.log('\n========================================================');
  console.log(`🏁 TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('========================================================\n');

  if (failed > 0) process.exit(1);
}

runTests().catch(err => {
  console.error('Test runner fatal error:', err);
  process.exit(1);
});
