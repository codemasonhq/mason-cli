const {expect, test} = require('@oclif/test')
const helpers = require('../../../src/util/helpers')
const fs = require('fs-extra')

describe('apps:create', () => {
  test
  .stub(fs, 'readJsonSync', () => {
    return {
      endpoint: 'http://localhost',
      team: {slug: 'test'},
      user: {token: '123'},
    }
  })
  .stub(helpers, 'createGitRemote', () => {})
  .nock('http://localhost/v1/test', api => {
    api.reqHeaders = {authorization: 'Bearer 123'}
    return api
    .post('/apps')
    .reply(200, {
      masonVersion: 'v1',
      type: 'application',
      name: 'pebble',
    })
  })
  .stdout()
  .stderr()
  .command(['apps:create', 'pebble'])
  .it('create an app', ctx => {
    expect(ctx.stdout).to.equal(
      'Creating app on Codemason...\n' +
      ' ... Created application\n' +
      ' ... Created remote repository\n' +
      ' ... Added git remote codemason\n\n' +
      ' ⬢ pebble | http://localhost/apps/pebble\n'
    )
  })
})
