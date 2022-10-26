module.exports = {
  testEnvironment: "node",
  preset: 'ts-jest',
  testRegex: '.*(test|spec)\\.tsx?$',
  moduleFileExtensions: [ 'ts', 'tsx', 'js', 'jsx', 'json', 'node' ],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/test/tsconfig.json'
      }
    ]
  },
  modulePaths: [ "<rootDir>" ],
  testTimeout: 10000,
  roots: [ '<rootDir>' ],
  collectCoverageFrom: [ "src/**/*.ts" ]
}
