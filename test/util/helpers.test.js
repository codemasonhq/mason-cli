const {expect, test} = require('@oclif/test')
const fs = require('fs-extra')
var child = require('child_process')
const helpers = require('../../src/util/helpers')

describe('helpers', () => {
  test
  .stub(child, 'execSync', () => Buffer.from('codemason\tgit@git.mason.ci:pebble/web (fetch)\ncodemason\tgit@git.mason.ci:pebble/web (push)'))
  .do(() => {
    const project = helpers.getProjectFromGitRemote('git.mason.ci')
    expect(project).to.equal('pebble/web')
  })
  .it('getProjectFromGitRemote returns project')

  test
  .stub(fs, 'existsSync', () => false)
  .do(() => {
    expect(helpers.getSSHKey('/fake/path')).to.equal(false)
  })
  .it('getSSHKey returns false when not available')

  test
  .do(() => {
    var formattedError = helpers.parseApiError({
      errors: {
        name: ['The name field is required.'],
        masonVersion: ['The mason version field is required.'],
      },
    })
    expect(formattedError).to.contains('The name field is required.')
    expect(formattedError).to.contains('The mason version field is required.')
  })
  .it('parseApiError formats error correctly')
})
