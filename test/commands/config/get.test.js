const {expect, test} = require('@oclif/test')
const fs = require('fs-extra')

describe('config:get', () => {
  test
  .stdout()
  .stderr()
  .stub(fs, 'readJsonSync', () => {
    return {
      foo: 'bar',
    }
  })
  .command(['config:get', 'foo'])
  .it('get config value', ctx => {
    expect(ctx.stdout).to.equal('bar\n')
  })
})
