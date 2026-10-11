export interface ClassificationResult {
  category: string;
  confidence: number;
  reason: string;
}

export function classifyLine(description: string, gradeParsed?: string): ClassificationResult {
  const text = description.toLowerCase();

  // 1. Prestressed / High Tensile -> Reinforced concrete (will be blocked in evaluate)
  if (
    text.includes('prestressed') ||
    text.includes('post-tensioned') ||
    text.includes('high tensile')
  ) {
    return {
      category: 'reinforced concrete',
      confidence: 0.98,
      reason: 'Keywords: prestressed / post-tensioned elements',
    };
  }

  // 2. Lean concrete (<M15)
  if (
    text.includes('lean concrete') ||
    text.includes('pcc 1:4:8') ||
    text.includes('pcc 1:3:6') ||
    text.includes('mud mat') ||
    (text.includes('pcc') && (gradeParsed === 'M7.5' || gradeParsed === 'M10' || text.includes('1:4:8') || text.includes('1:3:6'))) ||
    (gradeParsed && (gradeParsed === 'M7.5 (1:4:8)' || gradeParsed === 'M10 (1:3:6)' || gradeParsed === 'M10'))
  ) {
    return {
      category: 'lean concrete (<M15)',
      confidence: 0.95,
      reason: 'Keywords: lean concrete / PCC low grade (<M15)',
    };
  }

  // 3. Reinforced Concrete (RCC)
  if (
    text.includes('rcc') ||
    text.includes('reinforced cement concrete') ||
    text.includes('column') ||
    text.includes('beam') ||
    text.includes('slab') ||
    text.includes('footing') ||
    text.includes('retaining wall')
  ) {
    return {
      category: 'reinforced concrete',
      confidence: 0.94,
      reason: 'Keywords: structural RCC element (beam/slab/column/rebar)',
    };
  }

  // 4. Plain Concrete (PCC)
  if (
    text.includes('plain cement concrete') ||
    text.includes('plain concrete') ||
    (text.includes('pcc') && !text.includes('lean')) ||
    text.includes('bed concrete') ||
    text.includes('1:2:4') ||
    gradeParsed === 'M15 (1:2:4)'
  ) {
    return {
      category: 'plain concrete',
      confidence: 0.91,
      reason: 'Keywords: plain cement concrete (PCC unreinforced)',
    };
  }

  // 5. Pavers
  if (
    text.includes('paver') ||
    text.includes('paving block') ||
    text.includes('interlocking block') ||
    text.includes('grass paver')
  ) {
    return {
      category: 'pavers',
      confidence: 0.96,
      reason: 'Keywords: precast interlocking paver blocks',
    };
  }

  // 6. Kerbstones
  if (
    text.includes('kerb') ||
    text.includes('curb') ||
    text.includes('kerbstone') ||
    text.includes('channel stone')
  ) {
    return {
      category: 'kerbstones',
      confidence: 0.95,
      reason: 'Keywords: road edge kerbstones / channels',
    };
  }

  // 7. Granular Sub-base (GSB)
  if (
    text.includes('sub-base') ||
    text.includes('sub base') ||
    text.includes('gsb') ||
    text.includes('wbm') ||
    text.includes('wet mix macadam') ||
    text.includes('granular sub base')
  ) {
    return {
      category: 'granular sub-base',
      confidence: 0.93,
      reason: 'Keywords: granular sub-base (GSB) / road base',
    };
  }

  // 8. Backfill / Screened Soil
  if (
    text.includes('backfill') ||
    text.includes('filling') ||
    text.includes('earthwork') ||
    text.includes('plinth filling') ||
    text.includes('screened soil') ||
    text.includes('excavation backfill')
  ) {
    return {
      category: 'backfill/screened soil',
      confidence: 0.92,
      reason: 'Keywords: earthwork plinth filling / backfill',
    };
  }

  // 9. Masonry / Plaster Sand
  if (
    text.includes('plaster') ||
    text.includes('mortar') ||
    text.includes('masonry sand') ||
    text.includes('river sand') ||
    text.includes('fine aggregate for plaster')
  ) {
    return {
      category: 'masonry/plaster sand',
      confidence: 0.88,
      reason: 'Keywords: sand for plastering / masonry mortar',
    };
  }

  // 10. Tiles
  if (
    text.includes('tile') ||
    text.includes('terrazzo') ||
    text.includes('cement tile') ||
    text.includes('chequered tile')
  ) {
    return {
      category: 'tiles',
      confidence: 0.90,
      reason: 'Keywords: precast cement / terrazzo tiles',
    };
  }

  // Default fallback
  return {
    category: 'ineligible/manual review',
    confidence: 0.5,
    reason: 'No clear civil engineering standard rule match; sent to manual review',
  };
}
