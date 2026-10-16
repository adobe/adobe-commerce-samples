'use strict';

// Tests for tierPriceFactor: it picks the most favorable applicable tier row.
// Bundle tier `percentage_value` is the percentage OFF, so the factor is
// (100 - percentage_value) / 100. A row applies when it targets ALL GROUPS
// (32000) or when sha1(String(customer_group_id)) equals the request's
// Magento-Customer-Group header, and when its qty does not exceed the PDP
// quantity (1).

const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');

const { tierPriceFactor } = require('../additional-resolvers');

const ALL_GROUPS = 32000;

/** The Magento-Customer-Group header value for a numeric group id. */
const groupHeader = id => crypto.createHash('sha1').update(String(id)).digest('hex');

/** Builds a product payload with the given tier_prices rows. */
const product = tiers => ({ type_id: 'bundle', custom_attributes: [], tier_prices: tiers });

/** Shorthand for a tier row. */
const tier = (customerGroupId, percentageValue, qty = 1) => ({
    customer_group_id: customerGroupId,
    qty,
    value: 0,
    extension_attributes: { percentage_value: percentageValue },
});

test('an ALL GROUPS tier applies to every customer, with or without a header', async () => {
    const tiers = product([tier(ALL_GROUPS, 50)]);
    assert.equal(await tierPriceFactor(tiers, groupHeader(0)), 0.5, 'guest');
    assert.equal(await tierPriceFactor(tiers, groupHeader(2)), 0.5, 'other group');
    assert.equal(await tierPriceFactor(tiers, null), 0.5, 'no header');
});

test('a group-specific tier matches only its group via sha1(groupId)', async () => {
    const tiers = product([tier(2, 40)]); // group 2, 40% off -> 0.6
    assert.equal(await tierPriceFactor(tiers, groupHeader(2)), 0.6, 'group 2 matches');
    assert.equal(await tierPriceFactor(tiers, groupHeader(1)), null, 'other group ignored');
    assert.equal(await tierPriceFactor(tiers, null), null, 'no header ignored');
});

test('a tier requiring more than the PDP quantity is ignored', async () => {
    const tiers = product([tier(ALL_GROUPS, 90, 5)]); // qty 5
    assert.equal(await tierPriceFactor(tiers, groupHeader(0)), null);
});

test('the most favorable eligible tier wins', async () => {
    const tiers = product([
        tier(ALL_GROUPS, 10), // 0.9 for everyone
        tier(2, 40),          // 0.6 for group 2
        tier(ALL_GROUPS, 90, 5), // qty 5 -> ignored
    ]);
    assert.equal(await tierPriceFactor(tiers, groupHeader(2)), 0.6, 'group 2 takes the 40% row');
    assert.equal(await tierPriceFactor(tiers, groupHeader(1)), 0.9, 'group 1 only sees the ALL GROUPS row');
});

test('tierPriceFactor is null when there are no tier rows', async () => {
    assert.equal(await tierPriceFactor(product([]), groupHeader(0)), null);
    assert.equal(await tierPriceFactor({ type_id: 'bundle', custom_attributes: [] }, groupHeader(0)), null);
});

test('tierPriceFactor ignores a row with an out-of-range percentage', async () => {
    // The out-of-range row is skipped; the valid ALL GROUPS row still applies.
    const tiers = product([tier(ALL_GROUPS, 150), tier(ALL_GROUPS, 40)]);
    assert.equal(await tierPriceFactor(tiers, groupHeader(0)), 0.6, 'uses the valid 40% row');
    // When the only row is out of range, nothing applies.
    assert.equal(await tierPriceFactor(product([tier(ALL_GROUPS, 150)]), groupHeader(0)), null);
});
