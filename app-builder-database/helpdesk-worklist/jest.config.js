module.exports = {
  testMatch: ['<rootDir>/test/**/*.test.js'],
  transform: {
    '^.+\\.js$': ['babel-jest', {
      presets: [['@babel/preset-env', { targets: { node: 'current' } }]],
      plugins: ['@babel/plugin-transform-react-jsx']
    }]
  },
  moduleNameMapper: {
    '\\.css$': '<rootDir>/test/style-mock.js'
  }
}
