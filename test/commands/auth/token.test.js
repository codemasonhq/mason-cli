const {expect, test} = require('@oclif/test')
const fs = require('fs-extra')

describe('auth:token', () => {
  test
  .stdout()
  .stderr()
  .stub(fs, 'readJSON', () => {
    return {}
  })
  .command(['auth:token'])
  .it('api token empty', ctx => {
    expect(ctx.stdout).to.equal('Not logged in\n')
  })

  test
  .stdout()
  .stderr()
  .stub(fs, 'readJSON', () => {
    return {user: {token: '123456'}}
  })
  .command(['auth:token'])
  .it('get api token', ctx => {
    expect(ctx.stdout).to.contain('123456')
  })
})
