const {expect, test} = require('@oclif/test')
const fs = require('fs-extra')

describe('run', () => {
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
    .get('/services/pebble/web?environment=development')
    .reply(200, {
      id: '1',
      name: 'web',
      rancher: {
        instances: [
          {
            id: 'i10001',
            name: 'pebble-web-1',
            state: 'stopped',
          },
          {
            id: 'i10002',
            name: 'pebble-web-2',
            state: 'running',
          },
        ],
      },
    })
    .post('/containers/i10002/execute', {
      command: ['/bin/sh', '-c', 'TERM=xterm-256color; export TERM; [ -x /bin/bash ] && ([ -x /usr/bin/script ] && /usr/bin/script -q -c "/bin/bash" /dev/null || exec sh) || exec sh'],
    })
    .reply(200, {
      url: 'wss://address.local/v1/exec',
      token: 'abc123',
    })
  })
  .stdout()
  .stderr()
  .command(['run', '--service', 'pebble/web'])
  .it('connects to server', ctx => {
    expect(ctx.stdout).to.equal('')
  })
})
