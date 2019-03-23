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
  .nock('http://localhost/v1/test', api => {
    api.reqHeaders = {authorization: 'Bearer 123'}
    return api
    .get('/apps/pebble/services/web')
    .reply(200, {id: 1, name: 'web'})
    .put('/apps/pebble/services/1', {
      masonVersion: 'v1',
      type: 'service',
      name: 'web',
      image: 'registry.mason.ci/pebble/web',
      command: '',
      environment: {
        FOO: 'BAR',
      },
      labels: {
        'io.rancher.container.pull_image': 'always',
      },
      ports: ['80'],
      volumes: [],
      links: [],
    })
    .reply(200)
  })
  .stdout()
  .stderr()
  .command(['services:upgrade', 'pebble/web', '-p', '80', '--env', 'FOO=BAR', '--image', 'registry.mason.ci/pebble/web'])
  .it('upgrade a service', ctx => {
    expect(ctx.stdout).to.contains('')
  })
})
