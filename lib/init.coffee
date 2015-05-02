path = require 'path'

module.exports =
  config:
    executablePath:
      type: 'string'
      default: path.join __dirname, '..', 'node_modules', '.bin'
      description: 'Path of the `bootlinter` executable'
    flags:
      type: 'string'
      default: ''
      description: 'Disable certain lint checks (comma-separated), refer to bootlint github page for error codes'

  activate: ->
    console.log 'activate linter-bootlint'
