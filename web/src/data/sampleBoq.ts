export interface RawBOQRow {
  itemNo: string;
  description: string;
  unit: string;
  qty: number;
  rate?: number;
  confidence?: number;
}

export const SAMPLE_CAMPUS_ROAD_BOQ: RawBOQRow[] = [
  {
    itemNo: "1.01",
    description: "Earthwork excavation in all soils and backfilling in foundation trenches and plinth with selected screened excavated soil",
    unit: "m3",
    qty: 250,
    rate: 180,
    confidence: 0.98
  },
  {
    itemNo: "2.01",
    description: "Providing and laying in position Cement Concrete of M10 grade (nominal mix 1:3:6) / lean concrete under foundation raft and mud mat",
    unit: "m3",
    qty: 140,
    rate: 4200,
    confidence: 0.96
  },
  {
    itemNo: "2.02",
    description: "Plain Cement Concrete (PCC) 1:2:4 (1 cement : 2 coarse sand : 4 graded stone aggregate 20mm nominal size) in levelling course under paving",
    unit: "m3",
    qty: 95,
    rate: 4850,
    confidence: 0.94
  },
  {
    itemNo: "3.01",
    description: "Reinforced Cement Concrete (RCC) work in grade M20 in foundations, plinth beams, and grade slab (excluding shuttering & reinforcement)",
    unit: "m3",
    qty: 180,
    rate: 6100,
    confidence: 0.95
  },
  {
    itemNo: "3.02",
    description: "Reinforced Cement Concrete (RCC) work in grade M25 in suspended floor slabs, staircases, and lintel bands",
    unit: "m3",
    qty: 220,
    rate: 6450,
    confidence: 0.93
  },
  {
    itemNo: "3.03",
    description: "Reinforced Cement Concrete (RCC) high-strength columns and shear walls in design mix grade M35",
    unit: "m3",
    qty: 85,
    rate: 7300,
    confidence: 0.96
  },
  {
    itemNo: "3.04",
    description: "Prestressed precast concrete girders and bridge deck slabs with high-tensile wire strands",
    unit: "m3",
    qty: 50,
    rate: 14500,
    confidence: 0.97
  },
  {
    itemNo: "4.01",
    description: "Steel reinforcement for RCC work including straightening, cutting, bending and placing in position Thermo-Mechanically Treated (TMT) bars Fe-500D",
    unit: "t",
    qty: 75,
    rate: 62000,
    confidence: 0.99
  },
  {
    itemNo: "4.02",
    description: "Centering and shuttering including strutting, propping using waterproof commercial ply 12mm thick for concrete surfaces",
    unit: "m2",
    qty: 620,
    rate: 420,
    confidence: 0.97
  },
  {
    itemNo: "5.01",
    description: "Construction of Granular Sub-Base (GSB) with well-graded crushed aggregate grading III for internal campus road network",
    unit: "m3",
    qty: 350,
    rate: 1850,
    confidence: 0.92
  },
  {
    itemNo: "5.02",
    description: "Providing and laying 80mm thick precast C.C. interlocking paver blocks (M30 grade) over 50mm bed of screening sand for parking & walkways",
    unit: "m2",
    qty: 1200,
    rate: 680,
    confidence: 0.94
  },
  {
    itemNo: "5.03",
    description: "Providing and fixing precast concrete kerbstones (450x300x150mm) along road edges set in cement mortar 1:3",
    unit: "m",
    qty: 650,
    rate: 340,
    confidence: 0.91
  },
  {
    itemNo: "6.01",
    description: "15mm cement plaster in single coat on rough interior brickwork with cement mortar 1:6 (1 cement : 6 fine sand)",
    unit: "m3",
    qty: 45,
    rate: 3800,
    confidence: 0.62 // Intentional low confidence OCR cell for testing inline edit!
  },
  {
    itemNo: "6.02",
    description: "Precast cement concrete chequered terrazzo flooring tiles 25mm thick laid over 20mm bed of cement mortar 1:4",
    unit: "m2",
    qty: 450,
    rate: 590,
    confidence: 0.89
  }
];
