/**
 * Generates a valid Tambola ticket:
 * - 3 rows, 9 columns
 * - 15 numbers total (5 per row)
 * - Col 1: 1-9, Col 2: 10-19, ..., Col 9: 80-90
 */
function generateTicket() {
  const ticket = Array.from({ length: 3 }, () => Array(9).fill(null));

  // Column ranges
  const colRanges = [
    [1, 9], [10, 19], [20, 29], [30, 39], [40, 49],
    [50, 59], [60, 69], [70, 79], [80, 90],
  ];

  // Pick numbers per column (at least 1, max 3, total 5 per row)
  const colNums = colRanges.map(([min, max]) => {
    const pool = [];
    for (let i = min; i <= max; i++) pool.push(i);
    return pool.sort(() => Math.random() - 0.5);
  });

  // Assign columns to rows ensuring 5 per row
  // Step 1: Each column gets 1 number in a random row
  const colAssignments = Array.from({ length: 9 }, () => []);
  const rowCounts = [0, 0, 0];

  // Determine how many numbers per column (1 or 2)
  // We need 15 total across 9 columns: some cols get 2, some get 1
  // Specifically 6 cols get 2 and 3 cols get 1... actually 5+5+5=15, 9 cols
  // Distribution: some cols have 1 num, some have 2
  // 9 cols, 15 nums → 6 cols with 2, 3 cols with 1... wait: 6*2+3*1=15 ✓

  const colCounts = Array(9).fill(1);
  let extra = 6;
  const indices = [...Array(9).keys()].sort(() => Math.random() - 0.5);
  for (let i = 0; i < extra; i++) colCounts[indices[i]]++;

  // For each column, pick colCounts[c] numbers
  const selectedNums = colNums.map((nums, c) =>
    nums.slice(0, colCounts[c]).sort((a, b) => a - b)
  );

  // Assign numbers to rows per column ensuring 5 per row
  // Use backtracking-free greedy with row balancing
  const assignments = Array.from({ length: 3 }, () => Array(9).fill(null));

  for (let col = 0; col < 9; col++) {
    const nums = selectedNums[col];
    if (nums.length === 1) {
      // Find row with fewest numbers that still needs numbers
      const row = rowCounts.indexOf(Math.min(...rowCounts));
      assignments[row][col] = nums[0];
      rowCounts[row]++;
    } else {
      // 2 numbers: assign to 2 different rows with fewest counts
      const sorted = [...rowCounts.keys()].sort((a, b) => rowCounts[a] - rowCounts[b]);
      assignments[sorted[0]][col] = nums[0];
      assignments[sorted[1]][col] = nums[1];
      rowCounts[sorted[0]]++;
      rowCounts[sorted[1]]++;
    }
  }

  // Fix: if any row doesn't have exactly 5, redistribute (simple post-fix)
  // In practice the greedy above gives 5 each for valid distributions
  return assignments;
}

function validateTicketClaim(ticket, markedNumbers, claimType, drawnNumbers) {
  const flatTicket = ticket.flat().filter(n => n !== null);
  const validMarked = markedNumbers.filter(n => drawnNumbers.includes(n) && flatTicket.includes(n));

  switch (claimType) {
    case 'jaldi5': {
      return validMarked.length >= 5;
    }
    case 'topLine': {
      const topRow = ticket[0].filter(n => n !== null);
      return topRow.every(n => validMarked.includes(n));
    }
    case 'middleLine': {
      const midRow = ticket[1].filter(n => n !== null);
      return midRow.every(n => validMarked.includes(n));
    }
    case 'bottomLine': {
      const botRow = ticket[2].filter(n => n !== null);
      return botRow.every(n => validMarked.includes(n));
    }
    case 'fullHouse': {
      return flatTicket.every(n => validMarked.includes(n));
    }
    default:
      return false;
  }
}

function generateRoomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

module.exports = { generateTicket, validateTicketClaim, generateRoomCode };
