const assets = [
  { id: "ercot_bess_001", name: "Zeus Armstrong BESS", queueId: "25INR0587", county: "Armstrong", zone: "PANHANDLE", mw: 1043.08, lat: 34.97, lng: -101.36, poi: "Tap 345KV 23900 ALIBATES - 23914 TULECNYN", voltage: 345, cod: "2028-04-17", ia: "", developer: "Armstrong BESS, LLC", score: 50, confidence: "Medium" },
  { id: "ercot_bess_002", name: "Zeus Scurry BESS", queueId: "27INR0535", county: "Scurry", zone: "WEST", mw: 1043.07, lat: 32.74, lng: -100.92, poi: "MHOS 345 kV Substation (#59911)", voltage: 345, cod: "2028-10-01", ia: "", developer: "Zeus Scurry BESS", score: 50, confidence: "Medium" },
  { id: "ercot_bess_003", name: "Zeus Mitchell BESS II", queueId: "26INR0686", county: "Mitchell", zone: "WEST", mw: 1042.94, lat: 32.31, lng: -100.92, poi: "Tap 345 kV 10049 Ranger Camp - 10057 Prong Moss CKT #01 and #02", voltage: 345, cod: "2027-05-01", ia: "", developer: "Zeus Mitchell BESS II, LLC", score: 50, confidence: "Medium" },
  { id: "ercot_bess_004", name: "Zeus Mitchell BESS", queueId: "25INR0589", county: "Mitchell", zone: "WEST", mw: 1042.94, lat: 32.31, lng: -100.92, poi: "Tap 345 kV 10049 Ranger Camp - 10057 Prong Moss CKT #01 and #02", voltage: 345, cod: "2029-04-17", ia: "", developer: "Mitchell BESS", score: 50, confidence: "Medium" },
  { id: "ercot_bess_005", name: "Kickstart Energy Storage VI", queueId: "29INR0218", county: "Ellis", zone: "NORTH", mw: 1026.2, lat: 32.35, lng: -96.79, poi: "345 KV Venus 1907 to Navarro 68091", voltage: 345, cod: "2029-12-31", ia: "", developer: "Kickstart Infrastructure LLC", score: 67, confidence: "Medium", demand: "DFW south corridor" },
  { id: "ercot_bess_006", name: "Kickstart Energy Storage V", queueId: "29INR0217", county: "Ellis", zone: "NORTH", mw: 999, lat: 32.35, lng: -96.79, poi: "345 KV Venus 1906 to Fort Smith 3389", voltage: 345, cod: "2029-12-31", ia: "", developer: "Kickstart Infrastructure LLC", score: 67, confidence: "Medium", demand: "DFW south corridor" },
  { id: "ercot_bess_007", name: "Nabla Energy Storage I", queueId: "27INR0571", county: "Parker", zone: "NORTH", mw: 750, lat: 32.78, lng: -97.8, poi: "Double Tap 345kV Parker (1436) - Benbrook (1873 & 1869) DCKT", voltage: 345, cod: "2029-09-17", ia: "", developer: "Nabla Park LLC", score: 60, confidence: "Medium", demand: "DFW west corridor" },
  { id: "ercot_bess_008", name: "Nabla Energy Storage II", queueId: "28INR0466", county: "Parker", zone: "NORTH", mw: 750, lat: 32.78, lng: -97.8, poi: "Double Tap 345kV Parker (1436) - Benbrook (1873 & 1869) DCKT", voltage: 345, cod: "2029-09-17", ia: "", developer: "Nabla Park LLC", score: 60, confidence: "Medium", demand: "DFW west corridor" },
  { id: "ercot_bess_009", name: "Howard Road BESS", queueId: "29INR0173", county: "Bexar", zone: "SOUTH", mw: 617.63, lat: 29.45, lng: -98.52, poi: "BUS#5231 HOWARD RD 345 kV SUBSTATION", voltage: 345, cod: "2028-04-01", ia: "", developer: "Project Fast Flow LLC", score: 60, confidence: "Medium", demand: "San Antonio corridor" },
  { id: "ercot_bess_010", name: "Comanche BESS", queueId: "27INR0365", county: "Comanche", zone: "NORTH", mw: 614.4, lat: 31.95, lng: -98.56, poi: "#1440 Comanche Switching Station 345kV", voltage: 345, cod: "2028-10-11", ia: "", developer: "ENERGOS BESS", score: 63, confidence: "Medium" },
  { id: "ercot_bess_011", name: "Symphony BESS", queueId: "26INR0466", county: "Austin", zone: "SOUTH", mw: 612, lat: 29.89, lng: -96.28, poi: "46220 PETERS", voltage: "", cod: "2028-07-01", ia: "", developer: "Symphony BESS, LLC", score: 55, confidence: "Medium" },
  { id: "ercot_bess_012", name: "Lavita BESS", queueId: "26INR0465", county: "Bell", zone: "NORTH", mw: 606, lat: 31.04, lng: -97.48, poi: "Tap 345kV Temple Pecan Creek - Temple Switch 345kV ckt 2", voltage: 345, cod: "2028-07-01", ia: "", developer: "Lavita BESS, LLC", score: 60, confidence: "Medium", demand: "Central Texas corridor" },
  { id: "ercot_bess_013", name: "Moccasin Storage", queueId: "27INR0452", county: "Jones", zone: "WEST", mw: 603.08, lat: 32.74, lng: -99.88, poi: "Tap 345kV Kirchhoff - Clear Crossing CKT-2", voltage: 345, cod: "2028-07-01", ia: "", developer: "ENGIE IR Holdings LLC", score: 50, confidence: "Medium" },
  { id: "ercot_bess_014", name: "Hobby BESS I", queueId: "26INR0546", county: "Harris", zone: "HOUSTON", mw: 602.56, lat: 29.86, lng: -95.39, poi: "Double Tap 138kV Garden Villas - Hall and Garden Villas - Chocolate Bayou", voltage: 138, cod: "2027-10-15", ia: "", developer: "Airport Storage II LLC", score: 74, confidence: "Medium", demand: "Houston data center / industrial load corridor" },
  { id: "ercot_bess_015", name: "Kilby1 Part 2 Tier1 BESS", queueId: "28INR0457", county: "Reeves", zone: "WEST", mw: 560, lat: 31.34, lng: -103.69, poi: "Tap 345 SLKSW - SOLSTICE Ckt 1 and Ckt 2", voltage: 345, cod: "2028-01-21", ia: "", developer: "Energy Forge One LLC", score: 50, confidence: "Medium" },
  { id: "ercot_bess_016", name: "Miller Bend Energy BESS", queueId: "29INR0204", county: "Young", zone: "WEST", mw: 547.62, lat: 33.18, lng: -98.69, poi: "Tap 345kV Graham SES to Dusty Road", voltage: 345, cod: "2029-12-01", ia: "", developer: "Miller Bend Energy", score: 55, confidence: "Medium" },
  { id: "ercot_bess_017", name: "Midnight Sun Energy Storage", queueId: "24INR0442", county: "Crockett", zone: "WEST", mw: 523.86, lat: 30.73, lng: -101.41, poi: "6601 Rio Pecos 138kV", voltage: 138, cod: "2028-06-29", ia: "2025-07-14", developer: "Midnight Sun Energy Storage, LLC", score: 72, confidence: "High" },
  { id: "ercot_bess_018", name: "Knight Airport BESS I", queueId: "26INR0545", county: "Harris", zone: "HOUSTON", mw: 522.46, lat: 29.86, lng: -95.39, poi: "Tap 138kV Gulfgate - Knight and Garden Villas - Ashville", voltage: 138, cod: "2027-10-15", ia: "", developer: "Airport Storage I LLC", score: 67, confidence: "Medium", demand: "Houston data center / industrial load corridor" },
  { id: "ercot_bess_019", name: "Avalon BESS", queueId: "26INR0375", county: "Fort Bend", zone: "HOUSTON", mw: 522.12, lat: 29.53, lng: -95.77, poi: "Tapping 345 kV Smithers to Bellaire line", voltage: 345, cod: "2026-12-01", ia: "2024-12-17", developer: "Avalon BESS, LLC", score: 81, confidence: "High", demand: "Houston / Fort Bend corridor" },
  { id: "ercot_bess_020", name: "Falcon BESS", queueId: "29INR0169", county: "Zapata", zone: "SOUTH", mw: 516.72, lat: 26.97, lng: -99.17, poi: "Tap 345kV CENIZO to DEL SOL", voltage: 345, cod: "2029-12-01", ia: "", developer: "Falcon Energy Project, LLC", score: 50, confidence: "Medium" },
  { id: "ercot_bess_021", name: "Ochoa Energy Storage II", queueId: "27INR0235", county: "Waller", zone: "HOUSTON", mw: 516.56, lat: 30.01, lng: -95.99, poi: "Tap 138kV Katy - Flewellen", voltage: 138, cod: "2029-01-01", ia: "", developer: "Ochoa Energy Storage II LLC", score: 60, confidence: "Medium", demand: "Houston west corridor" },
  { id: "ercot_bess_022", name: "Enfinity Redbud Storage", queueId: "29INR0242", county: "Comal", zone: "SOUTH", mw: 516.05, lat: 29.81, lng: -98.28, poi: "345kV Hays Energy - Bergheim", voltage: 345, cod: "2029-12-18", ia: "", developer: "EG Redbud LLC", score: 60, confidence: "Medium", demand: "San Antonio north corridor" },
  { id: "ercot_bess_023", name: "Seven Angels Energy Storage I", queueId: "28INR0472", county: "Hill", zone: "NORTH", mw: 514, lat: 31.99, lng: -97.13, poi: "68090 Sam Switch Bus 345kV", voltage: 345, cod: "2028-12-31", ia: "", developer: "Seven Angels Infrastructure LLC", score: 55, confidence: "Medium" },
  { id: "ercot_bess_024", name: "Seven Angels Energy Storage II", queueId: "28INR0473", county: "Hill", zone: "NORTH", mw: 514, lat: 31.99, lng: -97.13, poi: "68090 Sam Switch Bus 345kV", voltage: 345, cod: "2028-12-31", ia: "", developer: "Seven Angels Infrastructure LLC", score: 55, confidence: "Medium" },
  { id: "ercot_bess_025", name: "Ross Storage", queueId: "26INR0156", county: "Refugio", zone: "COASTAL", mw: 510.99, lat: 28.31, lng: -97.16, poi: "Tap 345 kV Angstrom - Static line; AEP", voltage: 345, cod: "2027-07-31", ia: "2024-06-27", developer: "S&S Renewables, LLC", score: 64, confidence: "High" }
];

