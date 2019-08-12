const {expect, test} = require('@oclif/test')
const fs = require('fs-extra')

describe('teams', () => {
  test
  .stub(fs, 'readJsonSync', () => {
    return {
      endpoint: 'http://localhost',
      team: {slug: 'test'},
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
  .command(['teams'])
  .it('return teams', ctx => {
    expect(ctx.stdout).to.equal('Your teams (hello@example.com)\n hello-world\n blue-team\n')
  })
})
