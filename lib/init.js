'use babel';

import path from 'path';
// eslint-disable-next-line import/extensions, import/no-extraneous-dependencies
import { CompositeDisposable } from 'atom';

export default {
  config: {
    executablePath: {
      description: 'Path of the `bootlinter` executable',
      type: 'string',
      default: path.join(__dirname, '..', 'node_modules', '.bin', 'bootlint'),
    },
    flags: {
      description: 'Disable certain lint checks (comma-separated), refer to ' +
        'bootlint github page for error codes',
      type: 'array',
      default: [],
      items: {
        type: 'string',
      },
    },
  },

  activate() {
    require('atom-package-deps').install();

    this.subscriptions = new CompositeDisposable();

    this.subscriptions.add(
      atom.config.observe('linter-bootlint.executablePath', (executablePath) => {
        this.command = executablePath;
      }),
    );
    this.subscriptions.add(
      atom.config.observe('linter-bootlint.flags', (flags) => {
        this.flags = flags;
      }),
    );
  },

  deactivate() {
    this.subscriptions.dispose();
  },

  provideLinter() {
    const helpers = require('atom-linter');

    return {
      name: 'bootlint',
      grammarScopes: ['text.html.basic', 'text.html.twig'],
      scope: 'file',
      lintOnFly: true,
      lint: (textEditor) => {
        const filePath = textEditor.getPath();
        const fileDir = path.dirname(filePath);
        const text = textEditor.getText();

        if (!text) {
          return Promise.resolve([]);
        }

        const args = [];
        if (this.flags.length) {
          args.push('-d', this.flags.join(','));
        }

        const execOpts = {
          stdin: text,
          cwd: fileDir,
          ignoreExitCode: true,
        };

        return helpers.exec(this.command, args, execOpts).then((output) => {
          const regex = /<stdin>:(?:(\d+):(\d+))?\s(.+)/g;
          const messages = [];
          let match = regex.exec(output);
          while (match !== null) {
            messages.push({
              type: 'Error',
              text: match[3],
              filePath,
              range: helpers.rangeFromLineNumber(textEditor, match[1] - 1, match[2]),
            });
            match = regex.exec(output);
          }
          return messages;
        });
      },
    };
  },
};
