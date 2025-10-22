const esbuild = require('esbuild');
const path = require('path');

const buildOptions = {
    entryPoints: {
        'resolvers': path.join(__dirname, 'src/index.js')
    },
    bundle: true,
    platform: 'node',
    target: 'node18',
    format: 'cjs',
    outdir: __dirname, // Output to resolvers/ directory (where this config lives)
    outExtension: { '.js': '.js' },
    external: [], // Add any modules you don't want bundled
    sourcemap: false,
    minify: false, // Keep readable for debugging in mesh
    keepNames: true, // Preserve function names for better error messages
    logLevel: 'info'
};

async function build() {
    try {
        await esbuild.build(buildOptions);
        console.log('✓ Resolvers built successfully');
    } catch (error) {
        console.error('✗ Build failed:', error);
        process.exit(1);
    }
}

async function watch() {
    const context = await esbuild.context(buildOptions);
    await context.watch();
    console.log('👀 Watching for changes...');
}

// Run build or watch based on command line argument
if (process.argv.includes('--watch')) {
    watch();
} else {
    build();
}
