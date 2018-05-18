module.exports = {
  parserOptions: {
    ecmaVersion: 6,
  },
  env: {
    node: true,
    mocha: true,
  },
  'extends': ['eslint:recommended', 'google'],
  rules: {
    'no-shadow': 'error',
  },
}
