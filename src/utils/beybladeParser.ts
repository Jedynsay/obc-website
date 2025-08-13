// Beyblade name parsing utility
export interface ParsedBeyblade {
  blade?: string;
  ratchet?: string;
  bit?: string;
  lockchip?: string;
  mainBlade?: string;
  assistBlade?: string;
  isCustom: boolean;
}

export interface AllPartsData {
  blades: any[];
  ratchets: any[];
  bits: any[];
  lockchips: any[];
  assistBlades: any[];
}

export interface PartStats {
  name: string;
  usage: number;
  wins: number;
  losses: number;
  winRate: number;
  wilson: number;
}

export interface BuildStats {
  build: string;
  player: string;
  wins: number;
  losses: number;
  winRate: number;
  wilson: number;
}

// Wilson score calculation for statistical confidence
export function calculateWilsonScore(wins: number, total: number, z: number = 1.96): number {
  if (total === 0) return 0;
  const phat = wins / total;
  const denom = 1 + z * z / total;
  const center = phat + z * z / (2 * total);
  const spread = z * Math.sqrt((phat * (1 - phat) + z * z / (4 * total)) / total);
  return (center - spread) / denom;
}

// Check if a Beyblade is Custom type by looking for lockchip prefix
function tryParseStandardBeyblade(beybladeName: string, partsData: AllPartsData): ParsedBeyblade | null {
  console.log(`⚙️ PARSER: Attempting Standard parsing for: "${beybladeName}"`);
  
  let remainingName = beybladeName;
  
  // 1. Find bit (suffix) - try both shortcuts and full names
  const bitResult = findBit(remainingName, partsData.bits);
  if (!bitResult) {
    console.log(`❌ PARSER: Standard parsing failed - no bit found`);
    return null;
  }
  
  remainingName = remainingName.slice(0, remainingName.length - bitResult.bitName.length).trim();
  console.log(`⚙️ PARSER: After bit removal: "${remainingName}"`);
  
  // 2. Find ratchet (suffix)
  const ratchetResult = findRatchet(remainingName, partsData.ratchets);
  if (!ratchetResult) {
    console.log(`❌ PARSER: Standard parsing failed - no ratchet found`);
    return null;
  }
  
  remainingName = remainingName.slice(0, remainingName.length - ratchetResult.ratchetName.length).trim();
  console.log(`⚙️ PARSER: After ratchet removal: "${remainingName}"`);
  
  // 3. What's left should be the blade - check Basic and Unique lines
  const bladeResult = findBlade(remainingName, partsData.blades.filter(blade => 
    blade.Line === 'Basic' || blade.Line === 'Unique'
  ));
  if (!bladeResult) {
    console.log(`❌ PARSER: Standard parsing failed - no Basic/Unique blade found for "${remainingName}"`);
    return null;
  }
  
  const result = {
    isCustom: false,
    blade: bladeResult.bladeName,
    ratchet: ratchetResult.ratchetName,
    bit: bitResult.bitName
  };
  
  console.log(`✅ PARSER: Standard parsing successful:`, result);
  return result;
}

function tryParseCustomBeyblade(beybladeName: string, partsData: AllPartsData): ParsedBeyblade | null {
  console.log(`🔧 PARSER: Attempting Custom parsing for: "${beybladeName}"`);
  
  let remainingName = beybladeName;
  
  // 1. Find lockchip (prefix)
  const lockchipResult = findLockchip(beybladeName, partsData.lockchips);
  if (!lockchipResult) {
    console.log(`❌ PARSER: Custom parsing failed - no lockchip found`);
    return null;
  }
  
  remainingName = beybladeName.slice(lockchipResult.lockchipName.length);
  console.log(`🔧 PARSER: After lockchip removal: "${remainingName}"`);
  
  // 2. Find bit (suffix)
  const bitResult = findBit(remainingName, partsData.bits);
  if (!bitResult) {
    console.log(`❌ PARSER: Custom parsing failed - no bit found`);
    return null;
  }
  
  remainingName = remainingName.slice(0, remainingName.length - bitResult.bitName.length).trim();
  console.log(`🔧 PARSER: After bit removal: "${remainingName}"`);
  
  // 3. Find ratchet (suffix)
  const ratchetResult = findRatchet(remainingName, partsData.ratchets);
  if (!ratchetResult) {
    console.log(`❌ PARSER: Custom parsing failed - no ratchet found`);
    return null;
  }
  
  remainingName = remainingName.slice(0, remainingName.length - ratchetResult.ratchetName.length).trim();
  console.log(`🔧 PARSER: After ratchet removal: "${remainingName}"`);
  
  // 4. Find assist blade (suffix of remaining)
  const assistBladeResult = findAssistBlade(remainingName, partsData.assistBlades);
  if (!assistBladeResult) {
    console.log(`❌ PARSER: Custom parsing failed - no assist blade found`);
    return null;
  }
  
  remainingName = remainingName.slice(assistBladeResult.assistBladeName.length).trim();
  console.log(`🔧 PARSER: After assist blade removal: "${remainingName}"`);
  
  // 5. What's left should be the main blade - check Custom line
  const mainBladeResult = findBlade(remainingName, partsData.blades.filter(blade => 
    blade.Line === 'Custom'
  ));
  if (!mainBladeResult) {
    console.log(`❌ PARSER: Custom parsing failed - no Custom main blade found for "${remainingName}"`);
    return null;
  }
  
  const result = {
    isCustom: true,
    lockchip: lockchipResult.lockchipName,
    mainBlade: mainBladeResult.bladeName,
    assistBlade: assistBladeResult.assistBladeName,
    ratchet: ratchetResult.ratchetName,
    bit: bitResult.bitName
  };
  
  console.log(`✅ PARSER: Custom parsing successful:`, result);
  return result;
}

