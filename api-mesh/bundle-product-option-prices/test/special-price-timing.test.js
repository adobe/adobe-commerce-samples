'use strict';

// Tests for the timing logic: timezone application, Commerce date extraction,
// and the special-price active window. Special-price bounds are date-only, so
// the window is evaluated at day granularity. These are deterministic;
// formatDateInZone takes an explicit instant and isSpecialPriceActive takes an
// explicit store-local date, so no clock mocking is needed. We assert that
// formatDateInZone applies the timezone (our wiring) but do not re-test Intl's
// DST database.

const test = require('node:test');
const assert = require('node:assert/strict');

const {
    formatDateInZone,
    commerceDateOnly,
    isSpecialPriceActive,
    specialPriceFactor,
} = require('../additional-resolvers');

/** Builds a product payload with special-price dates. */
function specialProduct({ special, from, to } = {}) {
    const customAttributes = [];
    if (special !== undefined) customAttributes.push({ attribute_code: 'special_price', value: special });
    if (from !== undefined) customAttributes.push({ attribute_code: 'special_from_date', value: from });
    if (to !== undefined) customAttributes.push({ attribute_code: 'special_to_date', value: to });
    return { custom_attributes: customAttributes };
}

// --- formatDateInZone: timezone is applied ---------------------------------

test('formatDateInZone rolls to a different calendar day across the date line', () => {
    // Early-UTC instant is still the previous day in Los Angeles.
    assert.equal(formatDateInZone(new Date('2026-10-15T06:30:00Z'), 'America/Los_Angeles'), '2026-10-14');
    // Late-UTC instant is already the next day in Tokyo.
    assert.equal(formatDateInZone(new Date('2026-10-15T20:30:00Z'), 'Asia/Tokyo'), '2026-10-16');
});

// --- commerceDateOnly ------------------------------------------------------

test('commerceDateOnly extracts the date part from any Commerce date form', () => {
    assert.equal(commerceDateOnly('2026-10-15'), '2026-10-15', 'date only');
    assert.equal(commerceDateOnly('2026-10-15 00:00:00'), '2026-10-15', 'space datetime');
    assert.equal(commerceDateOnly('2026-10-15T08:30:00'), '2026-10-15', 'T datetime');
    assert.equal(commerceDateOnly('  2026-10-15 08:30:00  '), '2026-10-15', 'trimmed');
});

test('commerceDateOnly returns null for missing values', () => {
    assert.equal(commerceDateOnly(''), null);
    assert.equal(commerceDateOnly('   '), null);
    assert.equal(commerceDateOnly(null), null);
    assert.equal(commerceDateOnly(undefined), null);
});

// --- isSpecialPriceActive: day-granularity window --------------------------

test('isSpecialPriceActive is active from the from-date through the to-date, and inactive outside it', () => {
    const product = specialProduct({ from: '2026-10-11 00:00:00', to: '2026-10-15 00:00:00' });
    assert.equal(isSpecialPriceActive(product, '2026-10-13'), true, 'inside the window');
    assert.equal(isSpecialPriceActive(product, '2026-10-11'), true, 'active on the from-date');
    assert.equal(isSpecialPriceActive(product, '2026-10-15'), true, 'active through the whole to-date day');
    assert.equal(isSpecialPriceActive(product, '2026-10-10'), false, 'day before from');
    assert.equal(isSpecialPriceActive(product, '2026-10-16'), false, 'day after to');
});

test('isSpecialPriceActive handles open-ended windows', () => {
    assert.equal(isSpecialPriceActive(specialProduct({ from: '2026-10-11 00:00:00' }), '2030-01-01'), true, 'no to-date');
    assert.equal(isSpecialPriceActive(specialProduct({ to: '2026-10-15 00:00:00' }), '2000-01-01'), true, 'no from-date');
    assert.equal(isSpecialPriceActive(specialProduct({}), '2026-10-15'), true, 'no dates = always active');
});

// --- specialPriceFactor: window gates the factor ---------------------------

test('specialPriceFactor returns the factor only within the window', () => {
    const product = specialProduct({ special: '80', from: '2026-10-11 00:00:00', to: '2026-10-15 00:00:00' });
    assert.equal(specialPriceFactor(product, '2026-10-13'), 0.8, 'active');
    assert.equal(specialPriceFactor(product, '2026-10-15'), 0.8, 'last day still active');
    assert.equal(specialPriceFactor(product, '2026-10-10'), null, 'before window');
    assert.equal(specialPriceFactor(product, '2026-10-16'), null, 'after window');
});

test('specialPriceFactor ignores an out-of-range percentage', () => {
    const product = special => specialProduct({ special, from: '2000-01-01 00:00:00', to: '2999-01-01 00:00:00' });
    assert.equal(specialPriceFactor(product('150'), '2026-10-13'), null, 'above 100');
    assert.equal(specialPriceFactor(product('-5'), '2026-10-13'), null, 'below 0');
    assert.equal(specialPriceFactor(product('abc'), '2026-10-13'), null, 'non-numeric');
});
