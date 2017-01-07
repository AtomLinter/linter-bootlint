'use babel';

import * as path from 'path';

const lint = require('../lib/init.js').provideLinter().lint;

const validPath = path.join(__dirname, 'fixtures', 'valid.html');
const madPath = path.join(__dirname, 'fixtures', 'missing-alert-dismissible.html');
const confErrPath = path.join(__dirname, 'fixtures', 'config-errors.html');

describe('The bootlint provider for Linter', () => {
  beforeEach(() => {
    atom.workspace.destroyActivePaneItem();
    waitsForPromise(() => {
      atom.packages.activatePackage('linter-bootlint');
      return atom.packages.activatePackage('language-html').then(() =>
        atom.workspace.open(path.join(__dirname, 'fixtures', 'valid.html')),
      );
    });
  });

  describe('checks a file with issues and', () => {
    let editor = null;
    beforeEach(() => {
      waitsForPromise(() =>
        atom.workspace.open(madPath).then((openEditor) => { editor = openEditor; }),
      );
    });

    it('finds at least one message', () => {
      waitsForPromise(() =>
        lint(editor).then(messages =>
          expect(messages.length).toBeGreaterThan(0),
        ),
      );
    });

    it('verifies the first message', () => {
      waitsForPromise(() => {
        const messageText = 'E033 `.alert` with dismiss button must have ' +
          'class `.alert-dismissible`';
        return lint(editor).then((messages) => {
          expect(messages[0].type).toBe('Error');
          expect(messages[0].text).toBe(messageText);
          expect(messages[0].filePath).toBe(madPath);
          expect(messages[0].range).toEqual([[25, 24], [25, 56]]);
        });
      });
    });
  });

  it('finds nothing wrong with a valid file', () => {
    waitsForPromise(() =>
      atom.workspace.open(validPath).then(editor =>
        lint(editor).then(messages =>
          expect(messages.length).toBe(0),
        ),
      ),
    );
  });

  it('shows configuration errors', () => {
    waitsForPromise(() =>
      atom.workspace.open(confErrPath).then(editor =>
        lint(editor).then((messages) => {
          const messageText = 'W002 `<head>` is missing X-UA-Compatible `<meta>` ' +
            'tag that disables old IE compatibility modes';
          expect(messages[0].type).toBe('Error');
          expect(messages[0].text).toBe(messageText);
          expect(messages[0].filePath).toBe(confErrPath);
          expect(messages[0].range).toEqual([[0, 0], [0, 15]]);
        }),
      ),
    );
  });

  it('allows disabling of specific errors', () => {
    waitsForPromise(() =>
      atom.workspace.open(confErrPath).then((editor) => {
        atom.config.set('linter-bootlint.flags', ['W002']);
        return lint(editor).then((messages) => {
          const messageText = 'W003 `<head>` is missing viewport `<meta>` tag ' +
            'that enables responsiveness';
          expect(messages[0].type).toBe('Error');
          expect(messages[0].text).toBe(messageText);
          expect(messages[0].filePath).toBe(confErrPath);
          expect(messages[0].range).toEqual([[0, 0], [0, 15]]);
        });
      }),
    );
  });
});
