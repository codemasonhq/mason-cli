const {expect, test} = require('@oclif/test')
const fs = require('fs-extra')

describe('apps:destroy', () => {
  test
  .stub(fs, 'readJSON', () => {
    return {
      endpoint: 'http://localhost',
      team: {slug: 'test'},
      user: {token: '123'},
    }
  })
  .nock('http://localhost/v1/test', api => api
  .delete('/applications/pebble?environment=development&api_token=123')
  .reply(200)
  )
  .stdout()
  .stderr()
  .command(['apps:destroy', 'pebble'])
  .it('destroy an app', ctx => {
    expect(ctx.stdout).to.equal('')
  })
})
