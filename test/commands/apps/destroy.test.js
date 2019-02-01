const {expect, test} = require('@oclif/test')
const fs = require('fs-extra')

describe('apps:destroy', () => {
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
    .delete('/applications/pebble?environment=development')
    .reply(200)
  })
  .stdout()
  .stderr()
  .command(['apps:destroy', 'pebble'])
  .it('destroy an app', ctx => {
    expect(ctx.stdout).to.equal('')
  })
})
