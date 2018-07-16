const {expect, test} = require('@oclif/test')
const fs = require('fs-extra')

describe('config:unset', () => {
  test
  .stdout()
  .stderr()
  .stub(fs, 'readJsonSync', () => {
    return {
      foo: 'bar',
    }
  })
  .stub(fs, 'outputJSON', (path, json) => {
    expect(json).to.not.have.property('foo')
  })
  .command(['config:unset', 'foo'])
  .it('unset config value', ctx => {
    expect(ctx.stdout).to.equal('Unsetting foo... done\n')
  })
})
