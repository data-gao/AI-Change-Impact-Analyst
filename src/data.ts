import { MeetingTranscript, Requirement, TraceLink, ConnectionConfig } from './types';

export const INITIAL_CONNECTIONS: ConnectionConfig = {
  ibmJazzUrl: 'https://jazz.example.com/rm/publish',
  ibmJazzUser: 'analyst.user',
  ibmJazzPass: '',
  neo4jUrl: 'bolt://localhost:7687',
  neo4jUser: 'neo4j',
  neo4jPass: '',
  n8nWebhookUrl: 'https://n8n.example.com/webhook/meeting-trigger',
  modelName: 'gemini-3.5-flash',
};

export const INITIAL_REQUIREMENTS: Requirement[] = [
  // ADAS - Level 2 Lane Centering Systems
  {
    id: 'SYS-REQ-ADAS-201',
    type: 'System',
    title: 'Lane Keep Centering Active Safe Inhibit',
    text: 'The lane keep centering (LKC) system shall automatically safe-inhibit if torque sensor registers hands-off state for more than 15.0 seconds.',
    status: 'Approved',
    asilRating: 'D',
    owner: 'Safety Team',
    lastModified: '2026-05-12',
    tracesTo: [],
  },
  {
    id: 'SW-REQ-ADAS-301',
    type: 'Software',
    title: 'Hands-off Sensor Debounce and Diagnostics',
    text: 'The capacitive touch steering wheel sensor module shall report hands-on state debounced at 50ms with a validated CAN-FD message ID 0x2A4.',
    status: 'Approved',
    asilRating: 'B',
    owner: 'ADAS Software Team',
    lastModified: '2026-05-15',
    tracesTo: ['SYS-REQ-ADAS-201'],
  },
  {
    id: 'SW-REQ-ADAS-302',
    type: 'Software',
    title: 'Acoustic and Haptic Driver Attention Escalation Alert',
    text: 'Upon hands-off timer exceeding 10.0 seconds, the IP Cluster shall trigger a Red Alert Icon and play a 2.4kHz acoustic chime.',
    status: 'Approved',
    asilRating: 'B',
    owner: 'HMI Software Team',
    lastModified: '2026-05-18',
    tracesTo: ['SYS-REQ-ADAS-201'],
  },
  {
    id: 'TC-ADAS-401',
    type: 'TestCase',
    title: 'Hands-on alert timeout evaluation test',
    text: 'Inject static capacitive low signal, verify chime sounds at exactly 10.0s and LKC inhibits at 15.0s on the mock CAN bus.',
    status: 'Approved',
    owner: 'HIL Verification Eng',
    lastModified: '2026-06-01',
    tracesTo: ['SW-REQ-ADAS-301', 'SW-REQ-ADAS-302'],
  },

  // Over-The-Air (OTA) Updates & Security
  {
    id: 'SYS-REQ-SEC-110',
    type: 'System',
    title: 'OTA Image Security and Integrity Checks',
    text: 'All received firmware updates over LTE / 5G shall be authenticated using ECDSA P-256 signatures prior to writing to alternate A/B flash blocks.',
    status: 'Approved',
    asilRating: 'QM',
    owner: 'Cybersecurity Architect',
    lastModified: '2026-04-20',
    tracesTo: [],
  },
  {
    id: 'SW-REQ-SEC-411',
    type: 'Software',
    title: 'A/B Flash Bootloader Dual Vector Switching',
    text: 'The Bootloader shall execute integrity checks on alternate app region blocks and slide vectors only if active watchdog is refreshed within 200ms.',
    status: 'Approved',
    asilRating: 'A',
    owner: 'Core Firmware Team',
    lastModified: '2026-04-25',
    tracesTo: ['SYS-REQ-SEC-110'],
  },
  {
    id: 'TC-SEC-502',
    type: 'TestCase',
    title: 'Corrupted alternate signature injection test',
    text: 'Upload flash image with altered CRC and check that bootloader rejects image and switches active partition back safely within 1.0s.',
    status: 'Approved',
    owner: 'Automation QA',
    lastModified: '2026-04-28',
    tracesTo: ['SW-REQ-SEC-411'],
  },

  // Battery Management System (BMS) / Thermal Safeguards
  {
    id: 'SYS-REQ-BMS-090',
    type: 'System',
    title: 'HV Over-Temperature Emergency Contactor Trip',
    text: 'If high-voltage cell battery terminal sensors exceed 62.0°C in active discharge, the BMS controller shall command the solid state pyro-fuse contactor to open within 15ms.',
    status: 'Approved',
    asilRating: 'D',
    owner: 'Safety Team',
    lastModified: '2026-03-10',
    tracesTo: [],
  },
  {
    id: 'SW-REQ-BMS-191',
    type: 'Software',
    title: 'Pyro-fuse Gate Driver Diagnostic Pulses',
    text: 'The thermal safety monitor task shall measure battery pack thermistors at 100Hz with oversampled moving average filter over 5 taps.',
    status: 'Approved',
    asilRating: 'D',
    owner: 'BMS Embedded Team',
    lastModified: '2026-03-12',
    tracesTo: ['SYS-REQ-BMS-090'],
  },
  {
    id: 'TC-BMS-020',
    type: 'TestCase',
    title: 'Short circuit discharge over-temperature shutdown sequence',
    text: 'Force thermistor reading above 64.0°C and measure pyro-fuse contactor status change timeline on high precision oscilloscope.',
    status: 'Approved',
    owner: 'Hardware Verification Lead',
    lastModified: '2026-03-15',
    tracesTo: ['SW-REQ-BMS-191'],
  }
];

