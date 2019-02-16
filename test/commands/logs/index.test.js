const {expect, test} = require('@oclif/test')
const fs = require('fs-extra')

describe('logs', () => {
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
    .get('/applications/pebble?environment=development')
    .reply(200, {
      name: 'pebble',
      services: [
        {
          name: 'web',
          rancher: {
            instanceIds: ['123'],
          },
        },
      ],
    })
    .get('/containers/123/logs')
    .reply(200, {
      url: 'wss://address.local/v1/exec',
      token: 'abc123',
    })
  })
  .stdout()
  .stderr()
  .command(['logs', 'pebble'])
  .it('connects to logs', ctx => {
    expect(ctx.stdout).to.equal('')
  })
})
