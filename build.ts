import { build, BuildOptions } from 'esbuild';
import { nodeExternalsPlugin } from 'esbuild-node-externals';

const commonOptions = <BuildOptions>{
  entryPoints: ['src/index.ts'],
  bundle: true,
  logLevel: 'info',
  color: true,
  sourcemap: true,
  legalComments: 'external'
}

// Needn't import npm packages
build({
  ...commonOptions,
  outfile: 'dist/node-html-markdown.js',
  format: 'esm',
  target: 'node10',
  platform: 'node',
  plugins: [ nodeExternalsPlugin({
    packagePath: './package.json'
  }) ]
}).then()

build({
  ...commonOptions,
  outfile: 'dist/node-html-markdown.cjs',
  format: 'cjs',
  target: 'node10',
  platform: 'node',
  plugins: [ nodeExternalsPlugin({
    packagePath: './package.json'
  }) ]
}).then()

/**
 * Browser bundles are use for import/require directly from browser scripts.
 * The usage from node that need browser bundle should use the default and bundle by themselves
 */
build({
  ...commonOptions,
  outfile: 'dist/node-html-markdown.browser.js',
  format: 'esm',
  target: 'es2017',
  platform: 'browser'
}).then()

build({
  ...commonOptions,
  outfile: 'dist/node-html-markdown.browser.cjs',
  format: 'cjs',
  target: 'es2017',
  platform: 'browser'
}).then()
