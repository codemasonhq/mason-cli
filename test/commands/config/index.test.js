const {expect, test} = require('@oclif/test')
const fs = require('fs-extra')

describe('config', () => {
  test
  .stdout()
  .stderr()
  .stub(fs, 'readJsonSync', () => {
    return {hello: 'world'}
  })
  .command('config')
  .it('list cli config', ctx => {
    expect(ctx.stdout).to.contain('world')
  })
})
