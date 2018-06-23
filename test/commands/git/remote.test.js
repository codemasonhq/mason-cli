const {expect, test} = require('@oclif/test')

describe('git/remote', () => {
  test
  .stdout()
  .command(['git/remote'])
  .it('runs hello', ctx => {
    expect(ctx.stdout).to.contain('hello world')
  })

  test
  .stdout()
  .command(['git/remote', '--name', 'jeff'])
  .it('runs hello --name jeff', ctx => {
    expect(ctx.stdout).to.contain('hello jeff')
  })
})
