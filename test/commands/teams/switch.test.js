const {expect, test} = require('@oclif/test')
const fs = require('fs-extra')

describe('teams:switch', () => {
  test
  .stub(fs, 'readJsonSync', () => {
    return {
      endpoint: 'http://localhost',
      team: {slug: 'hello-world'},
      user: {token: '123', email: 'hello@example.com'},
    }
  })
  .nock('http://localhost/v1', api => {
    api.reqHeaders = {authorization: 'Bearer 123'}
    return api
    .get('/teams')
    .reply(200, [{slug: 'hello-world'}, {slug: 'blue-team'}])
  })
  .stdout()
  .stderr()
  .command(['teams:switch', '--team', 'blue-team'])
  .it('switch default team', ctx => {
    expect(ctx.stdout).to.equal(' ... Default team successfully changed\n')
  })
})
