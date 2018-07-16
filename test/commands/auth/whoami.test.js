const {expect, test} = require('@oclif/test')
const fs = require('fs-extra')

describe('auth:whoami', () => {
  test
  .stdout()
  .stderr()
  .stub(fs, 'readJsonSync', () => {
    return {
      user: {name: 'Foo Bar', email: 'foo@bar.com'},
    }
  })
  .command(['auth:whoami'])
  .it('get the current logged in user', ctx => {
    expect(ctx.stdout).to.equal(
      'You are currently logged in.\n' +
      'Name: Foo Bar\n' +
      'Email: foo@bar.com\n'
    )
  })
})
