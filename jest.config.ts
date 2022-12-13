import type { Config } from 'jest';


const config: Config = {
  testEnvironment: 'node',
  testRegex: '.*test\\.tsx?$',
  preset: 'ts-jest/presets/default-esm',
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/test/tsconfig.json'
      }
    ]
  },
  globals: {
    '__IS_BROWSER__': false
  },
  modulePaths: [ '<rootDir>' ],
  testTimeout: 10000,
  roots: [ '<rootDir>' ],
  collectCoverageFrom: [ 'src/**/*.ts' ]
}

// noinspection JSUnusedGlobalSymbols
export default config;
