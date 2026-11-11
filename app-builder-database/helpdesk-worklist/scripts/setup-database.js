/**
 * Post-deploy hook: initializes ticket collection validation and indexes.
 * Runs after `aio app deploy`.
 *
 * Reads IMS credentials from environment variables (set in .env):
 *   IMS_OAUTH_S2S_CLIENT_ID, IMS_OAUTH_S2S_CLIENT_SECRET,
 *   IMS_OAUTH_S2S_ORG_ID, IMS_OAUTH_S2S_SCOPES
 */
const { Core } = require('@adobe/aio-sdk');
const libDb = require('@adobe/aio-lib-db');
const { TICKETS_COLLECTION, TICKET_COLLECTION_OPTIONS, TICKETS_INDEXES } = require('../actions/lib/db.js');

function parseScopes() {
  try {
    return JSON.parse(process.env.IMS_OAUTH_S2S_SCOPES || '[]');
  } catch {
    return [];
  }
}

function isIndexExistsError(err) {
  return (
    err.code === 85 ||
    err.code === 86 ||
    /already exists|duplicate/i.test(err.message || '')
  );
}

async function ensureCollectionIndexes(collection, collectionName, indexes) {
  let created = 0;
  let skipped = 0;

  for (const idx of indexes) {
    const indexName = idx.options?.name || idx.name;
    const indexOptions = idx.options || { name: idx.name };
    try {
      await collection.createIndex(idx.key, indexOptions);
      created++;
      console.log(`  [${collectionName}] Created: ${indexName}`);
    } catch (err) {
      if (isIndexExistsError(err)) {
        skipped++;
      } else {
        console.warn(
          `  [${collectionName}] Failed to create ${indexName}: ${err.message}`
        );
      }
    }
  }

  return { created, skipped };
}

const postDeployDbSetup = async () => {
  const clientId = process.env.IMS_OAUTH_S2S_CLIENT_ID;
  const clientSecret = process.env.IMS_OAUTH_S2S_CLIENT_SECRET;
  const orgId = process.env.IMS_OAUTH_S2S_ORG_ID;
  const region = process.env.DB_REGION;
  const namespace =
    process.env.AIO_runtime_namespace || process.env.__OW_NAMESPACE;

  // ensure __OW_NAMESPACE is set so generateAccessToken can auto-detect stage vs prod IMS
  if (namespace && !process.env.__OW_NAMESPACE) {
    process.env.__OW_NAMESPACE = namespace;
  }

  if (!clientId || !clientSecret || !orgId) {
    console.warn(
      '[post-deploy-db-setup] IMS credentials not found in environment — skipping DB setup.'
    );
    console.warn(
      '[post-deploy-db-setup] Set IMS_OAUTH_S2S_CLIENT_ID, IMS_OAUTH_S2S_CLIENT_SECRET, IMS_OAUTH_S2S_ORG_ID in .env'
    );
    return;
  }

  console.log('[post-deploy-db-setup] Ensuring database indexes...');

  let client;
  try {
    const { generateAccessToken } = Core.AuthClient;
    const scopes = parseScopes();
    const token = await generateAccessToken({
      clientId,
      clientSecret,
      orgId,
      scopes,
    });
    const db = await libDb.init({
      token: token.access_token,
      region,
      ow: { namespace },
    });
    client = await db.connect();
  } catch (error) {
    console.error(
      `[post-deploy-db-setup] DB connection failed: ${error.message}`
    );
    console.error(
      '[post-deploy-db-setup] Indexes were NOT created — check the configuration and redeploy.'
    );
    return;
  }


  // createCollection fails with 409 if the collection exists, so only create it when
  // missing. This keeps the hook safe to rerun on every deploy.
  const existing = await client.listCollections({ name: TICKETS_COLLECTION });
  if (existing.length === 0) {
    await client.createCollection(TICKETS_COLLECTION, TICKET_COLLECTION_OPTIONS);
    console.log(`[post-deploy-db-setup] Created ${TICKETS_COLLECTION} with schema validation.`);
  } else {
    console.log(`[post-deploy-db-setup] ${TICKETS_COLLECTION} already exists; skipping creation.`);
  }

  const tickets = await ensureCollectionIndexes(
    client.collection(TICKETS_COLLECTION),
    TICKETS_COLLECTION,
    TICKETS_INDEXES
  );

  console.log(
    `[post-deploy-db-setup] Done. ${TICKETS_COLLECTION}: ${tickets.created} created, ${tickets.skipped} existed.`
  );

  try {
    await client.close();
  } catch {
    // ignore close errors
  }
};

module.exports = postDeployDbSetup;
