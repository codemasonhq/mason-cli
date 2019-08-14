const {expect, test} = require('@oclif/test')
const helpers = require('../../../src/util/helpers')

describe('services:open', () => {
  test
  .stdout()
  .stderr()
  .stub(helpers, 'openUrl', () => {})
  .command(['services:open', 'pebble/web'])
  .it('opens the service', ctx => {
    expect(ctx.stdout).to.equal('')
  })
})
