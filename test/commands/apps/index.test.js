const {expect, test} = require('@oclif/test')
const fs = require('fs-extra')

describe('apps', () => {
  test
  .stub(fs, 'readJsonSync', () => {
    return {
      endpoint: 'http://localhost',
      team: {slug: 'test'},
      user: {token: '123'},
    }
  })
  .nock('http://localhost/v1/test', api => {
    api.reqHeaders = {authorization: 'Bearer 123'}
    return api
    .get('/apps')
    .reply(200, [{name: 'hello-world'}])
  })
  .stdout()
  .stderr()
  .command(['apps'])
  .it('return apps', ctx => {
    expect(ctx.stdout).to.equal('Your apps (test)\n hello-world\n')
  })
})
