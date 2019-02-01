const {expect, test} = require('@oclif/test')
const fs = require('fs-extra')

describe('services', () => {
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
    .get('/services?environment=development')
    .reply(200, [{name: 'hello-world'}])
  })
  .stdout()
  .stderr()
  .command(['services'])
  .it('return services', ctx => {
    expect(ctx.stdout).to.contains('Your services (test)')
    expect(ctx.stdout).to.contains('hello-world')
  })
})