// Find bit by trying both shortcuts and full names</parameter>
function findBit(remainingName: string, bits: any[]): { bit: any; bitName: string } | null {
  console.log(`🔍 PARSER: Finding bit in "${remainingName}"`);
  console.log(`🔍 PARSER: Available bits:`, bits.map(b => ({ shortcut: b.Shortcut, full: b.Bit })));
  
  // Sort bits by length (longest first) to match longer names first
  const sortedBits = [...bits].sort((a, b) => {
    const aName = a.Shortcut || a.Bit || '';
    const bName = b.Shortcut || b.Bit || '';
    return bName.length - aName.length;
  });
  
  // Try to match by shortcut first
  for (const bit of sortedBits) {
    const shortcut = bit.Shortcut;
    if (shortcut && remainingName.endsWith(shortcut)) {
      console.log(`✅ PARSER: Found bit by shortcut: ${shortcut}`);
      return { bit, bitName: shortcut };
    }
  }
  
  // Try to match by full name
  for (const bit of sortedBits) {
    const fullName = bit.Bit;
    if (fullName && remainingName.endsWith(fullName)) {
      console.log(`✅ PARSER: Found bit by full name: ${fullName} → ${bit.Shortcut || fullName}`);
      return { bit, bitName: bit.Shortcut || fullName };
    }
  }
  
  console.log(`❌ PARSER: No bit found in "${remainingName}"`);
  return null;
}

// Find ratchet by name
function findRatchet(remainingName: string, ratchets: any[]): { ratchet: any; ratchetName: string } | null {
  console.log(`🔍 PARSER: Finding ratchet in "${remainingName}"`);
  
  // Sort ratchets by length (longest first)
  const sortedRatchets = [...ratchets].sort((a, b) => {
    const aName = a.Ratchet || '';
    const bName = b.Ratchet || '';
    return bName.length - aName.length;
  });
  
  for (const ratchet of sortedRatchets) {
    const ratchetName = ratchet.Ratchet;
    if (ratchetName && remainingName.endsWith(ratchetName)) {
      console.log(`✅ PARSER: Found ratchet: ${ratchetName}`);
      return { ratchet, ratchetName };
    }
  }
  
  console.log(`❌ PARSER: No ratchet found in "${remainingName}"`);
  return null;
}

// Find blade by name
function findBlade(remainingName: string, blades: any[]): { blade: any; bladeName: string } | null {
  console.log(`🔍 PARSER: Finding blade in "${remainingName}"`);
  console.log(`🔍 PARSER: Available blades:`, blades.map(b => ({ name: b.Blades, line: b.Line })));
  
  for (const blade of blades) {
    const bladeName = blade.Blades;
    if (bladeName && remainingName === bladeName) {
      console.log(`✅ PARSER: Found blade: ${bladeName} (${blade.Line} line)`);
      return { blade, bladeName };
    }
  }
  
  console.log(`❌ PARSER: No blade found for "${remainingName}" in available blades`);
  return null;
}

// Find lockchip by prefix
function findLockchip(beybladeName: string, lockchips: any[]): { lockchip: any; lockchipName: string } | null {
  console.log(`🔍 PARSER: Finding lockchip in "${beybladeName}"`);
  
  // Sort lockchips by length (longest first)
  const sortedLockchips = [...lockchips].sort((a, b) => {
    const aName = a.Lockchip || '';
    const bName = b.Lockchip || '';
    return bName.length - aName.length;
  });
  
  for (const lockchip of sortedLockchips) {
    const lockchipName = lockchip.Lockchip;
    if (lockchipName && beybladeName.startsWith(lockchipName)) {
      console.log(`✅ PARSER: Found lockchip: ${lockchipName}`);
      return { lockchip, lockchipName };
    }
  }
  
  console.log(`❌ PARSER: No lockchip found in "${beybladeName}"`);
  return null;
}

// Find assist blade by name
function findAssistBlade(remainingName: string, assistBlades: any[]): { assistBlade: any; assistBladeName: string } | null {
  console.log(`🔍 PARSER: Finding assist blade in "${remainingName}"`);
  
  for (const assistBlade of assistBlades) {
    const assistBladeName = assistBlade['Assist Blade'];
    if (assistBladeName && remainingName.startsWith(assistBladeName)) {
      console.log(`✅ PARSER: Found assist blade: ${assistBladeName}`);
      return { assistBlade, assistBladeName };
    }
  }
  
// Main parsing function
export function parseBeybladeName(beybladeName: string, partsData: AllPartsData): ParsedBeyblade {
  if (!beybladeName || !beybladeName.trim()) {
    console.log(`❌ PARSER: Empty beyblade name`);
    return { isCustom: false };
  }
  
  console.log(`\n🎯 PARSER: Starting to parse "${beybladeName}" - Priority: Standard first, then Custom`);
  
  // 1. Try Standard parsing first (Basic/Unique Blade + Ratchet + Bit)
  const standardResult = tryParseStandardBeyblade(beybladeName, partsData);
  if (standardResult) {
    console.log(`🎯 PARSER: Successfully parsed as Standard Beyblade`);
    return standardResult;
  }
  
  console.log(`🎯 PARSER: Standard parsing failed, trying Custom parsing...`);
  
  // 2. Try Custom parsing (Lockchip + Main Blade + Assist Blade + Ratchet + Bit)
  const customResult = tryParseCustomBeyblade(beybladeName, partsData);
  if (customResult) {
    console.log(`🎯 PARSER: Successfully parsed as Custom Beyblade`);
    return customResult;
  }
  
  console.log(`❌ PARSER: Both Standard and Custom parsing failed for "${beybladeName}"`);
  return { isCustom: false };
}