const signalNotes = {
  ercot_bess_019: ["IA signed in ERCOT GIS", "Greenbelt project-page signal", "Houston / Fort Bend demand context"],
  ercot_bess_014: ["Harris County demand corridor", "RenewablesInfo corroboration", "Needs POI geocoding"],
  ercot_bess_018: ["Harris County demand corridor", "Interconnection.fyi corroboration", "Needs POI geocoding"],
  ercot_bess_005: ["DFW south demand context", "1 GW-plus scale", "Kickstart Ellis cluster"],
  ercot_bess_006: ["DFW south demand context", "1 GW scale", "Kickstart Ellis cluster"],
  ercot_bess_010: ["Comanche Switching Station POI", "Ownership-network lead", "Texas SOS verification needed"]
};

const dealPages = {
  ercot_bess_019: {
    label: "Fort Bend 345kV land tell",
    customer: "Data center site selection / land acquisition",
    thesis: "Avalon is the cleanest MVP deal page because it combines a signed IA, 345kV POI, Houston/Fort Bend load context, and real parcel/flood screening in one corridor.",
    whyNow: "The IA date creates a visible infrastructure clock while nearby large parcels can still be screened before a broader data-center or land-assembly narrative becomes obvious.",
    diligence: ["Confirm POI geometry against transmission owner data", "Shortlist single-owner parcels with road and substation access", "Run county deed and entity checks on top parcel candidates"],
    risks: ["Floodplain and drainage constraints", "Land assemblage competition", "Queue milestone slippage"],
    action: "Prioritize 5 owner calls around the highest-scoring Fort Bend parcels and package the corridor for a data-center siting buyer."
  },
  ercot_bess_014: {
    label: "Harris load-adjacent storage",
    customer: "Houston industrial load / behind-the-meter strategy",
    thesis: "Hobby BESS sits inside a dense Houston industrial and airport-adjacent load corridor where storage may indicate flexible power demand and land optionality.",
    whyNow: "The project has a near-term COD target and demand-corridor context, but the 138kV POI means the commercial case depends on more precise substation and parcel diligence.",
    diligence: ["Geocode the Garden Villas and Chocolate Bayou POI", "Overlay airport, industrial, and flood constraints", "Identify parcels with expansion optionality rather than raw acreage only"],
    risks: ["Lower-voltage POI limits transferability", "Urban parcel fragmentation", "Permitting and flood mitigation complexity"],
    action: "Use this as a Houston infill power-intelligence page, not a raw land-banking page."
  },
  ercot_bess_017: {
    label: "Signed-IA west Texas clock",
    customer: "Infrastructure investor / BESS platform",
    thesis: "Midnight Sun has a signed IA and large storage capacity, making it useful for tracking project maturity and developer behavior even without a near-load data-center signal.",
    whyNow: "The IA clock is active and the COD window is close enough to monitor financing, land control, and equipment procurement signals.",
    diligence: ["Verify interconnection milestone status", "Check county records for land control and tax accounts", "Monitor financing, equipment, and EPC announcements"],
    risks: ["Weaker demand-hub proximity", "138kV POI", "Merchant-storage economics exposure"],
    action: "Treat as a maturity-watch deal for energy investors rather than a data-center land target."
  },
  ercot_bess_005: {
    label: "DFW south 1GW cluster",
    customer: "Data center expansion / power-constrained real estate",
    thesis: "Kickstart Energy Storage VI anchors a major Ellis County storage cluster south of DFW, where large scale and 345kV access can point to future power and land demand.",
    whyNow: "The project is early enough that parcel and ownership work can create an information edge before interconnection maturity and local land activity are broadly noticed.",
    diligence: ["Map both Kickstart Ellis queue positions as one cluster", "Screen 500+ acre parcels near Venus/Navarro transmission paths", "Track annexations, county agendas, and local land purchases"],
    risks: ["Long COD horizon", "Potential duplicate/clustered queue interpretation", "Competition from obvious DFW growth narratives"],
    action: "Build a DFW south corridor page that ranks parcels and local government signals around the paired Kickstart projects."
  },
  ercot_bess_025: {
    label: "Coastal signed-IA optionality",
    customer: "Energy developer / coastal industrial load",
    thesis: "Ross Storage combines a signed IA, 345kV POI, and coastal Texas siting context, making it a good watch target for energy-heavy industrial or port-adjacent demand.",
    whyNow: "Signed IA status suggests project maturity while the coastal location creates a narrower but potentially valuable buyer set around industrial power demand.",
    diligence: ["Validate AEP/Angstrom POI geometry", "Overlay wetlands, flood, and hurricane exposure", "Check port, industrial, and county development signals"],
    risks: ["Coastal buildability constraints", "Specialized buyer universe", "Storm and insurance risk"],
    action: "Position as an industrial-power optionality lead, then enrich with coastal constraints before outreach."
  }
};

