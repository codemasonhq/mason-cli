const {expect, test} = require('@oclif/test')
const helpers = require('../../../src/util/helpers')
const fs = require('fs-extra')
const os = require('os')

describe('auth', () => {
  test
  .stdout()
  .stderr()
  .stub(helpers, 'getSSHKey', () => '1234567890')
  .stub(os, 'hostname', () => 'Test.local')
  .stub(fs, 'readJSON', () => {
    return {
      endpoint: 'http://localhost',
      user: {email: 'email@example.com'},
    }
  })
  .stub(fs, 'outputJSON', (path, json) => {
    expect(json).to.have.property('user')
    expect(json.user.email).to.equal('email@example.com')
  })
  .nock('http://localhost/v1', api => api
  .post('/token', {
    email: 'email@example.com',
    password: 'secret123',
    token_name: 'Mason CLI - Test', // eslint-disable-line camelcase
  })
  .reply(200, {
    token: 'abc123',
    user: {
      email: 'email@example.com',
    },
  })
  .post('/git/keys', {
    api_token: 'abc123', // eslint-disable-line camelcase
    title: 'Test.local',
    key: '1234567890',
  })
  .reply(200, [{
    data: {
      token: 'abc123',
    },
  }])
  )
  .command(['auth', '--email', 'email@example.com', '--password', 'secret123'])
  .it('successful login', ctx => {
    expect(ctx.stdout).to.equal('Login to your Codemason account\nLogged in as email@example.com\n')
  })
})
