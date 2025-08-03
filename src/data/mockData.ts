import { Tournament, Match, News, Analytics, Beyblade, BeybladePart, BeybladePartOption } from '../types';
import type { AssistBladePart, BitPart, BladePart, LockchipPart, RatchetPart } from '../types';

export const mockTournaments: Tournament[] = [
  {
    id: '1',
    name: 'Way of the Phoenix - 15k Pool Open',
    description: 'Bring your A game, risk it all!',
    date: '2025-08-03',
    location: 'SM Center Ormoc',
    maxParticipants: 32,
    currentParticipants: 28,
    status: 'upcoming',
    registrationDeadline: '2025-08-01',
    prizePool: '15k Pesos Price Pool',
    beybladesPerPlayer: 3,
    playersPerTeam: 1
  },
  {
    id: '2',
    name: 'Way of the Phoenix - ABC Mode',
    description: 'Test your theory.',
    date: '2025-08-10',
    location: 'SM Center Ormoc',
    maxParticipants: 16,
    currentParticipants: 12,
    status: 'upcoming',
    registrationDeadline: '2025-08-08',
    prizePool: 'SharkScale Deck Set, Cx-09 Random Boosters',
    beybladesPerPlayer: 3,
    playersPerTeam: 1
  },
  {
    id: '3',
    name: 'Way of the Phoenix - All ATK Mode',
    description: 'No stamina, no balance, no defense. ALL ATTACK.',
    date: '2025-08-17',
    location: 'SM Center Ormoc',
    maxParticipants: 24,
    currentParticipants: 24,
    status: 'completed',
    registrationDeadline: '2025-08-15',
    prizePool: 'AeroPegasus, and many more!',
    beybladesPerPlayer: 3,
    playersPerTeam: 1
  }
];

export const mockMatches: Match[] = [
  {
    id: '1',
    tournamentId: '1',
    player1: 'BladeSpinner',
    player2: 'TornadoMaster',
    round: 'Quarter Finals',
    status: 'completed',
    winner: 'BladeSpinner',
    startTime: '2024-01-05T14:00:00',
    endTime: '2024-01-05T14:15:00',
    score: '3-1'
  },
  {
    id: '2',
    tournamentId: '1',
    player1: 'StormBreaker',
    player2: 'IronDefender',
    round: 'Semi Finals',
    status: 'in_progress',
    startTime: '2024-01-05T15:00:00'
  },
  {
    id: '3',
    tournamentId: '1',
    player1: 'FlamePhoenix',
    player2: 'ThunderBolt',
    round: 'Finals',
    status: 'pending'
  }
];

export const mockNews: News[] = [
  {
    id: '1',
    title: 'Way of the Phoenix - 15k Pool Open',
    content: 'Season 0 begins now. Start strong, earn points, and begin your climb on the official Way of the Phoenix Leaderboard using the BBNZ Dynamic Points System. Every round counts. Every win gets you closer to the championship.',
    author: 'Z-Axis Toinkz',
    publishDate: '2024-01-20',
    category: 'tournament',
    featured: true
  },
  {
    id: '2',
    title: 'New Tournament Rules Update',
    content: 'Important updates to tournament regulations have been implemented. All participants should review the new guidelines before registering for upcoming events. Key changes include updated time limits and equipment specifications.',
    author: 'CatholicSchool',
    publishDate: '2024-01-18',
    category: 'announcement',
    featured: false
  },
  {
    id: '3',
    title: 'Community Spotlight: Rising Stars',
    content: 'Meet the new generation of talented bladers making waves in our community. This month we feature three promising young competitors who have shown exceptional skill and sportsmanship.',
    author: 'Kaede',
    publishDate: '2024-01-15',
    category: 'news',
    featured: true
  }
];

export const mockAnalytics: Analytics = {
  totalTournaments: 12,
  activePlayers: 156,
  completedMatches: 89,
  upcomingEvents: 3
};

