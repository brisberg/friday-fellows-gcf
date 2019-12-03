module.exports = {
  transform: {'^.+\\.tsx?$': 'ts-jest'},
  testPathIgnorePatterns: ['lib/'],
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.(jsx?|tsx?)$',
  // github.com/kulshekhar/ts-jest/issues/259#issuecomment-504088010
  maxWorkers: 1,  // speeds up tests
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testEnvironment: 'node',
  setupFiles: [
    './setupJest.ts',
  ],
}
