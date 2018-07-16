const {expect, test} = require('@oclif/test')
const fs = require('fs-extra')
const YAML = require('yamljs')
const helpers = require('../../../src/util/helpers')

describe('apps:deploy', () => {
  test
  .stub(YAML, 'load', () => {
    return {
      services: [
        {
          name: 'pebble',
          image: 'registry.mason.ci/pebble/web',
          environment: {
            FOO: 'bar',
          },
        },
      ],
    }
  })
  .stub(fs, 'readJsonSync', () => {
    return {
      git: 'git.mason.ci',
      registry: 'registry.mason.ci',
      endpoint: 'http://localhost',
      team: {slug: 'test'},
      user: {token: '123'},
    }
  })
  .stub(helpers, 'getProjectFromGitRemote', 'test/pebble')
  .nock('http://localhost/v1/test', api => api
  .post('/services?application=pebble&environment=development&api_token=123', {
    masonVersion: 'v1',
    type: 'service',
    name: 0,
    image: 'registry.mason.ci/pebble/web',
    environment: {
      FOO: 'bar',
    },
    volumes: [],
  })
  .reply(200, {
    masonVersion: 'v1',
    type: 'application',
    name: 'pebble',
  })
  )
  .stdout()
  .stderr()
  .command(['apps:deploy', 'pebble'])
  .it('deploy an app', ctx => {
    expect(ctx.stdout).to.contain('http://localhost/applications/pebble')
    expect(ctx.stdout).to.contain('registry.mason.ci/pebble/web')
  })
})
