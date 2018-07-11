const {expect, test} = require('@oclif/test')
const helpers = require('../../../src/util/helpers')
const fs = require('fs-extra')

describe('services:create', () => {
  test
  .stub(fs, 'readJSON', () => {
    return {
      endpoint: 'http://localhost',
      team: {slug: 'test'},
      user: {token: '123'},
    }
  })
  .stub(helpers, 'createGitRemote', () => {})
  .nock('http://localhost/v1/test', api => api
  .post('/services?application=pebble&environment=development&api_token=123')
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
  )
  .stdout()
  .stderr()
  .command(['services:create', 'pebble/web', '-p', '80', '--env', 'FOO=BAR', '--image', 'registry.mason.ci/pebble/web'])
  .it('create a service', ctx => {
    expect(ctx.stdout).to.contains('registry.mason.ci/pebble/web')
  })
})
