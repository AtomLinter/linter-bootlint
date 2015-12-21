'use babel';

import * as path from 'path';

describe('The bootlint provider for Linter', () => {
  const lint = require(path.join('..', 'lib', 'init.js')).provideLinter().lint;

  beforeEach(() => {
    atom.workspace.destroyActivePaneItem();
    waitsForPromise(() => {
      atom.packages.activatePackage('linter-bootlint');
      return atom.packages.activatePackage('language-html').then(() =>
        atom.workspace.open(path.join(__dirname, 'fixtures', 'valid.html'))
      );
    });
  });

  describe('checks a file with issues and', () => {
    let editor = null;
    beforeEach(() => {
      waitsForPromise(() => {
        return atom.workspace.open(path.join(__dirname, 'fixtures', 'missing-alert-dismissible.html')).then(openEditor => {
          editor = openEditor;
        });
      });
    });

    it('finds at least one message', () => {
      waitsForPromise(() => {
        return lint(editor).then(messages => {
          expect(messages.length).toBeGreaterThan(0);
        });
      });
    });

    it('verifies the first message', () => {
      waitsForPromise(() => {
        return lint(editor).then(messages => {
          expect(messages[0].type).toBeDefined();
          expect(messages[0].type).toEqual('Error');
          expect(messages[0].text).toBeDefined();
          expect(messages[0].text).toEqual('E033 `.alert` with dismiss button must have class `.alert-dismissible`');
          expect(messages[0].filePath).toBeDefined();
          expect(messages[0].filePath).toMatch(/.+missing-alert-dismissible\.html$/);
          expect(messages[0].range).toBeDefined();
          expect(messages[0].range.length).toBeDefined();
          expect(messages[0].range.length).toEqual(2);
          expect(messages[0].range).toEqual([[25, 24], [25, 56]]);
        });
      });
    });
  });

  it('finds nothing wrong with a valid file', () => {
    waitsForPromise(() => {
      return atom.workspace.open(path.join(__dirname, 'fixtures', 'valid.html')).then(editor => {
        return lint(editor).then(messages => {
          expect(messages.length).toEqual(0);
        });
      });
    });
  });
});
