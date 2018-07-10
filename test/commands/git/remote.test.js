const {expect, test} = require('@oclif/test')
const helpers = require('../../../src/util/helpers')
const fs = require('fs-extra')

describe('git:remote', () => {
  test
  .stdout()
  .stderr()
  .stub(fs, 'readJSON', () => {
    return {
      git: 'git.mason.ci',
      remote: 'codemason',
      team: {slug: 'test'},
    }
  })
  .stub(helpers, 'createGitRemote', () => {})
  .command(['git:remote', 'pebble'])
  .it('create a git remote', ctx => {
    expect(ctx.stdout).to.contain('Remote codemason added')
  })
})
