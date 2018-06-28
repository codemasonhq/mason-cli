const {expect, test} = require('@oclif/test')
const fs = require('fs-extra')

describe('config:set', () => {
  test
  .stdout()
  .stderr()
  .stub(fs, 'outputJSON', (path, json) => {
    expect(json).to.have.property('foo')
    expect(json.foo).to.equal('bar')
  })
  .command(['config:set', 'foo', 'bar'])
  .it('set config value', ctx => {
    expect(ctx.stdout).to.equal('Setting CLI config value... done\n')
  })
})
