/**
 * Customer group id Commerce uses for the "ALL GROUPS" tier price row.
 * @type {number}
 */
const ALL_CUSTOMER_GROUPS_ID = 32000;

/**
 * Bundle quantity assumed for the PDP view. Tier rows requiring a higher
 * quantity do not apply to the single-unit price shown on the PDP.
 * @type {number}
 */
const PDP_QUANTITY = 1;

/**
 * Default store timezone used to evaluate the special-price date window when the
 * REST `storeConfigs` timezone is unavailable. Commerce evaluates the window in
 * the website's configured timezone (Stores > Configuration > General > Locale
 * Options > Timezone).
 * @type {string}
 */
const DEFAULT_STORE_TIMEZONE = 'UTC';

/**
 * Shared-state key prefix for cached store timezones, keyed by store view code.
 * @type {string}
 */
const STATE_TIMEZONE_KEY_PREFIX = 'store-timezone:';

/**
 * Cache TTL for a resolved store timezone, in seconds.
 * @type {number}
 */
const TIMEZONE_CACHE_TTL_SECONDS = 86400;

/**
 * Returns a copy of a ProductViewPrice with its `final.amount.value`
 * multiplied by the given factor. Untouched fields are preserved.
 * @param {object} price An option product's ProductViewPrice.
 * @param {number} factor The effective bundle discount factor.
 * @returns {object} The adjusted price.
 */
function withDiscountedFinal(price, factor) {
    const value = price?.final?.amount?.value;
    if (typeof value !== 'number' || !Number.isFinite(value)) {
        return price;
    }

    return {
        ...price,
        final: {
            ...price.final,
            amount: {
                ...price.final.amount,
                value: value * factor,
            },
        },
    };
}

/**
 * Reads a REST custom attribute value by code.
 * @param {object} product The REST product response.
 * @param {string} code The attribute code.
 * @returns {*} The attribute value, or undefined.
 */
function readCustomAttribute(product, code) {
    return product.custom_attributes?.find(
        attribute => attribute.attribute_code === code,
    )?.value;
}

/**
 * Formats a Date as the store-local "YYYY-MM-DD" date in the given IANA
 * timezone, so it can be compared lexicographically against Commerce's
 * date-only special-price bounds.
 * @param {Date} date The instant to format.
 * @param {string} timeZone An IANA timezone name.
 * @returns {string} The store-local date.
 */
function formatDateInZone(date, timeZone) {
    const parts = new Intl.DateTimeFormat('en', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).formatToParts(date);

    const map = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
    return `${map.year}-${map.month}-${map.day}`;
}

/**
 * The current store-local date as "YYYY-MM-DD". Falls back to UTC when the
 * configured timezone is invalid.
 * @param {string} timeZone An IANA timezone name.
 * @returns {string} The store-local date.
 */
function currentDateInZone(timeZone) {
    const date = new Date();
    try {
        return formatDateInZone(date, timeZone);
    } catch {
        return formatDateInZone(date, 'UTC');
    }
}

/**
 * Extracts the date part ("YYYY-MM-DD") from a Commerce date value. Special
 * price bounds are date-only in the admin and arrive from REST with a midnight
 * time, e.g. "2026-10-15 00:00:00". The time component is intentionally dropped
 * so the window is compared at day granularity: a to-date of "2026-10-15" then
 * stays active through the whole of Oct 15 (rather than expiring at its
 * midnight). Returns null when absent/blank.
 * @param {*} value The date value.
 * @returns {string|null} The date part, or null.
 */
function commerceDateOnly(value) {
    if (value == null) {
        return null;
    }
    const text = String(value).trim();
    if (!text) {
        return null;
    }
    // Drop the time component (" 00:00:00" or "T00:00:00"), keeping the date.
    return text.split(/[ T]/)[0];
}

/**
 * Whether the special price is active on the given store-local date. Special
 * price bounds are date-only; both the from-date and to-date are inclusive (the
 * special runs through the entire to-date day), matching Commerce.
 * @param {object} product The REST product response.
 * @param {string} currentDate Store-local "YYYY-MM-DD".
 * @returns {boolean}
 */
function isSpecialPriceActive(product, currentDate) {
    const from = commerceDateOnly(readCustomAttribute(product, 'special_from_date'));
    const to = commerceDateOnly(readCustomAttribute(product, 'special_to_date'));
    if (from != null && currentDate < from) {
        return false;
    }
    if (to != null && currentDate > to) {
        return false;
    }
    return true;
}

