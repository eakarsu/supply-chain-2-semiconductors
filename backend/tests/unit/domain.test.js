const { checksum, text, timestamp } = require('../../src/domain');

test('canonical checksum is independent of object key order', () => expect(checksum({ b: 2, a: { d: 4, c: 3 } })).toBe(checksum({ a: { c: 3, d: 4 }, b: 2 })));
test('text rejects control characters', () => expect(() => text('unsafe\u0000value', 'value')).toThrow(/required/));
test('timestamp rejects impossible input', () => expect(() => timestamp('not-a-date', 'time')).toThrow(/ISO-8601/));
