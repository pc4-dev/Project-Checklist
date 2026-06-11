const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
dotenv.config({ path: require('path').join(__dirname, '../.env') });

const Project = require('../models/Project');
const Floor = require('../models/Floor');
const Location = require('../models/Location');
const Trade = require('../models/Trade');
const CheckPoint = require('../models/CheckPoint');
const Inspection = require('../models/Inspection');
const User = require('../models/User');

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected. Clearing existing data...');

  await Promise.all([
    Project.deleteMany(),
    Floor.deleteMany(),
    Location.deleteMany(),
    Trade.deleteMany(),
    CheckPoint.deleteMany(),
    Inspection.deleteMany(),
    User.deleteMany(),
  ]);

  // --- USERS (hash passwords manually — insertMany bypasses pre-save hooks) ---
  const adminHash = await bcrypt.hash('Admin@1234', 10);
  const engHash = await bcrypt.hash('Engineer@1', 10);
  await User.insertMany([
    { name: 'Admin User', email: 'admin@neotericgrp.in', password: adminHash, role: 'admin' },
    { name: 'Raza Ahmed', email: 'raza@neotericgrp.in', password: engHash, role: 'user' },
    { name: 'Waseem Baig', email: 'waseem@neotericgrp.in', password: engHash, role: 'user' },
    { name: 'Owais Malik', email: 'owais@neotericgrp.in', password: engHash, role: 'user' },
    { name: 'Farhan Ali', email: 'farhan@neotericgrp.in', password: engHash, role: 'user' },
    { name: 'Arif Siddiqui', email: 'arif@neotericgrp.in', password: engHash, role: 'user' },
  ]);

  // --- PROJECTS ---
  const [natureParkTower, zenGarden, natureParkHotel] = await Project.insertMany([
    {
      name: 'Nature Park Tower',
      type: 'RESIDENTIAL',
      description: 'Basement · Ground · Service Floor · Floors 1–8 (3 apts/floor) · Terrace · Mumty',
    },
    {
      name: 'Zen Garden',
      type: 'RESIDENTIAL',
      description: 'Ground (Parking) · Floors 1–10 (7 units/floor, 101–107 … 1001–1007) · 11th Terrace',
    },
    {
      name: 'Nature Park Hotel',
      type: 'COMMERCIAL_HOSPITALITY',
      description: 'Basement · Ground · Floors 1–8 · Terrace · 108 rooms across 7 floors',
    },
  ]);

  // --- NATURE PARK TOWER FLOORS ---
  const nptFloorDefs = [
    { code: 'BSMT', label: 'Basement', order: 0 },
    { code: 'G', label: 'Ground Floor', order: 1 },
    { code: 'SVC', label: 'Service Floor', order: 2 },
    { code: '1', label: '1st Floor', order: 3 },
    { code: '2', label: '2nd Floor', order: 4 },
    { code: '3', label: '3rd Floor', order: 5 },
    { code: '4', label: '4th Floor', order: 6 },
    { code: '5', label: '5th Floor', order: 7 },
    { code: '6', label: '6th Floor', order: 8 },
    { code: '7', label: '7th Floor', order: 9 },
    { code: '8', label: '8th Floor', order: 10 },
    { code: 'TER', label: 'Terrace', order: 11 },
    { code: 'MUM', label: 'Mumty', order: 12 },
    { code: 'PUMP', label: 'Pump Room', order: 13, isProjectLevel: true },
    { code: 'EXT', label: 'External Development / Roads', order: 14, isProjectLevel: true },
    { code: 'COMP', label: 'Compound Wall / Gate', order: 15, isProjectLevel: true },
  ];

  const nptFloors = await Floor.insertMany(
    nptFloorDefs.map(f => ({ ...f, projectId: natureParkTower._id }))
  );

  const nptFloorMap = {};
  nptFloors.forEach(f => { nptFloorMap[f.code] = f; });

  // Apt floors (1–8): 3 apartments + common areas
  const commonAreaNames = ['Entire Floor (General)', 'Lift Lobby', 'Staircase', 'Corridor', 'Service Shaft / Duct'];
  for (const code of ['1','2','3','4','5','6','7','8']) {
    const floor = nptFloorMap[code];
    const locs = [
      { name: `${code}A`, type: 'APARTMENT' },
      { name: `${code}B`, type: 'APARTMENT' },
      { name: `${code}C`, type: 'APARTMENT' },
      ...commonAreaNames.map(n => ({ name: n, type: 'COMMON_AREA' })),
    ];
    await Location.insertMany(locs.map(l => ({ ...l, floorId: floor._id, projectId: natureParkTower._id })));
  }

  // Non-apt floors: common areas only
  for (const code of ['BSMT','G','SVC','TER','MUM']) {
    const floor = nptFloorMap[code];
    const locs = ['Entire Floor (General)', 'Lift Lobby', 'Staircase'].map(n => ({
      name: n, type: 'COMMON_AREA', floorId: floor._id, projectId: natureParkTower._id,
    }));
    await Location.insertMany(locs);
  }

  // Project-level areas (each is its own single location)
  await Location.insertMany([
    { name: 'Pump Room', type: 'PROJECT_LEVEL', floorId: nptFloorMap['PUMP']._id, projectId: natureParkTower._id },
    { name: 'External Development / Roads', type: 'PROJECT_LEVEL', floorId: nptFloorMap['EXT']._id, projectId: natureParkTower._id },
    { name: 'Compound Wall / Gate', type: 'PROJECT_LEVEL', floorId: nptFloorMap['COMP']._id, projectId: natureParkTower._id },
  ]);

  // --- ZEN GARDEN FLOORS ---
  const zgFloorDefs = [
    { code: 'G', label: 'Ground (Parking)', order: 0 },
    ...Array.from({ length: 10 }, (_, i) => ({
      code: String(i + 1),
      label: `${i + 1}${['st','nd','rd'][i] || 'th'} Floor`,
      order: i + 1,
    })),
    { code: '11', label: '11th Terrace', order: 11 },
  ];

  const zgFloors = await Floor.insertMany(zgFloorDefs.map(f => ({ ...f, projectId: zenGarden._id })));

  for (const floor of zgFloors) {
    if (floor.code === 'G' || floor.code === '11') {
      await Location.insertMany([
        { name: 'Entire Floor (General)', type: 'COMMON_AREA', floorId: floor._id, projectId: zenGarden._id },
        { name: 'Lift Lobby', type: 'COMMON_AREA', floorId: floor._id, projectId: zenGarden._id },
      ]);
      continue;
    }
    const fn = parseInt(floor.code);
    const units = Array.from({ length: 7 }, (_, i) => ({
      name: `${fn}0${i + 1}`, type: 'APARTMENT', floorId: floor._id, projectId: zenGarden._id,
    }));
    await Location.insertMany([
      ...units,
      { name: 'Lift Lobby', type: 'COMMON_AREA', floorId: floor._id, projectId: zenGarden._id },
      { name: 'Corridor', type: 'COMMON_AREA', floorId: floor._id, projectId: zenGarden._id },
    ]);
  }

  // --- NATURE PARK HOTEL FLOORS ---
  const nphFloorDefs = [
    { code: 'BSMT', label: 'Basement', order: 0 },
    { code: 'G', label: 'Ground Floor', order: 1 },
    ...Array.from({ length: 8 }, (_, i) => ({
      code: String(i + 1),
      label: `${i + 1}${['st','nd','rd'][i] || 'th'} Floor`,
      order: i + 2,
    })),
    { code: 'TER', label: 'Terrace', order: 10 },
  ];

  const nphFloors = await Floor.insertMany(nphFloorDefs.map(f => ({ ...f, projectId: natureParkHotel._id })));

  for (const floor of nphFloors) {
    if (['BSMT','G','TER'].includes(floor.code)) {
      await Location.insertMany([
        { name: 'Entire Floor (General)', type: 'COMMON_AREA', floorId: floor._id, projectId: natureParkHotel._id },
        { name: 'Lift Lobby', type: 'COMMON_AREA', floorId: floor._id, projectId: natureParkHotel._id },
      ]);
      continue;
    }
    const fn = parseInt(floor.code);
    const roomCount = fn <= 7 ? 16 : 12;
    const rooms = Array.from({ length: roomCount }, (_, i) => ({
      name: `${fn}${String(i + 1).padStart(2, '0')}`,
      type: 'APARTMENT',
      floorId: floor._id,
      projectId: natureParkHotel._id,
    }));
    await Location.insertMany([
      ...rooms,
      { name: 'Corridor', type: 'COMMON_AREA', floorId: floor._id, projectId: natureParkHotel._id },
      { name: 'Lift Lobby', type: 'COMMON_AREA', floorId: floor._id, projectId: natureParkHotel._id },
    ]);
  }

  // --- TRADES ---
  const tradeData = [
    {
      name: 'Brick / Block Masonry',
      isHoldPoint: false,
      isPending: false,
      order: 1,
      whyItMatters: 'A dry brick sucks the water out of mortar — the cement never hydrates and the joint turns to powder in 3 years. Walls built too fast or out of plumb crack at the RCC junction. 80% of plaster cracks are born here.',
    },
    {
      name: 'Toilet / Terrace Waterproofing',
      isHoldPoint: true,
      isPending: false,
      order: 2,
      whyItMatters: 'Waterproofing failures are the most expensive post-construction repairs. Once tiles are laid, fixing a leak means demolishing the entire floor. This is your last clear inspection window.',
    },
    {
      name: 'Tiling (Floor & Dado)',
      isHoldPoint: true,
      isPending: false,
      order: 3,
      whyItMatters: 'Hollow tiles, uneven joints, and wrong slopes cause lifelong nuisance. Proper bed thickness and curing are invisible once done — inspect before grouting.',
    },
    {
      name: 'RCC Pre-Pour Clearance (Shuttering + Reinforcement)',
      isHoldPoint: true,
      isPending: false,
      order: 4,
      whyItMatters: 'Concrete is permanent. Once poured, errors in cover, bar placement, or shuttering cannot be corrected. This is the single most critical sign-off in structural work.',
    },
    {
      name: 'Concrete Pour + Day-wise Curing Register (Level 1)',
      isHoldPoint: true,
      isPending: false,
      order: 5,
      whyItMatters: 'Concrete strength is 100% dependent on water-cement ratio and curing. A missed curing day in summer can reduce strength by 20%. The register is the proof.',
    },
    { name: 'Plaster (Internal / External)', isHoldPoint: false, isPending: true, order: 6 },
    { name: 'Electrical Conduiting — Conceal', isHoldPoint: true, isPending: true, order: 7 },
    { name: 'Plumbing — Pressure Test — Conceal', isHoldPoint: true, isPending: true, order: 8 },
    { name: 'Painting & Finishing', isHoldPoint: false, isPending: true, order: 9 },
    { name: 'Doors / Windows / Aluminium', isHoldPoint: false, isPending: true, order: 10 },
    { name: 'External Development / Roads', isHoldPoint: false, isPending: true, order: 11 },
  ];

  const trades = await Trade.insertMany(tradeData);
  const [brickTrade, waterproofTrade, tilingTrade, rccTrade, concreteTrade] = trades;

  // --- CHECKPOINTS: Brick / Block Masonry (12) ---
  await CheckPoint.insertMany([
    { tradeId: brickTrade._id, order: 1, title: 'Brick soaking before use', standard: 'Clay bricks soaked 6–8 hrs; AAC blocks surface-wetted only (never soaked)', howToCheck: 'Pull a brick from the soaked stack and break it — the core must be damp through. For AAC, surface damp to touch only.', photoRequired: false },
    { tradeId: brickTrade._id, order: 2, title: 'Mortar mix proportion', standard: '1:6 for full-brick, 1:4 for half-brick walls — measured by farma box, never by guess', howToCheck: 'Stand at the mixing platform; count farma boxes of sand per bag of cement for one batch.', photoRequired: false },
    { tradeId: brickTrade._id, order: 3, title: 'Mortar joint thickness', standard: '10–12 mm, max 15 mm anywhere', howToCheck: 'Measure 5 random joints with a steel scale across the wall face.', photoRequired: false },
    { tradeId: brickTrade._id, order: 4, title: 'Wall plumb', standard: 'Max 5 mm deviation per 3 m height', howToCheck: 'Plumb bob (sahul) at minimum 3 locations per wall, including both ends.', photoRequired: false },
    { tradeId: brickTrade._id, order: 5, title: 'Line and level of courses', standard: 'Each course true to line; no step deviation visible', howToCheck: 'Stretch dori along the course; sight along the wall face.', photoRequired: false },
    { tradeId: brickTrade._id, order: 6, title: 'Daily construction height', standard: 'Max 1.0 m height raised per day', howToCheck: "Measure from the previous day's marked level.", photoRequired: false },
    { tradeId: brickTrade._id, order: 7, title: 'Reinforcement in half-brick walls', standard: '2 nos 6 mm bars or approved mesh every 4th course, hooked into RCC', howToCheck: 'Count courses physically; confirm bars before next course covers them.', photoRequired: true },
    { tradeId: brickTrade._id, order: 8, title: 'RCC–masonry junction preparation', standard: 'RCC face hacked / bonding agent applied before abutting masonry', howToCheck: 'Run fingers across the RCC face — hacking must be felt, not seen from distance.', photoRequired: false },
    { tradeId: brickTrade._id, order: 9, title: 'Door / window opening dimensions', standard: 'Opening size per drawing, tolerance ±10 mm; diagonals equal within 10 mm', howToCheck: 'Tape-measure width at top, mid, bottom and both diagonals (gunia check at corners).', photoRequired: false },
    { tradeId: brickTrade._id, order: 10, title: 'Sill and lintel levels', standard: 'Per drawing from FFL; uniform across the floor', howToCheck: "Check with level tube / dumpy from the floor's reference thiya mark.", photoRequired: false },
    { tradeId: brickTrade._id, order: 11, title: 'Same-day raking of joints', standard: 'Joints raked 10–12 mm deep on the day of laying (for plaster key)', howToCheck: 'Press finger into joints at 5 spots — fresh raking is visible and clean.', photoRequired: false },
    { tradeId: brickTrade._id, order: 12, title: 'Curing of masonry', standard: 'Wet curing minimum 7 days; curing register entry with element ID and daily initials', howToCheck: 'Touch the wall mid-morning — it must be damp; verify register entry for this wall.', photoRequired: false },
  ]);

  // --- CHECKPOINTS: Toilet / Terrace Waterproofing (9) ---
  await CheckPoint.insertMany([
    { tradeId: waterproofTrade._id, order: 1, title: 'Surface preparation — hacking', standard: 'Entire slab hacked minimum 3 mm deep; laitance removed', howToCheck: 'Drag a nail across surface — must hear scratch; no smooth patches larger than 100 mm.', photoRequired: false },
    { tradeId: waterproofTrade._id, order: 2, title: 'Fillet at wall-floor junction', standard: '75 × 75 mm cement mortar fillet at all junctions, minimum 150 mm up the wall', howToCheck: 'Measure fillet height with steel rule at all four corners.', photoRequired: true },
    { tradeId: waterproofTrade._id, order: 3, title: 'Waterproofing material verification', standard: 'Approved brand / system as per specification; within shelf life', howToCheck: 'Check brand name, batch no., and manufacturing date on drum/bag.', photoRequired: true },
    { tradeId: waterproofTrade._id, order: 4, title: 'Application coats and coverage', standard: 'Minimum 2 coats (or as per manufacturer); 90° cross-application; no pinholes', howToCheck: 'Count coats by color change; check coverage rate against drum spec.', photoRequired: false },
    { tradeId: waterproofTrade._id, order: 5, title: 'Pipe sleeves sealed', standard: 'All pipe penetrations sealed with collar / non-shrink grout before membrane', howToCheck: 'Probe around each sleeve with a thin wire — no gap should accept wire.', photoRequired: false },
    { tradeId: waterproofTrade._id, order: 6, title: 'Flood test — 24-hour ponding', standard: '50 mm water ponding for 24 hrs; zero leakage in slab soffit below', howToCheck: 'Mark water level, check after 24 hrs; inspect ceiling below for stains.', photoRequired: true },
    { tradeId: waterproofTrade._id, order: 7, title: 'Screed protection layer', standard: 'Minimum 40 mm cement screed laid within 48 hrs of membrane cure', howToCheck: 'Measure screed depth at 5 points with pin gauge.', photoRequired: false },
    { tradeId: waterproofTrade._id, order: 8, title: 'Floor slope to drain', standard: 'Minimum 1:100 slope towards drain; no puddle zones', howToCheck: 'Pour a glass of water — it must flow to drain without spreading.', photoRequired: false },
    { tradeId: waterproofTrade._id, order: 9, title: 'Drain grating installed and clear', standard: 'Drain cover installed; no mortar blocking throat', howToCheck: 'Remove grating and check throat with torch; refit grating.', photoRequired: false },
  ]);

  // --- CHECKPOINTS: Tiling Floor & Dado (11) ---
  await CheckPoint.insertMany([
    { tradeId: tilingTrade._id, order: 1, title: 'Tile quality and lot matching', standard: 'Same lot number for each room; no warpage > 0.5 mm on 600 mm tile', howToCheck: 'Check carton labels for lot number; stack 2 tiles face-to-face and check gap.', photoRequired: false },
    { tradeId: tilingTrade._id, order: 2, title: 'Adhesive bed thickness', standard: '6–10 mm for floor tiles; 3–6 mm for wall tiles; no voids behind tile', howToCheck: 'Remove one tile immediately after laying and check back coverage — minimum 80% contact.', photoRequired: false },
    { tradeId: tilingTrade._id, order: 3, title: 'Lippage between tiles', standard: 'Max 1 mm height difference at any joint', howToCheck: 'Run a steel rule across 3 consecutive tiles; use feeler gauge at joints.', photoRequired: false },
    { tradeId: tilingTrade._id, order: 4, title: 'Joint alignment and width', standard: 'Joints straight and consistent; width as per design (typically 2–3 mm)', howToCheck: 'Stretch a string line diagonally across laid area; check deviation at each joint.', photoRequired: false },
    { tradeId: tilingTrade._id, order: 5, title: 'Hollow tile check', standard: 'No hollow sound anywhere; adhesive bed fully bonded', howToCheck: 'Tap every tile with a rubber mallet — hollow sound means rebond required.', photoRequired: false },
    { tradeId: tilingTrade._id, order: 6, title: 'Slope to drain (wet areas)', standard: 'Minimum 1:100 towards floor trap; tested before grouting', howToCheck: 'Pour 500 ml water at farthest point — must drain without pooling.', photoRequired: false },
    { tradeId: tilingTrade._id, order: 7, title: 'Grout color and curing', standard: 'Approved grout color; joints fully filled; no voids; wet cure 3 days', howToCheck: 'Inspect joints under torch light; no pin holes or gaps; check date of grouting.', photoRequired: false },
    { tradeId: tilingTrade._id, order: 8, title: 'Movement joints at columns and walls', standard: 'Sealant joint (not grout) at all column faces and perimeter walls', howToCheck: 'Check that all column faces have flexible sealant, not hard grout.', photoRequired: false },
    { tradeId: tilingTrade._id, order: 9, title: 'Dado height consistency', standard: 'Top of dado tile at designed height ± 5 mm; uniform across all walls', howToCheck: 'Measure dado height at 4 corners and midpoint of each wall.', photoRequired: false },
    { tradeId: tilingTrade._id, order: 10, title: 'Cut tile placement and edges', standard: 'Cut tiles at least half-tile width; edges ground smooth; no chips', howToCheck: 'Check all cut edges for chips; verify minimum cut width at perimeter.', photoRequired: false },
    { tradeId: tilingTrade._id, order: 11, title: 'Final clean and protection', standard: 'All tiles cleaned of adhesive/grout haze; protection board laid in high-traffic areas', howToCheck: 'Wipe tile face with damp cloth — no haze or residue; check protection in doorways.', photoRequired: false },
  ]);

  // --- CHECKPOINTS: RCC Pre-Pour Clearance (11) ---
  await CheckPoint.insertMany([
    { tradeId: rccTrade._id, order: 1, title: 'Shuttering alignment and plumb', standard: 'Panels plumb within 3 mm/m; no gaps between panels > 2 mm', howToCheck: 'Check with plumb bob at 3 points; run fingers across joints for gaps.', photoRequired: false },
    { tradeId: rccTrade._id, order: 2, title: 'Prop spacing and bearing', standard: 'Props at max 1.0 m centres; bearing plates under all props', howToCheck: 'Measure prop spacing with tape; check base plates are present.', photoRequired: false },
    { tradeId: rccTrade._id, order: 3, title: 'Main bar diameter and spacing', standard: 'As per structural drawing; tolerance ±10 mm on spacing', howToCheck: 'Measure spacing of 5 consecutive bars with tape; verify dia with calliper.', photoRequired: true },
    { tradeId: rccTrade._id, order: 4, title: 'Stirrup / link spacing', standard: 'As per drawing; closer spacing at beam ends (L/4)', howToCheck: 'Count stirrups from end and measure spacing at end zone vs mid-zone.', photoRequired: false },
    { tradeId: rccTrade._id, order: 5, title: 'Cover blocks installed', standard: '25 mm cover for slabs; 40 mm for beams and columns; approved spacers only', howToCheck: 'Check cover block size and count; min 4 per sq m for slab.', photoRequired: false },
    { tradeId: rccTrade._id, order: 6, title: 'Laps and splices location', standard: 'Laps not at points of maximum stress; minimum lap length as per drawing', howToCheck: 'Measure lap length; verify laps are not at mid-span.', photoRequired: false },
    { tradeId: rccTrade._id, order: 7, title: 'Electrical conduit and MEP sleeves', standard: 'All conduits/sleeves placed before pour; no conduit stacking vertically', howToCheck: 'Walk the entire slab; check conduit positions against MEP drawing.', photoRequired: true },
    { tradeId: rccTrade._id, order: 8, title: 'Slab thickness check — depth gauge', standard: 'Slab thickness per drawing ± 5 mm', howToCheck: 'Insert steel rod to slab soffit at 5 points; measure against formwork.', photoRequired: false },
    { tradeId: rccTrade._id, order: 9, title: 'Formwork cleanliness', standard: 'No debris, water, or loose material inside formwork', howToCheck: 'Blow compressed air inside; visually inspect through openings.', photoRequired: false },
    { tradeId: rccTrade._id, order: 10, title: 'Column starter bars tied', standard: 'Starter bars for next level tied and positioned per column drawing', howToCheck: 'Verify starter bar positions against column layout drawing.', photoRequired: false },
    { tradeId: rccTrade._id, order: 11, title: 'Pre-pour sign-off level', standard: 'Site engineer, structural consultant, and PM sign before pour commences', howToCheck: 'Confirm physical presence of all three signatories before concrete truck arrives.', photoRequired: true },
  ]);

  // --- CHECKPOINTS: Concrete Pour + Curing (0 seeded — structure ready) ---
  // isPending = false but no checkpoints seeded (0 check points as shown in prototype)

  // --- SAMPLE INSPECTIONS ---

  // Helper to build a full results array from a checkpoints list
  const makeResults = (cps, overrides = {}) =>
    cps.map(cp => ({
      checkPointId: cp._id,
      result: overrides[cp.order] || 'OK',
      photos: [],
      remarks: '',
    }))

  // Look up locations we need
  const npt8Locs   = await Location.find({ projectId: natureParkTower._id, floorId: nptFloorMap['8']._id })
  const npt5Locs   = await Location.find({ projectId: natureParkTower._id, floorId: nptFloorMap['5']._id })
  const npt6Locs   = await Location.find({ projectId: natureParkTower._id, floorId: nptFloorMap['6']._id })
  const npt3Locs   = await Location.find({ projectId: natureParkTower._id, floorId: nptFloorMap['3']._id })
  const npt7Locs   = await Location.find({ projectId: natureParkTower._id, floorId: nptFloorMap['7']._id })

  const zgFloor3   = zgFloors.find(f => f.code === '3')
  const zg3Locs    = await Location.find({ projectId: zenGarden._id, floorId: zgFloor3._id })

  const nphFloor4  = nphFloors.find(f => f.code === '4')
  const nph4Locs   = await Location.find({ projectId: natureParkHotel._id, floorId: nphFloor4._id })
  const nphFloor2  = nphFloors.find(f => f.code === '2')
  const nph2Locs   = await Location.find({ projectId: natureParkHotel._id, floorId: nphFloor2._id })

  const find = (locs, name) => locs.find(l => l.name === name) || locs[0]

  const brickCPs  = await CheckPoint.find({ tradeId: brickTrade._id }).sort({ order: 1 })
  const wpCPs     = await CheckPoint.find({ tradeId: waterproofTrade._id }).sort({ order: 1 })
  const tilingCPs = await CheckPoint.find({ tradeId: tilingTrade._id }).sort({ order: 1 })
  const rccCPs    = await CheckPoint.find({ tradeId: rccTrade._id }).sort({ order: 1 })

  // 1. NPT · 8th Floor · 8B · Brick/Block Masonry — SUBMITTED (wall plumb NOT_OK)
  await Inspection.create({
    projectId: natureParkTower._id,
    floorId: nptFloorMap['8']._id,
    locationId: find(npt8Locs, '8B')._id,
    tradeId: brickTrade._id,
    dateOfCheck: new Date('2026-06-09'),
    contractorAgency: 'Malik Construction Co.',
    checkedBy: 'Raza Ahmed',
    results: makeResults(brickCPs, { 4: 'NOT_OK' }),
    signatures: {
      siteEngineer: 'Raza Ahmed',
      contractorRep: 'Tariq Malik',
      projectManager: 'Sohail Qureshi',
    },
    status: 'SUBMITTED',
  })

  // 2. NPT · 8th Floor · 8A · Brick/Block Masonry — SUBMITTED (all OK)
  await Inspection.create({
    projectId: natureParkTower._id,
    floorId: nptFloorMap['8']._id,
    locationId: find(npt8Locs, '8A')._id,
    tradeId: brickTrade._id,
    dateOfCheck: new Date('2026-06-07'),
    contractorAgency: 'Malik Construction Co.',
    checkedBy: 'Raza Ahmed',
    results: makeResults(brickCPs),
    signatures: {
      siteEngineer: 'Raza Ahmed',
      contractorRep: 'Tariq Malik',
      projectManager: 'Sohail Qureshi',
    },
    status: 'SUBMITTED',
  })

  // 3. NPT · 5th Floor · 5A · Tiling (Floor & Dado) — SUBMITTED (all OK)
  await Inspection.create({
    projectId: natureParkTower._id,
    floorId: nptFloorMap['5']._id,
    locationId: find(npt5Locs, '5A')._id,
    tradeId: tilingTrade._id,
    dateOfCheck: new Date('2026-06-05'),
    contractorAgency: 'Star Tiling Works',
    checkedBy: 'Waseem Baig',
    results: makeResults(tilingCPs),
    signatures: {
      siteEngineer: 'Waseem Baig',
      contractorRep: 'Asad Nawaz',
      projectManager: 'Sohail Qureshi',
    },
    status: 'SUBMITTED',
  })

  // 4. NPT · 5th Floor · 5B · Tiling — SUBMITTED (lippage NOT_OK, hollow NOT_OK)
  await Inspection.create({
    projectId: natureParkTower._id,
    floorId: nptFloorMap['5']._id,
    locationId: find(npt5Locs, '5B')._id,
    tradeId: tilingTrade._id,
    dateOfCheck: new Date('2026-06-05'),
    contractorAgency: 'Star Tiling Works',
    checkedBy: 'Waseem Baig',
    results: makeResults(tilingCPs, { 3: 'NOT_OK', 5: 'NOT_OK' }),
    signatures: {
      siteEngineer: 'Waseem Baig',
      contractorRep: 'Asad Nawaz',
      projectManager: 'Sohail Qureshi',
    },
    status: 'SUBMITTED',
  })

  // 5. NPT · 6th Floor · 6B · Waterproofing — DRAFT (partial fill, no signatures)
  await Inspection.create({
    projectId: natureParkTower._id,
    floorId: nptFloorMap['6']._id,
    locationId: find(npt6Locs, '6B')._id,
    tradeId: waterproofTrade._id,
    dateOfCheck: new Date('2026-06-11'),
    contractorAgency: 'AquaSeal Pvt Ltd',
    checkedBy: 'Owais Malik',
    results: wpCPs.map((cp, i) => ({
      checkPointId: cp._id,
      result: i < 4 ? (['OK','OK','OK','NOT_OK'][i]) : 'PENDING',
      photos: [],
      remarks: '',
    })),
    signatures: { siteEngineer: '', contractorRep: '', projectManager: '' },
    status: 'DRAFT',
  })

  // 6. NPT · 6th Floor · 6C · Waterproofing — SUBMITTED (flood test NOT_OK)
  await Inspection.create({
    projectId: natureParkTower._id,
    floorId: nptFloorMap['6']._id,
    locationId: find(npt6Locs, '6C')._id,
    tradeId: waterproofTrade._id,
    dateOfCheck: new Date('2026-06-03'),
    contractorAgency: 'AquaSeal Pvt Ltd',
    checkedBy: 'Owais Malik',
    results: makeResults(wpCPs, { 6: 'NOT_OK' }),
    signatures: {
      siteEngineer: 'Owais Malik',
      contractorRep: 'Bilal Rana',
      projectManager: 'Sohail Qureshi',
    },
    status: 'SUBMITTED',
  })

  // 7. NPT · 3rd Floor · 3A · RCC Pre-Pour Clearance — SUBMITTED (all OK)
  await Inspection.create({
    projectId: natureParkTower._id,
    floorId: nptFloorMap['3']._id,
    locationId: find(npt3Locs, '3A')._id,
    tradeId: rccTrade._id,
    dateOfCheck: new Date('2026-05-28'),
    contractorAgency: 'Prime Structures',
    checkedBy: 'Farhan Ali',
    results: makeResults(rccCPs),
    signatures: {
      siteEngineer: 'Farhan Ali',
      contractorRep: 'Hassan Mirza',
      projectManager: 'Sohail Qureshi',
    },
    status: 'SUBMITTED',
  })

  // 8. NPT · 7th Floor · 7C · Brick/Block Masonry — DRAFT (in progress)
  await Inspection.create({
    projectId: natureParkTower._id,
    floorId: nptFloorMap['7']._id,
    locationId: find(npt7Locs, '7C')._id,
    tradeId: brickTrade._id,
    dateOfCheck: new Date('2026-06-11'),
    contractorAgency: 'Malik Construction Co.',
    checkedBy: 'Raza Ahmed',
    results: brickCPs.map((cp, i) => ({
      checkPointId: cp._id,
      result: i < 7 ? 'OK' : 'PENDING',
      photos: [],
      remarks: '',
    })),
    signatures: { siteEngineer: '', contractorRep: '', projectManager: '' },
    status: 'DRAFT',
  })

  // 9. Zen Garden · 3rd Floor · 301 · Brick/Block Masonry — SUBMITTED
  await Inspection.create({
    projectId: zenGarden._id,
    floorId: zgFloor3._id,
    locationId: find(zg3Locs, '301')._id,
    tradeId: brickTrade._id,
    dateOfCheck: new Date('2026-06-08'),
    contractorAgency: 'Qureshi Brothers Builders',
    checkedBy: 'Arif Siddiqui',
    results: makeResults(brickCPs, { 6: 'NOT_OK' }),
    signatures: {
      siteEngineer: 'Arif Siddiqui',
      contractorRep: 'Zubair Qureshi',
      projectManager: 'Nadeem Akhtar',
    },
    status: 'SUBMITTED',
  })

  // 10. Zen Garden · 3rd Floor · 303 · Tiling — SUBMITTED (all OK)
  await Inspection.create({
    projectId: zenGarden._id,
    floorId: zgFloor3._id,
    locationId: find(zg3Locs, '303')._id,
    tradeId: tilingTrade._id,
    dateOfCheck: new Date('2026-06-06'),
    contractorAgency: 'Crescent Tiles & Marble',
    checkedBy: 'Imran Sheikh',
    results: makeResults(tilingCPs),
    signatures: {
      siteEngineer: 'Imran Sheikh',
      contractorRep: 'Kamran Yousuf',
      projectManager: 'Nadeem Akhtar',
    },
    status: 'SUBMITTED',
  })

  // 11. Nature Park Hotel · 4th Floor · 402 · RCC Pre-Pour — SUBMITTED (cover blocks NOT_OK)
  await Inspection.create({
    projectId: natureParkHotel._id,
    floorId: nphFloor4._id,
    locationId: find(nph4Locs, '402')._id,
    tradeId: rccTrade._id,
    dateOfCheck: new Date('2026-05-30'),
    contractorAgency: 'NPC Structures Ltd',
    checkedBy: 'Junaid Rashid',
    results: makeResults(rccCPs, { 5: 'NOT_OK' }),
    signatures: {
      siteEngineer: 'Junaid Rashid',
      contractorRep: 'Waqas Shah',
      projectManager: 'Khalid Mehmood',
    },
    status: 'SUBMITTED',
  })

  // 12. Nature Park Hotel · 2nd Floor · 205 · Brick/Block Masonry — SUBMITTED (all OK)
  await Inspection.create({
    projectId: natureParkHotel._id,
    floorId: nphFloor2._id,
    locationId: find(nph2Locs, '205')._id,
    tradeId: brickTrade._id,
    dateOfCheck: new Date('2026-05-22'),
    contractorAgency: 'Apex Civil Works',
    checkedBy: 'Salman Raza',
    results: makeResults(brickCPs),
    signatures: {
      siteEngineer: 'Salman Raza',
      contractorRep: 'Omer Farooq',
      projectManager: 'Khalid Mehmood',
    },
    status: 'SUBMITTED',
  })

  console.log('Seed complete! 12 sample inspections created.');
  await mongoose.disconnect();
}

seed().catch(err => { console.error(err); process.exit(1); });