/**
 * The bundle special_price factor. For bundles special_price is the percentage
 * PAID (80 => pay 80%). Returns null when absent, non-numeric, out of the 0-100
 * range, or outside its date window; such values are ignored rather than
 * breaking the response.
 * @param {object} product The REST product response.
 * @param {string} currentDate Store-local "YYYY-MM-DD".
 * @returns {number|null} The factor, or null.
 */
function specialPriceFactor(product, currentDate) {
    const raw = readCustomAttribute(product, 'special_price');
    if (raw == null || (typeof raw === 'string' && !raw.trim())) {
        return null;
    }
    const specialPrice = Number(raw);
    if (!Number.isFinite(specialPrice) || specialPrice < 0 || specialPrice > 100) {
        return null;
    }
    if (!isSpecialPriceActive(product, currentDate)) {
        return null;
    }
    return specialPrice / 100;
}

/**
 * The most favorable applicable tier/customer-group price factor. For bundles
 * the tier `percentage_value` is the percentage OFF (50 => pay 50%). Only rows
 * for the ALL GROUPS id or the request's customer group, requiring no more than
 * the PDP quantity, are considered. The request's group arrives as a SHA-1 hash
 * of the group id (the Catalog Service `Magento-Customer-Group` scheme), so a
 * row matches a specific group when `sha1(String(customer_group_id))` equals it.
 * Rows with a non-numeric or out-of-range `percentage_value` are ignored.
 * @param {object} product The REST product response.
 * @param {string|null} customerGroupHash The request's customer group hash.
 * @returns {Promise<number|null>} The best (lowest) tier factor, or null.
 */
async function tierPriceFactor(product, customerGroupHash) {
    const tiers = product.tier_prices;
    if (!Array.isArray(tiers) || tiers.length === 0) {
        return null;
    }

    let best = null;
    for (const tier of tiers) {
        const qty = Number(tier?.qty);
        if (Number.isFinite(qty) && qty > PDP_QUANTITY) {
            continue;
        }

        const group = Number(tier?.customer_group_id);
        let applies = group === ALL_CUSTOMER_GROUPS_ID;
        if (!applies && customerGroupHash && Number.isInteger(group)) {
            applies = (await sha1Hex(String(group))) === customerGroupHash;
        }
        if (!applies) {
            continue;
        }

        const percentOff = Number(tier?.extension_attributes?.percentage_value);
        if (!Number.isFinite(percentOff) || percentOff < 0 || percentOff > 100) {
            continue;
        }

        const factor = (100 - percentOff) / 100;
        if (best == null || factor < best) {
            best = factor;
        }
    }
    return best;
}

/**
 * Computes the lowercase hex SHA-1 of a string, matching Commerce's
 * `Magento-Customer-Group` hashing (the same `crypto.subtle` scheme the
 * storefront uses). Returns null when the SHA-1 primitive is unavailable, which
 * disables group-specific tier matching (ALL GROUPS still works).
 * @param {string} value The value to hash.
 * @returns {Promise<string|null>} The lowercase hex digest, or null.
 */
async function sha1Hex(value) {
    const subtle = globalThis.crypto?.subtle;
    if (!subtle) {
        return null;
    }
    const digest = await subtle.digest('SHA-1', new TextEncoder().encode(value));
    return Array.from(new Uint8Array(digest))
        .map(byte => byte.toString(16).padStart(2, '0'))
        .join('');
}

/**
 * Reads the request's customer group hash from headers. The mesh normalizes
 * header keys to lowercase, as the mesh.json header templates rely on. The value
 * is the SHA-1 hash Catalog Service sends in `Magento-Customer-Group`.
 * @param {object} context The resolver context.
 * @returns {string|null} The lowercase customer group hash, or null.
 */
function resolveCustomerGroupHash(context) {
    const raw = context?.headers?.['magento-customer-group'];
    if (typeof raw !== 'string' || !raw.trim()) {
        return null;
    }
    return raw.trim().toLowerCase();
}

/**
 * Reads a cached store timezone from shared state.
 * @param {object} context The resolver context.
 * @param {string} key The state key.
 * @returns {string|null} The cached timezone, or null.
 */
function readCachedTimezone(context, key) {
    try {
        const raw = context?.state?.get(key);
        if (!raw) {
            return null;
        }
        const parsed = JSON.parse(raw);
        return typeof parsed?.timezone === 'string' ? parsed.timezone : null;
    } catch {
        return null;
    }
}

