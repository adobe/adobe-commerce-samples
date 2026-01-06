// ============================================================================
// RESOLVERS - Main Entry Point
// ============================================================================
/**
 * Entry point for API Mesh programmatic resolvers
 *
 * This file is bundled by esbuild into a single resolvers.js file that
 * can be uploaded to Adobe API Mesh. All dependencies are included in the
 * bundle, making it self-contained and ready for deployment.
 *
 * Build process:
 *   npm run build          - Build once
 *   npm run build:watch    - Build and watch for changes
 *
 * Output:
 *   resolvers/resolvers.js - Single bundled file for API Mesh
 */

const resolvers = require('./resolvers');

module.exports = resolvers;
