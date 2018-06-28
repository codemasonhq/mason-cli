const {expect, test} = require('@oclif/test')
const helpers = require('../../../src/util/helpers')

describe('git:remote', () => {
  test
  .stdout()
  .stderr()
  .stub(helpers, 'createGitRemote', () => {})
  .command(['git:remote', 'pebble'])
  .it('create a git remote', ctx => {
    expect(ctx.stdout).to.contain('Remote codemason added')
  })
})
