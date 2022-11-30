import { build, BuildOptions } from 'esbuild';
import { nodeExternalsPlugin } from 'esbuild-node-externals';


(async function () {
  const commonOptions = <BuildOptions>{
    entryPoints: [ 'src/index.ts' ],
    bundle: true,
    target: 'es2017',
    logLevel: 'info',
    color: true,
    // minify: true,
    sourcemap: true,
    legalComments: 'external'
  }

  // Needn't import npm packages
  await build({
    ...commonOptions,
    outfile: 'dist/node-html-markdown.js',
    format: 'esm',
    platform: 'node',
    plugins: [ nodeExternalsPlugin({
      packagePath: './package.json'
    }) ]
  }).then()

  await build({
    ...commonOptions,
    outfile: 'dist/node-html-markdown.cjs',
    format: 'cjs',
    platform: 'node',
    plugins: [ nodeExternalsPlugin({
      packagePath: './package.json'
    }) ]
  }).then()

  /**
   * Browser bundles are use for import/require directly from browser scripts.
   * The usage from node that need browser bundle should use the default and bundle by themselves
   */
  await build({
    ...commonOptions,
    outfile: 'dist/node-html-markdown.browser.js',
    format: 'esm',
    platform: 'browser',
    define: {
      'process.env.LOG_PERF': process.env.LOG_PERF ?? 'false'
    }
  }).then()

  await build({
    ...commonOptions,
    outfile: 'dist/node-html-markdown.browser.cjs',
    format: 'cjs',
    platform: 'browser',
    define: {
      'process.env.LOG_PERF': process.env.LOG_PERF ?? 'false'
    }
  }).then()
})()