export const INITIAL_LINKS: TraceLink[] = [
  // ADAS link structures
  { source: 'SYS-REQ-ADAS-201', target: 'SW-REQ-ADAS-301', type: 'REFINES' },
  { source: 'SYS-REQ-ADAS-201', target: 'SW-REQ-ADAS-302', type: 'REFINES' },
  { source: 'SW-REQ-ADAS-301', target: 'TC-ADAS-401', type: 'VERIFIES' },
  { source: 'SW-REQ-ADAS-302', target: 'TC-ADAS-401', type: 'VERIFIES' },

  // Security links
  { source: 'SYS-REQ-SEC-110', target: 'SW-REQ-SEC-411', type: 'REFINES' },
  { source: 'SW-REQ-SEC-411', target: 'TC-SEC-502', type: 'VERIFIES' },

  // BMS links
  { source: 'SYS-REQ-BMS-090', target: 'SW-REQ-BMS-191', type: 'REFINES' },
  { source: 'SW-REQ-BMS-191', target: 'TC-BMS-020', type: 'VERIFIES' }
];

export const SAMPLE_TRANSCRIPTS: { id: string; title: string; desc: string; rawText: string }[] = [
  {
    id: 'TR-01',
    title: 'ADAS Hands-Off Safeguard Tuning (ISO 26262 ASIL-D Calibration Sprint)',
    desc: 'Sprint planning discussing escalation alerts, debounce filters, and acoustic chime criteria for ASIL-D Hands-off detection.',
    rawText: `PROCEEDINGS OF METROPOLITAN AUTOMOTIVE ENGINEERING - ADAS SPRINT PLANNING WORKSHOP
Participants:
- Helen Vance (Safety Lead)
- Daniel Kolar (ADAS Systems Architect)
- Takashi Sato (HMI Senior Engineer)

[00:02:15] Helen: Let's address our Lane Keeping active threshold for Hands-Off steering. Currently, SYS-REQ-ADAS-201 says 15 seconds before total inhibit. But field reports from European regulatory NCAP test groups show that human handoff alerts should initiate quicker to achieve higher ASIL compliance. We need to decrease the escalation trigger chime warning time to 8.0 seconds rather than 10.0 seconds. 

[00:03:45] Daniel: Okay, let's trace this down. That affects SW-REQ-ADAS-302 which controls HHM (haptic alert and chime duration). We should change that software requirement. Instead of initiating the acoustic chime at 10 seconds, we will initiate it at exactly 8.0 seconds to satisfy the safety rating.

[00:05:10] Takashi: Clear. I will update the audio chiming logic. We also should confirm that our debouncing parameters (currently in SW-REQ-ADAS-301) are consistent. Is 50ms still correct?

[00:05:30] Helen: Yes, 50ms capacitive touch wheel debouncing works perfectly. But we need to add a brand-new system requirement: "In case of persistent hands-off control for over 25 seconds where the driver completely ignores the acoustic escalation alerts, the system shall apply gentle torque braking pulses to notify the driver physically, keeping ASIL-D compliance intact".

[00:06:50] Daniel: Oh! That's a completely new requirement. Let's call it SYS-REQ-ADAS-202 (Adaptive Haptic Steering Warning pulses). And we will need a corresponding software requirement to generate the steering jerk sequence using the electronic power steering (EPS) rack, say, SW-REQ-ADAS-303, plus a HIL test case like TC-ADAS-403 to test this torque output.

[00:08:15] Helen: Correct. Let's output these user stories to see their impact trace graph, review if it flags any functional safety hazards, and then we'll write them back into IBM Jazz Requirement Manager.`
  },
  {
    id: 'TR-02',
    title: 'BMS Thermal Safety & Power Inhibit OTA Sync',
    desc: 'Sprint discussing hot flash recovery, pyrocontact discharge protocols, and watchdog timer calibrations for battery update firmware.',
    rawText: `AUTOMOTIVE BATTERY SYSTEM CONTROL WORK GROUP - EMERGENCY SPRINT PLANNING
Participants:
- Marcus Zheng (BMS Firmware Tech Lead)
- Sarah Croft (Functional Safety Engineer)

[00:01:10] Sarah: We are reviewing BMS high-voltage contactor thresholds. SYS-REQ-BMS-090 states cells tripping above 62°C activates the pyrotechnic safety contactor within 15 milliseconds. However, during fast charging sessions with ultra-high power, we might see sudden sensor spikes. We must split the thermistor measurement into structured channels. Let's refine SW-REQ-BMS-191 to read multiple backup thermistors.

[00:03:15] Marcus: We require that instead of plain averaged cell temperature, we must do a safety envelope check across three distinct temperature groups (front, mid, and aft modules). If any single group jumps more than 5.0°C/second, it warrants an early current override ramp-down. 

[00:04:45] Sarah: That implies an update to SYS-REQ-BMS-090: We should rename it to "HV Thermal Over-gradient Recovery", and modify the text to enforce early thermal limits before hitting the absolute emergency cut-off.

[00:05:30] Marcus: Let's also verify if there is an existing requirement for battery thermal sensor diagnostic faults. If all temperature registers are cut (e.g., connector disconnect), we have no sensors at all. Is there a requirement?

[00:05:55] Sarah: No, there is no requirement for totally missing thermistor diagnostics in our repository list! Good catch. We must write a brand new requirement from scratch: "SYS-REQ-BMS-095 (Battery Thermistor Connection Lost Safe State): If thermistor signal connectivity is fully severed, the system shall command immediate power limit mode (Limp-Home), cap the voltage to 300V, and trigger a cluster check engine light within 100ms."

[00:07:30] Marcus: Outstanding. Let's trace this to SW-REQ-BMS-204 and create verification routines to validate loss-of-signal.`
  }
];
