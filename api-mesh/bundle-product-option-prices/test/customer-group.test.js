'use strict';

// Tests for customer-group hashing and header parsing (sha1Hex,
// resolveCustomerGroupHash) — the bridge between the REST numeric
// customer_group_id and the SHA-1 Magento-Customer-Group header.

const test = require('node:test');
const assert = require('node:assert/strict');

const { sha1Hex, resolveCustomerGroupHash } = require('../additional-resolvers');

test('sha1Hex matches the Magento-Customer-Group scheme (sha1 of the id string)', async () => {
    assert.equal(await sha1Hex('0'), 'b6589fc6ab0dc82cf12099d1c2d40ab994e8410c');
    assert.equal(await sha1Hex('1'), '356a192b7913b04c54574d18c28d46e6395428ab');
    assert.equal(await sha1Hex('2'), 'da4b9237bacccdf19c0760cab7aec4a8359010b0');
});

test('resolveCustomerGroupHash trims and lowercases the header', () => {
    assert.equal(resolveCustomerGroupHash({ headers: { 'magento-customer-group': '  ABCDEF123  ' } }), 'abcdef123');
});

test('resolveCustomerGroupHash returns null when absent or blank', () => {
    assert.equal(resolveCustomerGroupHash({ headers: { 'magento-customer-group': '   ' } }), null);
    assert.equal(resolveCustomerGroupHash({ headers: {} }), null);
    assert.equal(resolveCustomerGroupHash({}), null);
    assert.equal(resolveCustomerGroupHash(null), null);
});
