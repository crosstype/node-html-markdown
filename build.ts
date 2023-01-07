import { build, BuildOptions } from 'esbuild';
import { nodeExternalsPlugin } from 'esbuild-node-externals';


(async function () {
  const commonOptions = <BuildOptions>{
    entryPoints: [ 'src/index.ts' ],
    bundle: true,
    target: 'es2017',
    logLevel: 'info',
    color: true,
    minifySyntax: true,
    sourcemap: true,
    legalComments: 'external'
  }

  // Needn't import npm packages
  await build({
    ...commonOptions,
    outfile: 'dist/node-html-markdown.js',
    format: 'esm',
    platform: 'node',
    define: {
      '__IS_BROWSER__': 'false'
    },
    banner: {
      js: `import {createRequire} from 'module'; const require = createRequire(import.meta.url);`
    },
    plugins: [ nodeExternalsPlugin({
      packagePath: './package.json'
    }) ]
  })

  await build({
    ...commonOptions,
    outfile: 'dist/node-html-markdown.cjs',
    format: 'cjs',
    platform: 'node',
    define: {
      '__IS_BROWSER__': 'false'
    },
    plugins: [ nodeExternalsPlugin({
      packagePath: './package.json'
    }) ]
  })

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
      // This will remove the perfStart/End after minified by esbuild.
      'process.env.LOG_PERF': process.env.LOG_PERF ?? 'false',
      // This will remove the node-html-parser usage
      '__IS_BROWSER__': 'true'
    },
    external: [ 'node-html-parser' ]
  })

  await build({
    ...commonOptions,
    outfile: 'dist/node-html-markdown.browser.cjs',
    format: 'cjs',
    platform: 'browser',
    define: {
      'process.env.LOG_PERF': process.env.LOG_PERF ?? 'false',
      '__IS_BROWSER__': 'true'
    },
    external: [ 'node-html-parser' ]
  })
})()
