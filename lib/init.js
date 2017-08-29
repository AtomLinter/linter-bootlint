'use babel';

// eslint-disable-next-line import/extensions, import/no-extraneous-dependencies
import { CompositeDisposable } from 'atom';
import * as path from 'path';

// Dependencies
let helpers;

// Internal Variables
let packagePath;

const loadDeps = () => {
  if (!helpers) {
    helpers = require('atom-linter');
  }
};

export default {
  activate() {
    this.idleCallbacks = new Set();
    let depsCallbackID;
    const installLinterBootlintDeps = () => {
      this.idleCallbacks.delete(depsCallbackID);
      if (!atom.inSpecMode()) {
        require('atom-package-deps').install('linter-bootlint');
      }
      loadDeps();
    };
    depsCallbackID = window.requestIdleCallback(installLinterBootlintDeps);
    this.idleCallbacks.add(depsCallbackID);

    this.subscriptions = new CompositeDisposable();

    this.subscriptions.add(
      atom.config.observe('linter-bootlint.executablePath', (executablePath) => {
        this.command = executablePath;
        if (!this.command) {
          // Default to the bundled version if the user hasn't overridden it.
          if (!packagePath) {
            packagePath = atom.packages.resolvePackagePath('linter-bootlint');
          }
          this.command = path.join(packagePath, 'node_modules', '.bin', 'bootlint');
        }
      }),
      atom.config.observe('linter-bootlint.flags', (flags) => {
        this.flags = flags;
      }),
    );
  },

  deactivate() {
    this.idleCallbacks.forEach(callbackID => window.cancelIdleCallback(callbackID));
    this.idleCallbacks.clear();
    this.subscriptions.dispose();
  },

  provideLinter() {
    return {
      name: 'Bootlint',
      grammarScopes: ['text.html.basic', 'text.html.twig'],
      scope: 'file',
      lintsOnChange: true,
      lint: async (textEditor) => {
        const filePath = textEditor.getPath();
        if (!filePath) {
          // Linter gave us a TextEditor with no path
          return null;
        }

        loadDeps();

        const fileDir = path.dirname(filePath);
        const text = textEditor.getText();

        if (!text) {
          return [];
        }

        const args = [];
        if (this.flags.length) {
          args.push('-d', this.flags.join(','));
        }

        const execOpts = {
          stdin: text,
          cwd: fileDir,
          ignoreExitCode: true,
          timeout: 1000 * 60, // 60 seconds hard limit
          uniqueKey: `linter-bootlint::${filePath}`,
        };

        const output = await helpers.exec(this.command, args, execOpts);

        const regex = /<stdin>:(?:(\d+):(\d+))?\s(.+)/g;
        const messages = [];
        let match = regex.exec(output);
        while (match !== null) {
          messages.push({
            severity: 'error',
            excerpt: match[3],
            location: {
              file: filePath,
              position: helpers.generateRange(textEditor, match[1] - 1, match[2]),
            },
          });
          match = regex.exec(output);
        }
        return messages;
      },
    };
  },
};
