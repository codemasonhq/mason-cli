const {expect, test} = require('@oclif/test')
const fs = require('fs-extra')

describe('apps', () => {
  test
  .stub(fs, 'readJSON', () => {
    return {
      endpoint: 'http://localhost',
      team: {slug: 'test'},
      user: {token: '123'},
    }
  })
  .nock('http://localhost/v1/test', api => api
  .get('/applications?api_token=123')
  .reply(200, [{name: 'hello-world'}])
  )
  .stdout()
  .stderr()
  .command(['apps'])
  .it('return apps', ctx => {
    expect(ctx.stdout).to.equal('Your apps (test)\n hello-world\n')
  })
})
