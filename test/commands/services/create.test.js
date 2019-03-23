const {expect, test} = require('@oclif/test')
const helpers = require('../../../src/util/helpers')
const fs = require('fs-extra')

describe('services:create', () => {
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
    .post('/apps/pebble/services')
    .reply(200, {
      masonVersion: 'v1',
      type: 'application',
      name: 'web',
      image: 'registry.mason.ci/pebble/web',
      environment: {
        FOO: 'BAR',
      },
      ports: ['80'],
    })
  })
  .stdout()
  .stderr()
  .command(['services:create', 'pebble/web', '-p', '80', '--env', 'FOO=BAR', '--image', 'registry.mason.ci/pebble/web'])
  .it('create a service', ctx => {
    expect(ctx.stdout).to.contains('registry.mason.ci/pebble/web')
  })
})
