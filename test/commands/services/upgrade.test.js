const {expect, test} = require('@oclif/test')
const helpers = require('../../../src/util/helpers')
const fs = require('fs-extra')

describe('services:upgrade', () => {
  test
  .stub(fs, 'readJsonSync', () => {
    return {
      endpoint: 'http://localhost',
      team: {slug: 'test'},
      user: {token: '123'},
    }
  })
  .stub(helpers, 'createGitRemote', () => {})
  .nock('http://localhost/v1/test', api => api
  .get('/services/pebble/web?environment=development&api_token=123')
  .reply(200, {id: 1, name: 'web'})
  .put('/services/1?environment=development&api_token=123', {
    masonVersion: 'v1',
    type: 'service',
    name: 'web',
    image: 'registry.mason.ci/pebble/web',
    environment: {
      FOO: 'BAR',
    },
    labels: {
      'io.rancher.container.pull_image': 'always',
    },
    ports: ['80'],
  })
  .reply(200)
  )
  .stdout()
  .stderr()
  .command(['services:upgrade', 'pebble/web', '-p', '80', '--env', 'FOO=BAR', '--image', 'registry.mason.ci/pebble/web'])
  .it('upgrade a service', ctx => {
    expect(ctx.stdout).to.contains('')
  })
})