const clientGradeReports = {
  ercot_bess_019: {
    title: "Fort Bend 345kV Land Tell",
    status: "Client-grade draft",
    preparedFor: "Data center site selection and land acquisition teams",
    oneLine: "Signed-IA 522 MW BESS signal plus nearby 345kV transmission and large Fort Bend parcels creates a pre-headline land-screening opportunity.",
    sourceLinks: [
      {
        label: "ERCOT Resource Adequacy / GIS reports",
        url: "https://www.ercot.com/gridinfo/resource/index.html",
        use: "Queue, IA, COD, county, generation type, and project capacity source."
      },
      {
        label: "Fort Bend CAD GIS data",
        url: "https://www.fbcad.org/gis-data/",
        use: "Parcel geometry and certified GIS parcel source for the Avalon focus area."
      },
      {
        label: "HIFLD Electric Power Transmission Lines",
        url: "https://catalog.data.gov/dataset/electric-power-transmission-lines",
        use: "Transmission-line overlay and 345kV proximity screen."
      },
      {
        label: "FEMA National Flood Hazard Layer",
        url: "https://www.fema.gov/flood-maps/national-flood-hazard-layer",
        use: "Flood hazard and buildability screen."
      }
    ],
    confidenceFlags: [
      { label: "ERCOT queue facts", level: "High", detail: "Project capacity, county, POI text, COD, and IA date are from ERCOT GIS-style queue fields in the prototype workbook." },
      { label: "Parcel geometry", level: "High", detail: "Fort Bend parcel polygons are sourced from FBCAD GIS data and clipped to the Avalon focus area." },
      { label: "345kV proximity", level: "Medium", detail: "Distance uses HIFLD transmission geometry and should be verified against TSP/substation records before outreach." },
      { label: "Owner/entity names", level: "Medium", detail: "Top parcel owner names, mailing addresses, situs, legal descriptions, and appraised values are imported from FBCAD CamaSummary. Entity trees and deed history still need verification." },
      { label: "Dollar value", level: "Screening only", detail: "Value range is a land-spread screen from developable acreage and proximity/risk factors, not an appraisal or investment recommendation." }
    ],
    valuationMethod: [
      "Start with parcel acreage and remove flood/buildability penalty to estimate developable acreage.",
      "Apply low/base/high land-spread assumptions by buildability and 345kV proximity.",
      "Prioritize parcels where proximity and developable acreage create enough upside to justify owner/entity diligence."
    ],
    nextDiligence: [
      "Validate owner names, mailing addresses, and deed history for the top 10 FBCAD parcel IDs.",
      "Confirm Smithers-to-Bellaire 345kV POI geometry with TSP or ERCOT source records.",
      "Screen county agendas, annexations, MOUs, and local land purchases around the top parcel cluster.",
      "Convert top 3 parcel clusters into owner-call briefs."
    ]
  }
};

const demandHubs = [
  { name: "Dallas-Fort Worth", lat: 32.78, lng: -96.8, mw: "major data center hub" },
  { name: "Houston", lat: 29.76, lng: -95.37, mw: "data center and industrial load hub" },
  { name: "Austin", lat: 30.27, lng: -97.74, mw: "technology load hub" },
  { name: "San Antonio", lat: 29.42, lng: -98.49, mw: "data center growth hub" }
];