/**
 * Writes a resolved store timezone to shared state. Best-effort.
 * @param {object} context The resolver context.
 * @param {string} key The state key.
 * @param {string} timezone The timezone to cache.
 */
function cacheTimezone(context, key, timezone) {
    try {
        context?.state?.put(key, { timezone }, { ttl: TIMEZONE_CACHE_TTL_SECONDS });
    } catch {
        // Caching is best-effort.
    }
}

/**
 * Resolves the store timezone used to evaluate the special-price window, from
 * the REST `storeConfigs` timezone for the request's store view (cached),
 * falling back to UTC.
 * @param {object} context The resolver context.
 * @param {object} info The resolver info.
 * @returns {Promise<string>} An IANA timezone name.
 */
async function resolveStoreTimezone(context, info) {
    const storeViewCode = context?.headers?.['magento-store-view-code'];
    const cacheKey = `${STATE_TIMEZONE_KEY_PREFIX}${storeViewCode || 'default'}`;

    const cached = readCachedTimezone(context, cacheKey);
    if (cached) {
        return cached;
    }

    try {
        const configs = await context.CommerceRest.Query.storeConfigs({
            root: {},
            args: {},
            context,
            info,
            selectionSet: '{ code timezone }',
        });

        if (Array.isArray(configs) && configs.length > 0) {
            const match = storeViewCode
                ? configs.find(config => config?.code === storeViewCode)
                : null;
            const timezone = (match || configs[0])?.timezone;
            if (typeof timezone === 'string' && timezone.trim()) {
                cacheTimezone(context, cacheKey, timezone.trim());
                return timezone.trim();
            }
        }
    } catch {
        // storeConfigs may be unavailable; fall back to the default.
    }

    return DEFAULT_STORE_TIMEZONE;
}

module.exports = {
    resolvers: {
        ComplexProductView: {
            options: {
                selectionSet: `{
                    sku
                    options {
                        values {
                            __typename
                            ... on ProductViewOptionValueProduct {
                                product {
                                    __typename
                                    sku
                                    price {
                                        regular { amount { value currency } }
                                        final { amount { value currency } }
                                        roles
                                    }
                                }
                            }
                        }
                    }
                }`,
                resolve: async (root, args, context, info) => {
                    const options = root.options;

                    if (!options || typeof root.sku !== 'string' || !root.sku.trim()) {
                        return options;
                    }

                    const product = await context.CommerceRest.Query.productData({
                        root,
                        args: { sku: root.sku },
                        context,
                        info,
                        selectionSet: `{
                            type_id
                            custom_attributes { attribute_code value }
                            tier_prices {
                                customer_group_id
                                qty
                                value
                                extension_attributes { percentage_value website_id }
                            }
                        }`,
                    });

                    // The parent identifies the discount; only its option prices change.
                    if (!product || product.type_id !== 'bundle') {
                        return options;
                    }

                    const currentDate = currentDateInZone(await resolveStoreTimezone(context, info));
                    const customerGroupHash = resolveCustomerGroupHash(context);

                    // Resolve the final price as the most favorable (lowest) of
                    // the applicable mechanisms.
                    const candidates = [
                        specialPriceFactor(product, currentDate),
                        await tierPriceFactor(product, customerGroupHash),
                    ].filter(factor => factor != null);

                    if (candidates.length === 0) {
                        return options;
                    }

                    const factor = Math.min(...candidates);
                    if (factor >= 1) {
                        return options;
                    }

                    return options.map(option => {
                        if (!option?.values) {
                            return option;
                        }

                        return {
                            ...option,
                            values: option.values.map(value => {
                                if (
                                    value?.__typename !== 'ProductViewOptionValueProduct' ||
                                    !value.product?.price
                                ) {
                                    return value;
                                }

                                return {
                                    ...value,
                                    product: {
                                        ...value.product,
                                        price: withDiscountedFinal(value.product.price, factor),
                                    },
                                };
                            }),
                        };
                    });
                },
            },
        },
    },
};

// Exposed for unit testing. The mesh only consumes `resolvers`.
module.exports.sha1Hex = sha1Hex;
module.exports.resolveCustomerGroupHash = resolveCustomerGroupHash;
module.exports.formatDateInZone = formatDateInZone;
module.exports.commerceDateOnly = commerceDateOnly;
module.exports.isSpecialPriceActive = isSpecialPriceActive;
module.exports.specialPriceFactor = specialPriceFactor;
module.exports.tierPriceFactor = tierPriceFactor;
