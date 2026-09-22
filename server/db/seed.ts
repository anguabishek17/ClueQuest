import bcrypt from 'bcryptjs';
import { db, initDb } from './client.js';

export interface SeedQuestion {
  question_number: number;
  category: string;
  question_text: string;
  answer: string;
  accepted_aliases: string[];
  clues: [
    { level: 1; points: 100; text: string },
    { level: 2; points: 75; text: string },
    { level: 3; points: 50; text: string },
    { level: 4; points: 25; text: string }
  ];
}

export const SEED_QUESTIONS: SeedQuestion[] = [
  {
    question_number: 1,
    category: "Passive Components",
    question_text: "Identify this fundamental two-terminal passive electronic component that opposes the flow of electric current.",
    answer: "Resistor",
    accepted_aliases: ["resistor", "resistors", "fixed resistor", "resistance"],
    clues: [
      { level: 1, points: 100, text: "I obey Ohm's Law and dissipate electrical energy primarily as heat in accordance with Joule's heating formula P = I²R." },
      { level: 2, points: 75, text: "My value is traditionally decoded using a standardized 4-band or 5-band color code featuring mnemonic sequences like BBROY." },
      { level: 3, points: 50, text: "Carbon composition, metal film, and wirewound are common construction techniques for my through-hole and SMD packaging." },
      { level: 4, points: 25, text: "My SI unit is named after Georg Simon Ohm and symbolized by the Greek uppercase letter Omega (Ω)." }
    ]
  },
  {
    question_number: 2,
    category: "Passive Components",
    question_text: "Identify this passive component that stores electrical potential energy in an electrostatic field between conductive plates.",
    answer: "Capacitor",
    accepted_aliases: ["capacitor", "capacitors", "condenser", "capacitance"],
    clues: [
      { level: 1, points: 100, text: "I block direct current (DC) at steady state while allowing alternating current (AC) to pass based on capacitive reactance." },
      { level: 2, points: 75, text: "My fundamental governing equation connects stored charge and voltage across my terminals through the relationship Q = C · V." },
      { level: 3, points: 50, text: "Electrolytic, ceramic disc, tantalum, and film variants of me are widely deployed in power supply smoothing filters." },
      { level: 4, points: 25, text: "My capacity to store electrical charge is measured in Farads (F), named after Michael Faraday." }
    ]
  },
  {
    question_number: 3,
    category: "Passive Components",
    question_text: "Identify this passive electrical component that stores energy in a magnetic field when electric current flows through its wound coil.",
    answer: "Inductor",
    accepted_aliases: ["inductor", "inductors", "choke", "reactor", "inductance"],
    clues: [
      { level: 1, points: 100, text: "I oppose sudden changes in electric current according to Lenz's Law and Faraday's Law of Electromagnetic Induction." },
      { level: 2, points: 75, text: "The back-EMF generated across my terminals is directly proportional to the time rate of change of current: V = L(di/dt)." },
      { level: 3, points: 50, text: "I am constructed by winding insulated copper wire around magnetic cores made of air, ferrite, or laminated iron." },
      { level: 4, points: 25, text: "My inductance property is measured in Henries (H), named in honor of Joseph Henry." }
    ]
  },
  {
    question_number: 4,
    category: "Semiconductor Devices",
    question_text: "Identify this two-terminal semiconductor device that conducts current primarily in one direction with a characteristic forward voltage drop.",
    answer: "Diode",
    accepted_aliases: ["diode", "diodes", "pn junction diode", "semiconductor diode", "p-n diode"],
    clues: [
      { level: 1, points: 100, text: "I consist of a single P-N semiconductor junction, allowing low-resistance forward bias and high-resistance reverse bias." },
      { level: 2, points: 75, text: "My standard silicon variant requires a threshold forward voltage of approximately 0.7V (0.3V for germanium) to conduct." },
      { level: 3, points: 50, text: "Specialized versions of me include Zener for voltage regulation, Schottky for fast switching, and LEDs for optical emission." },
      { level: 4, points: 25, text: "My schematic symbol features a triangle pointing towards a perpendicular line, signifying current flow from Anode to Cathode." }
    ]
  },
  {
    question_number: 5,
    category: "Semiconductor Devices",
    question_text: "Identify this three-terminal current-controlled bipolar semiconductor device capable of amplification and high-speed switching.",
    answer: "Bipolar Junction Transistor",
    accepted_aliases: ["transistor", "bjt", "bipolar junction transistor", "bipolar transistor", "npn", "pnp", "npn transistor"],
    clues: [
      { level: 1, points: 100, text: "I use both electrons and holes as charge carriers, and a small base current controls a significantly larger collector current." },
      { level: 2, points: 75, text: "I operate across three principal modes: Cut-off, Active (amplification), and Saturation (switching)." },
      { level: 3, points: 50, text: "My common configurations include Common Emitter (CE), Common Base (CB), and Common Collector (CC) amplifiers." },
      { level: 4, points: 25, text: "My two complementary structural doping types are NPN and PNP, with terminal labels Emitter, Base, and Collector." }
    ]
  },
  {
    question_number: 6,
    category: "Semiconductor Devices",
    question_text: "Identify this ubiquitous voltage-controlled field-effect transistor featuring an insulated gate used in modern digital integrated circuits.",
    answer: "MOSFET",
    accepted_aliases: ["mosfet", "mos fet", "metal oxide semiconductor field effect transistor", "fet", "mos transistor"],
    clues: [
      { level: 1, points: 100, text: "My insulated dielectric gate terminal draws virtually zero static DC input current, providing extremely high input impedance." },
      { level: 2, points: 75, text: "The gate-to-source voltage (Vgs) controls the formation of a conductive inversion channel between Drain and Source." },
      { level: 3, points: 50, text: "I exist in Enhancement and Depletion modes, and form the backbone of energy-efficient CMOS logic gates in modern VLSI chips." },
      { level: 4, points: 25, text: "My acronym stands for Metal-Oxide-Semiconductor Field-Effect Transistor." }
    ]
  },
  {
    question_number: 7,
    category: "Analog Circuits",
    question_text: "Identify this high-gain DC-coupled differential electronic amplifier widely configured with negative feedback in analog signal processing.",
    answer: "Operational Amplifier",
    accepted_aliases: ["op amp", "opamp", "operational amplifier", "op-amp", "operational amplifiers", "741"],
    clues: [
      { level: 1, points: 100, text: "In my ideal model, I possess infinite input impedance, zero output impedance, infinite open-loop gain, and infinite bandwidth." },
      { level: 2, points: 75, text: "I have inverting (-) and non-inverting (+) differential inputs, and negative feedback establishes a 'virtual ground' condition." },
      { level: 3, points: 50, text: "I can perform mathematical operations like addition, subtraction, integration, differentiation, and logarithmic conversion." },
      { level: 4, points: 25, text: "The classic monolithic 8-pin IC 741 is the most historically famous textbook implementation of my architecture." }
    ]
  },
  {
    question_number: 8,
    category: "Digital Electronics",
    question_text: "Identify this foundational building block of digital logic circuits that performs Boolean operations on one or more binary inputs.",
    answer: "Logic Gates",
    accepted_aliases: ["logic gate", "logic gates", "boolean gate", "digital logic gate", "nand gate", "universal gate"],
    clues: [
      { level: 1, points: 100, text: "I implement Boolean algebra functions in hardware to manipulate binary logic 1 (HIGH) and 0 (LOW) voltages." },
      { level: 2, points: 75, text: "NAND and NOR varieties of my family are designated as 'Universal' because any Boolean logic circuit can be built solely from them." },
      { level: 3, points: 50, text: "My fundamental types include AND, OR, NOT (Inverter), XOR, and XNOR, verified by standard Truth Tables." },
      { level: 4, points: 25, text: "Integrated circuit packages like the 7400 quad 2-input NAND IC package multiple instances of my circuit on a single silicon die." }
    ]
  },
  {
    question_number: 9,
    category: "Digital Electronics",
    question_text: "Identify this bistable multivibrator sequential logic circuit capable of storing one single bit of digital memory state.",
    answer: "Flip-Flop",
    accepted_aliases: ["flip flop", "flip-flop", "flipflops", "flip-flops", "bistable multivibrator", "latch", "d flip flop", "jk flip flop"],
    clues: [
      { level: 1, points: 100, text: "Unlike combinational logic, my output depends on both current inputs and previous output states, synchronized by a clock signal." },
      { level: 2, points: 75, text: "My state transitions occur on the rising (positive) or falling (negative) edges of a periodic digital clock waveform." },
      { level: 3, points: 50, text: "My standard architectural variations include SR (Set-Reset), D (Data), T (Toggle), and Master-Slave JK designs." },
      { level: 4, points: 25, text: "I am the basic fundamental memory storage unit chained together to construct multi-bit registers and digital counters." }
    ]
  },
  {
    question_number: 10,
    category: "Embedded Systems",
    question_text: "Identify this compact integrated circuit containing a processor core, memory, and programmable input/output peripherals on a single chip.",
    answer: "Microcontroller",
    accepted_aliases: ["microcontroller", "mcu", "micro-controller", "microcontroller unit", "arduino", "stm32", "pic microcontroller"],
    clues: [
      { level: 1, points: 100, text: "I integrate a CPU core, ROM/Flash memory, SRAM, and GPIO peripherals on a single monolithic semiconductor die for embedded tasks." },
      { level: 2, points: 75, text: "I differ from a microprocessor (MPU) by having on-chip program and data memory tailored specifically for dedicated control loops." },
      { level: 3, points: 50, text: "Famous families of my architecture include 8051, Microchip PIC, AVR (ATmega328P on Arduino), and ARM Cortex-M." },
      { level: 4, points: 25, text: "Often abbreviated as MCU, I power IoT gadgets, robotics, engine control units (ECU), and smart appliances." }
    ]
  },
  {
    question_number: 11,
    category: "Instrumentation & Sensors",
    question_text: "Identify this input transducer device that detects physical phenomena and converts them into measurable electrical signals.",
    answer: "Sensor",
    accepted_aliases: ["sensor", "sensors", "transducer", "input transducer"],
    clues: [
      { level: 1, points: 100, text: "I convert physical properties such as temperature, pressure, light intensity, sound, or acceleration into electrical voltage or current." },
      { level: 2, points: 75, text: "Key performance metrics evaluating my precision include sensitivity, linearity, resolution, dynamic range, and response time." },
      { level: 3, points: 50, text: "Examples of my types include thermocouples, LDRs, ultrasonic distance modules, strain gauges, and piezoelectric crystals." },
      { level: 4, points: 25, text: "In automated electronic systems, I represent the primary perceptual sensory organ before signal conditioning and ADC conversion." }
    ]
  },
  {
    question_number: 12,
    category: "Data Conversion",
    question_text: "Identify this electronic system that samples continuous real-world analog voltages and translates them into discrete digital binary words.",
    answer: "Analog to Digital Converter",
    accepted_aliases: ["adc", "analog to digital converter", "a/d converter", "analog-to-digital converter", "ad converter"],
    clues: [
      { level: 1, points: 100, text: "I discretize continuous analog signals in both time (sampling rate) and amplitude (quantization resolution in bits)." },
      { level: 2, points: 75, text: "The Nyquist-Shannon sampling theorem dictates that my sampling frequency must be at least twice the maximum signal bandwidth." },
      { level: 3, points: 50, text: "Common architectures include Flash (fastest), Successive Approximation Register (SAR), and Sigma-Delta (high resolution)." },
      { level: 4, points: 25, text: "Commonly known by the 3-letter acronym ADC, I enable microcontrollers to read sensor voltages from analog pins." }
    ]
  },
  {
    question_number: 13,
    category: "Data Conversion",
    question_text: "Identify this circuit that converts digital binary numerical codes into corresponding continuous proportional analog output voltages.",
    answer: "Digital to Analog Converter",
    accepted_aliases: ["dac", "digital to analog converter", "d/a converter", "digital-to-analog converter", "da converter"],
    clues: [
      { level: 1, points: 100, text: "I perform the mathematical inverse operation of an ADC, reconstructing smooth analog signals from binary data streams." },
      { level: 2, points: 75, text: "My output voltage is determined by the reference voltage Vref multiplied by the fractional value of the input digital binary word." },
      { level: 3, points: 50, text: "The classic R-2R Ladder and Weighted Resistor networks paired with an Op-Amp are classic implementations of my circuit." },
      { level: 4, points: 25, text: "Abbreviated as DAC, I am crucial for audio playback circuits, digital function generators, and motor velocity control." }
    ]
  },
  {
    question_number: 14,
    category: "Signal Processing & Control",
    question_text: "Identify this modulation technique that varies the pulse width of a fixed-frequency digital square wave to control average delivered power.",
    answer: "Pulse Width Modulation",
    accepted_aliases: ["pwm", "pulse width modulation", "pulse-width modulation"],
    clues: [
      { level: 1, points: 100, text: "I simulate analog output voltages using fully digital switching outputs by controlling the ratio of ON time to total cycle period." },
      { level: 2, points: 75, text: "My key quantitative parameter is 'Duty Cycle', expressed as a percentage: D = (Ton / (Ton + Toff)) × 100%." },
      { level: 3, points: 50, text: "I am the standard mechanism for LED dimming, DC motor speed control via H-bridges, and switch-mode power supply (SMPS) regulation." },
      { level: 4, points: 25, text: "Abbreviated as PWM, dedicated timer hardware in microcontrollers generates my signals without continuous CPU overhead." }
    ]
  },
  {
    question_number: 15,
    category: "Communication Protocols",
    question_text: "Identify this asynchronous serial communication protocol that transmits serial data bit-by-bit between two devices without a shared clock line.",
    answer: "UART",
    accepted_aliases: ["uart", "universal asynchronous receiver transmitter", "universal asynchronous receiver-transmitter", "usart", "serial uart"],
    clues: [
      { level: 1, points: 100, text: "I require both transmitting and receiving devices to agree on a predefined baud rate beforehand because no clock wire is shared." },
      { level: 2, points: 75, text: "My serial data framing consists of 1 Start Bit (LOW), 5-9 Data Bits, an optional Parity Bit, and 1 or 2 Stop Bits (HIGH)." },
      { level: 3, points: 50, text: "Full-duplex peer-to-peer communication is achieved using just two signal lines named TX (Transmit) and RX (Receive)." },
      { level: 4, points: 25, text: "My acronym stands for Universal Asynchronous Receiver-Transmitter, widely used in Arduino Serial.print() debug terminals." }
    ]
  },
  {
    question_number: 16,
    category: "Communication Protocols",
    question_text: "Identify this synchronous 2-wire multi-master serial bus protocol developed by Philips using SDA and SCL open-drain lines with pull-up resistors.",
    answer: "I2C",
    accepted_aliases: ["i2c", "i2c bus", "iic", "inter integrated circuit", "inter-integrated circuit", "twi", "two wire interface"],
    clues: [
      { level: 1, points: 100, text: "I connect multiple peripheral slave ICs to a master controller using only two bidirectional open-drain lines with pull-up resistors." },
      { level: 2, points: 75, text: "My physical bus lines are named SDA (Serial Data) and SCL (Serial Clock), and devices are addressed with 7-bit or 10-bit unique IDs." },
      { level: 3, points: 50, text: "Data transfers include START conditions, 8-bit bytes, ACK/NACK acknowledge bits from the receiver, and STOP conditions." },
      { level: 4, points: 25, text: "Invented by Philips (now NXP) and also called Inter-Integrated Circuit or TWI (Two-Wire Interface)." }
    ]
  },
  {
    question_number: 17,
    category: "Communication Protocols",
    question_text: "Identify this high-speed, 4-wire full-duplex synchronous serial communication interface standard commonly used for SD cards and OLED displays.",
    answer: "SPI",
    accepted_aliases: ["spi", "serial peripheral interface", "spi bus"],
    clues: [
      { level: 1, points: 100, text: "I achieve higher data transfer speeds than I2C by using a 4-wire full-duplex architecture driven by a master clock." },
      { level: 2, points: 75, text: "My 4 hardware lines are MOSI (Master Out Slave In), MISO (Master In Slave Out), SCK (Serial Clock), and SS/CS (Slave Select)." },
      { level: 3, points: 50, text: "Individual slave devices are enabled by driving their active-low Chip Select (CS) line LOW, avoiding in-band software addressing." },
      { level: 4, points: 25, text: "Abbreviated as SPI (Serial Peripheral Interface), originally formulated by Motorola in the mid-1980s." }
    ]
  },
  {
    question_number: 18,
    category: "Electromagnetics & RF",
    question_text: "Identify this specialized RF transducer that converts guided electrical radio-frequency signals in conductors into free-space electromagnetic waves.",
    answer: "Antenna",
    accepted_aliases: ["antenna", "antennas", "aerial", "dipole antenna", "patch antenna", "yagi antenna"],
    clues: [
      { level: 1, points: 100, text: "I act as an impedance-matching interface between guided high-frequency transmission lines and unguided free-space waves." },
      { level: 2, points: 75, text: "Key radiation characteristics that define me include radiation pattern, directivity, gain (dBi), and polarization." },
      { level: 3, points: 50, text: "Standard geometries include half-wave dipoles (λ/2), quarter-wave monopoles (λ/4), microstrip patch, and Yagi-Uda arrays." },
      { level: 4, points: 25, text: "Also termed an 'Aerial', Heinrich Hertz built the first intentional RF transmitting and receiving version of my device in 1888." }
    ]
  },
  {
    question_number: 19,
    category: "Communication Systems",
    question_text: "Identify this telecommunication process of altering a high-frequency carrier wave parameter in accordance with a message baseband signal.",
    answer: "Modulation",
    accepted_aliases: ["modulation", "carrier modulation", "am", "fm", "pm", "digital modulation"],
    clues: [
      { level: 1, points: 100, text: "I shift low-frequency baseband message spectra up to higher carrier frequencies to permit efficient radiation from reasonably sized antennas." },
      { level: 2, points: 75, text: "Analog categories of this technique vary either Amplitude (AM), Frequency (FM), or Phase (PM) of a continuous sinusoidal carrier." },
      { level: 3, points: 50, text: "Modern digital variants include ASK, FSK, PSK, and Quadrature Amplitude Modulation (QAM) for Wi-Fi and 5G cellular links." },
      { level: 4, points: 25, text: "The inverse demodulation process at the receiver recovers the original analog voice or digital binary payload." }
    ]
  },
  {
    question_number: 20,
    category: "Analog & RF Circuits",
    question_text: "Identify this electronic circuit that converts DC energy from a power supply into a continuous periodic AC electrical waveform.",
    answer: "Oscillator",
    accepted_aliases: ["oscillator", "oscillators", "crystal oscillator", "lc oscillator", "rc oscillator", "multivibrator", "clock generator"],
    clues: [
      { level: 1, points: 100, text: "I generate continuous periodic AC output waveforms (sine, square, or triangle) without requiring an external AC input signal." },
      { level: 2, points: 75, text: "To sustain steady oscillations, I must satisfy the Barkhausen Stability Criterion: loop gain |Aβ| = 1 and loop phase shift = 0° (or 360°)." },
      { level: 3, points: 50, text: "Common electronic topologies include Hartley (tapped inductor), Colpitts (tapped capacitor), Wien Bridge, and Astable 555." },
      { level: 4, points: 25, text: "Quartz piezoelectric crystal variants of my circuit provide ultra-stable reference clock pulses inside microcontrollers and computers." }
    ]
  }
];

