const {expect, test} = require('@oclif/test')
const fs = require('fs-extra')

describe('services:destroy', () => {
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
    .get('/apps/pebble/services/web')
    .reply(200, {id: 1, name: 'web'})
    .delete('/apps/pebble/services/1')
    .reply(200)
  })
  .stdout()
  .stderr()
  .command(['services:destroy', 'pebble/web'])
  .it('destroy an app', ctx => {
    expect(ctx.stdout).to.equal('')
  })
})
