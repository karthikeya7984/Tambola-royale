const { validateTicketClaim } = require('../src/utils/gameUtils');

// Helper to build a simple ticket with 5 numbers per row
const ticket = [
  [1, null, null, 2, null, 3, null, 4, 5],
  [6, null, 7, null, 8, null, 9, 10, null],
  [11, 12, null, 13, 14, null, null, null, 15],
];

describe('validateTicketClaim', () => {
  test('jaldi5 returns true when 5 valid marked numbers', () => {
    const marked = [1,2,3,4,5];
    const drawn = [1,2,3,4,5,6,7,8,9];
    expect(validateTicketClaim(ticket, marked, 'jaldi5', drawn)).toBe(true);
  });

  test('topLine requires all top row numbers', () => {
    const marked = [1,2,3,4,5];
    const drawn = [1,2,3,4,5];
    expect(validateTicketClaim(ticket, marked, 'topLine', drawn)).toBe(true);
    // missing one
    expect(validateTicketClaim(ticket, [1,2,3,4], 'topLine', drawn)).toBe(false);
  });

  test('middleLine requires all middle row numbers', () => {
    const marked = [6,7,8,9,10];
    const drawn = [6,7,8,9,10];
    expect(validateTicketClaim(ticket, marked, 'middleLine', drawn)).toBe(true);
    expect(validateTicketClaim(ticket, [6,7,8,9], 'middleLine', drawn)).toBe(false);
  });

  test('bottomLine requires all bottom row numbers', () => {
    const marked = [11,12,13,14,15];
    const drawn = [11,12,13,14,15];
    expect(validateTicketClaim(ticket, marked, 'bottomLine', drawn)).toBe(true);
    expect(validateTicketClaim(ticket, [11,12,13,14], 'bottomLine', drawn)).toBe(false);
  });

  test('fullHouse requires all 15 numbers', () => {
    const marked = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15];
    const drawn = [...marked];
    expect(validateTicketClaim(ticket, marked, 'fullHouse', drawn)).toBe(true);
    expect(validateTicketClaim(ticket, marked.slice(0,14), 'fullHouse', drawn)).toBe(false);
  });

  test('invalid claim type returns false', () => {
    expect(validateTicketClaim(ticket, [1,2,3], 'unknown', [1,2,3])).toBe(false);
  });
});
