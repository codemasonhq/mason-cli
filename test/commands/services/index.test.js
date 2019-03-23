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
    .get('/apps/pebble/services')
    .reply(200, [{name: 'hello-world'}])
  })
  .stdout()
  .stderr()
  .command(['services', 'pebble'])
  .it('return services', ctx => {
    expect(ctx.stdout).to.contains('Services for pebble')
    expect(ctx.stdout).to.contains('hello-world')
  })
})