// Mock data matching Supabase table structures
export const mockBlades: BladePart[] = [
  // Basic Line Blades
  { Blades: 'Dran Sword', Line: 'Basic', Type: 'Attack', Attack: 8, Defense: 6, Stamina: 5 },
  { Blades: 'Hells Scythe', Line: 'Basic', Type: 'Attack', Attack: 9, Defense: 4, Stamina: 6 },
  { Blades: 'Wizard Arrow', Line: 'Basic', Type: 'Stamina', Attack: 6, Defense: 7, Stamina: 8 },
  { Blades: 'Knight Shield', Line: 'Basic', Type: 'Defense', Attack: 5, Defense: 9, Stamina: 7 },
  
  // Unique Line Blades
  { Blades: 'Dran Buster', Line: 'Unique', Type: 'Attack', Attack: 9, Defense: 7, Stamina: 6 },
  { Blades: 'Hells Chain', Line: 'Unique', Type: 'Attack', Attack: 10, Defense: 5, Stamina: 7 },
  { Blades: 'Wizard Rod', Line: 'Unique', Type: 'Stamina', Attack: 7, Defense: 8, Stamina: 9 },
  { Blades: 'Knight Lance', Line: 'Unique', Type: 'Defense', Attack: 6, Defense: 10, Stamina: 8 },
  
  // X-Over Line Blades
  { Blades: 'Phoenix Wing', Line: 'X-Over', Type: 'Balance', Attack: 8, Defense: 8, Stamina: 8 },
  { Blades: 'Shark Edge', Line: 'X-Over', Type: 'Attack', Attack: 9, Defense: 6, Stamina: 7 },
  { Blades: 'Cobalt Dragoon', Line: 'X-Over', Type: 'Stamina', Attack: 7, Defense: 7, Stamina: 9 },
  
  // Custom Line Main Blades
  { Blades: 'Leon Crest', Line: 'Custom', Type: 'Attack', Attack: 9, Defense: 7, Stamina: 6 },
  { Blades: 'Tyranno Beat', Line: 'Custom', Type: 'Attack', Attack: 10, Defense: 6, Stamina: 5 },
  { Blades: 'Soar Phoenix', Line: 'Custom', Type: 'Balance', Attack: 7, Defense: 8, Stamina: 8 },
];

export const mockRatchets: RatchetPart[] = [
  { Ratchet: '3-60', Attack: 2, Defense: 3, Stamina: 2 },
  { Ratchet: '4-60', Attack: 3, Defense: 2, Stamina: 3 },
  { Ratchet: '5-60', Attack: 1, Defense: 4, Stamina: 3 },
  { Ratchet: '3-70', Attack: 2, Defense: 2, Stamina: 4 },
  { Ratchet: '4-70', Attack: 3, Defense: 3, Stamina: 2 },
  { Ratchet: '1-60', Attack: 4, Defense: 1, Stamina: 2 },
  { Ratchet: '2-60', Attack: 3, Defense: 2, Stamina: 3 },
  { Ratchet: '1-70', Attack: 4, Defense: 2, Stamina: 1 },
  { Ratchet: '2-70', Attack: 3, Defense: 3, Stamina: 2 },
  { Ratchet: '9-60', Attack: 2, Defense: 4, Stamina: 3 },
  { Ratchet: '7-60', Attack: 3, Defense: 3, Stamina: 3 },
  { Ratchet: '9-70', Attack: 1, Defense: 5, Stamina: 2 },
  { Ratchet: '5-80', Attack: 2, Defense: 3, Stamina: 4 },
  { Ratchet: '7-80', Attack: 3, Defense: 2, Stamina: 4 },
  { Ratchet: '9-80', Attack: 1, Defense: 4, Stamina: 4 },
];

export const mockBits: BitPart[] = [
  { Bit: 'Flat', Shortcut: 'F', Type: 'Attack', Attack: 4, Defense: 1, Stamina: 2, Dash: 0, 'Burst Res': 2 },
  { Bit: 'Point', Shortcut: 'P', Type: 'Stamina', Attack: 1, Defense: 2, Stamina: 5, Dash: 0, 'Burst Res': 3 },
  { Bit: 'Ball', Shortcut: 'B', Type: 'Defense', Attack: 2, Defense: 4, Stamina: 3, Dash: 0, 'Burst Res': 4 },
  { Bit: 'Orb', Shortcut: 'O', Type: 'Balance', Attack: 3, Defense: 3, Stamina: 3, Dash: 0, 'Burst Res': 3 },
  { Bit: 'Needle', Shortcut: 'N', Type: 'Stamina', Attack: 1, Defense: 3, Stamina: 4, Dash: 0, 'Burst Res': 2 },
  { Bit: 'Rush', Shortcut: 'R', Type: 'Attack', Attack: 5, Defense: 1, Stamina: 1, Dash: 2, 'Burst Res': 1 },
  { Bit: 'Taper', Shortcut: 'T', Type: 'Balance', Attack: 3, Defense: 3, Stamina: 3, Dash: 1, 'Burst Res': 3 },
  { Bit: 'High Taper', Shortcut: 'HT', Type: 'Balance', Attack: 3, Defense: 2, Stamina: 4, Dash: 1, 'Burst Res': 2 },
  { Bit: 'Low Flat', Shortcut: 'LF', Type: 'Attack', Attack: 4, Defense: 2, Stamina: 2, Dash: 1, 'Burst Res': 2 },
  { Bit: 'Gear Flat', Shortcut: 'GF', Type: 'Attack', Attack: 4, Defense: 2, Stamina: 3, Dash: 2, 'Burst Res': 2 },
  { Bit: 'Gear Ball', Shortcut: 'GB', Type: 'Defense', Attack: 2, Defense: 5, Stamina: 2, Dash: 1, 'Burst Res': 4 },
  { Bit: 'Gear Point', Shortcut: 'GP', Type: 'Stamina', Attack: 1, Defense: 3, Stamina: 5, Dash: 1, 'Burst Res': 3 },
  { Bit: 'Unite', Shortcut: 'U', Type: 'Balance', Attack: 3, Defense: 3, Stamina: 4, Dash: 2, 'Burst Res': 3 },
  { Bit: 'Xtreme', Shortcut: 'X', Type: 'Attack', Attack: 5, Defense: 1, Stamina: 1, Dash: 3, 'Burst Res': 1 },
  { Bit: 'Drift', Shortcut: 'Dr', Type: 'Stamina', Attack: 1, Defense: 2, Stamina: 5, Dash: 2, 'Burst Res': 4 },
];

