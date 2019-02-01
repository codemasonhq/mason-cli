const {expect, test} = require('@oclif/test')
const helpers = require('../../../src/util/helpers')
const fs = require('fs-extra')
const os = require('os')

describe('auth:logout', () => {
  test
  .stdout()
  .stderr()
  .stub(helpers, 'getSSHKey', () => '1234567890')
  .stub(os, 'hostname', () => 'Test.local')
  .stub(fs, 'readJsonSync', () => {
    return {
      endpoint: 'http://localhost',
      user: {token: 'abc123', email: 'email@example.com'},
    }
  })
  .stub(fs, 'outputJSON', (path, json) => {
    expect(json).to.have.property('endpoint')
    expect(json.endpoint).to.equal('http://localhost')
  })
  .nock('http://localhost/v1', api => {
    api.reqHeaders = {authorization: 'Bearer abc123'}
    return api
    .delete('/git/keys?title=Test.local&key=1234567890')
    .reply(200)
  })
  .command(['auth:logout'])
  .it('successful logout', ctx => {
    expect(ctx.stdout).to.equal('')
  })
})
