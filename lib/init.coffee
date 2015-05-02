path = require 'path'

module.exports =
  config:
    executablePath:
      type: 'string'
      default: path.join __dirname, '..', 'node_modules', '.bin'
      description: 'Path of the `bootlinter` executable'

  activate: ->
    console.log 'activate linter-bootlint'