export async function seedDatabase() {
  await initDb();
  console.log('🌱 Starting CLUE QUEST database seed process...');

  const salt = await bcrypt.genSalt(10);
  const participantPasswordHash = await bcrypt.hash('VSBece2026!', salt);
  const adminPasswordHash = await bcrypt.hash('VSBadmin2026!', salt);

  // 1. Seed Admin User
  const adminId = 'usr_admin_000';
  await db.query(`
    INSERT INTO users (id, player_code, display_name, password_hash, role, is_active)
    VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (player_code) DO NOTHING
  `, [adminId, 'admin', 'ECE Department Admin', adminPasswordHash, 'ADMIN', true]);

  // 2. Seed 40 Participants: CQ001 to CQ040
  console.log('👤 Seeding 40 participant accounts (CQ001 - CQ040)...');
  for (let i = 1; i <= 40; i++) {
    const code = `CQ${String(i).padStart(3, '0')}`;
    const id = `usr_player_${String(i).padStart(3, '0')}`;
    const displayName = `Participant ${String(i).padStart(2, '0')} (ECE)`;
    await db.query(`
      INSERT INTO users (id, player_code, display_name, password_hash, role, is_active)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (player_code) DO NOTHING
    `, [id, code, displayName, participantPasswordHash, 'PLAYER', true]);
  }

  // 3. Seed Default Event
  const eventId = 'evt_cluequest_2026_main';
  const existingEvt = await db.query('SELECT id FROM events WHERE id = $1', [eventId]);
  if (existingEvt.rows.length === 0) {
    await db.query(`
      INSERT INTO events (id, name, status, max_players, started_at, completed_at)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [eventId, 'CLUE QUEST 2026 - ECE Championship', 'WAITING', 40, null, null]);
  }

  // 4. Seed 20 Electronics Questions with 4 Progressive Clues each
  console.log('📚 Seeding 20 ECE competition questions with 80 clues...');
  for (const q of SEED_QUESTIONS) {
    const qId = `q_${String(q.question_number).padStart(2, '0')}`;
    
    // Insert Question
    await db.query(`
      INSERT INTO questions (id, question_number, question_text, answer, accepted_aliases, category, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (question_number) DO UPDATE SET
        question_text = EXCLUDED.question_text,
        answer = EXCLUDED.answer,
        accepted_aliases = EXCLUDED.accepted_aliases,
        category = EXCLUDED.category
    `, [
      qId,
      q.question_number,
      q.question_text,
      q.answer.toUpperCase(),
      JSON.stringify(q.accepted_aliases.map(a => a.toUpperCase())),
      q.category,
      true
    ]);

    // Insert 4 Clues
    for (const c of q.clues) {
      const clueId = `clue_${qId}_l${c.level}`;
      await db.query(`
        INSERT INTO clues (id, question_id, level, clue_text, points)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (question_id, level) DO UPDATE SET
          clue_text = EXCLUDED.clue_text,
          points = EXCLUDED.points
      `, [clueId, qId, c.level, c.text, c.points]);
    }
  }

  // 5. Initial Seed Event Log
  await db.query(`
    INSERT INTO event_logs (id, event_id, user_id, action, metadata)
    VALUES ($1, $2, $3, $4, $5)
  `, [
    `log_${Date.now()}`,
    eventId,
    adminId,
    'SYSTEM_SEEDED',
    JSON.stringify({ total_users: 41, total_questions: 20, max_points: 2000 })
  ]);

  console.log('✨ CLUE QUEST seed complete! Ready for 40 participants.');
}

// Run directly if called as a script
if (process.argv[1]?.includes('seed.ts') || process.argv[1]?.includes('seed.js')) {
  seedDatabase().catch(err => {
    console.error('❌ Seed error:', err);
    process.exit(1);
  });
}
