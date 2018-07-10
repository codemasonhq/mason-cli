const {expect, test} = require('@oclif/test')
const fs = require('fs-extra')

describe('services', () => {
  test
  .stub(fs, 'readJSON', () => {
    return {
      endpoint: 'http://localhost',
      team: {slug: 'test'},
      user: {token: '123'},
    }
  })
  .nock('http://localhost/v1/test', api => api
  .get('/services?api_token=123')
  .reply(200, [{name: 'hello-world'}])
  )
  .stdout()
  .stderr()
  .command(['services'])
  .it('return services', ctx => {
    expect(ctx.stdout).to.contains('Your services (test)')
    expect(ctx.stdout).to.contains('hello-world')
  })
})