export const mockLockchips: LockchipPart[] = [
  { Lockchip: 'Dran', Attack: 1, Defense: 1, Stamina: 1 },
  { Lockchip: 'Leon', Attack: 2, Defense: 1, Stamina: 0 },
  { Lockchip: 'Tyranno', Attack: 2, Defense: 0, Stamina: 1 },
  { Lockchip: 'Soar', Attack: 1, Defense: 1, Stamina: 1 },
  { Lockchip: 'Crimson', Attack: 1, Defense: 2, Stamina: 0 },
  { Lockchip: 'Azure', Attack: 0, Defense: 1, Stamina: 2 },
  { Lockchip: 'Golden', Attack: 1, Defense: 1, Stamina: 1 },
  { Lockchip: 'Silver', Attack: 0, Defense: 2, Stamina: 1 },
];

export const mockAssistBlades: AssistBladePart[] = [
  { 'Assist Blade': '1-80A', 'Assist Blade Name': 'A', Type: 'Attack', Height: '80', Attack: 3, Defense: 1, Stamina: 1 },
  { 'Assist Blade': '2-80A', 'Assist Blade Name': 'A', Type: 'Attack', Height: '80', Attack: 3, Defense: 1, Stamina: 1 },
  { 'Assist Blade': '3-80A', 'Assist Blade Name': 'A', Type: 'Attack', Height: '80', Attack: 3, Defense: 1, Stamina: 1 },
  { 'Assist Blade': '1-80D', 'Assist Blade Name': 'D', Type: 'Defense', Height: '80', Attack: 1, Defense: 3, Stamina: 1 },
  { 'Assist Blade': '2-80D', 'Assist Blade Name': 'D', Type: 'Defense', Height: '80', Attack: 1, Defense: 3, Stamina: 1 },
  { 'Assist Blade': '3-80D', 'Assist Blade Name': 'D', Type: 'Defense', Height: '80', Attack: 1, Defense: 3, Stamina: 1 },
  { 'Assist Blade': '1-80S', 'Assist Blade Name': 'S', Type: 'Stamina', Height: '80', Attack: 1, Defense: 1, Stamina: 3 },
  { 'Assist Blade': '2-80S', 'Assist Blade Name': 'S', Type: 'Stamina', Height: '80', Attack: 1, Defense: 1, Stamina: 3 },
  { 'Assist Blade': '3-80S', 'Assist Blade Name': 'S', Type: 'Stamina', Height: '80', Attack: 1, Defense: 1, Stamina: 3 },
];

export const mockBeyblades: Beyblade[] = [
  {
    id: '1',
    name: 'Crimson Dragon',
    playerId: '1',
    tournamentId: '1',
    bladeLine: 'Basic',
    registeredAt: '2024-01-16T10:30:00'
  },
  {
    id: '2',
    name: 'Storm Breaker',
    playerId: '1',
    tournamentId: '1',
    bladeLine: 'Unique',
    registeredAt: '2024-01-16T10:35:00'
  },
  {
    id: '3',
    name: 'Phoenix Wing X',
    playerId: '2',
    tournamentId: '1',
    bladeLine: 'X-Over',
    registeredAt: '2024-01-17T14:20:00'
  }
];

export const mockBeybladeParts: BeybladePart[] = [
  { id: '1', beybladeId: '1', partType: 'Blade', partName: 'Dran Sword' },
  { id: '2', beybladeId: '1', partType: 'Ratchet', partName: '3-60' },
  { id: '3', beybladeId: '1', partType: 'Bit', partName: 'Flat' },
  
  { id: '4', beybladeId: '2', partType: 'Blade', partName: 'Dran Buster' },
  { id: '5', beybladeId: '2', partType: 'Ratchet', partName: '1-60' },
  { id: '6', beybladeId: '2', partType: 'Bit', partName: 'Rush' },
  
  { id: '7', beybladeId: '3', partType: 'Blade', partName: 'Phoenix Wing' },
  { id: '8', beybladeId: '3', partType: 'Ratchet', partName: '9-60' },
  { id: '9', beybladeId: '3', partType: 'Bit', partName: 'Gear Flat' },
];