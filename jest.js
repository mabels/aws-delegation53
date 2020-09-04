module.exports = {
    testEnvironment: "node",
    transform: {
      '^.+\\.tsx?$': 'ts-jest'
    },
    testRegex: '.*(\\.)test\\.tsx?$',
    moduleFileExtensions: [
      'ts',
      'tsx',
      'js',
      'jsx',
      'json',
      'node'
    ]
  };
