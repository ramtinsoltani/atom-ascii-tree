'use babel';

import { CompositeDisposable } from 'atom';

export default {

  config: {

    characters: {
      title: 'Characters',
      type: 'object',
      properties: {
        child: {
          title: 'Child',
          type: 'string',
          default: '├── '
        },
        lastChild: {
          title: 'Last Child',
          type: 'string',
          default: '└── '
        },
        indent: {
          title: 'Indent',
          type: 'string',
          default: '    '
        },
        indentWithLine: {
          title: 'Indent with Line',
          type: 'string',
          default: '│   '
        },
        rootPrefix: {
          title: 'Root Prefix',
          description: 'Prefix root nodes with `.`',
          type: 'boolean',
          default: false
        }
      }
    }

  },

  activate(state) {

    this.subscriptions = new CompositeDisposable();

    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'ascii-tree:generate': () => this.generate(),
      'ascii-tree:reverse': () => this.reverse()
    }));

  },

  deactivate() {
    this.subscriptions.dispose();
  },

  reverse() {

    let editor = atom.workspace.getActiveTextEditor();

    if ( ! editor ) return;

    let selection = editor.getSelectedText();

    if ( ! selection || ! selection.trim() ) return;

    let result = '';
    let characters = {

      child: atom.config.get('ascii-tree.characters.child'),
      lastChild: atom.config.get('ascii-tree.characters.lastChild'),
      indentWithLine: atom.config.get('ascii-tree.characters.indentWithLine'),
      indent: atom.config.get('ascii-tree.characters.indent')

    };

    result = this.__reverseGeneratedTree(selection, characters);

    editor.insertText(result);
    editor.selectToBeginningOfLine();
    editor.selectUp(result.split('\n').length - 1);

  },

  generate() {

    let editor = atom.workspace.getActiveTextEditor();

    if ( ! editor ) return;

    let selection = editor.getSelectedText();

    if ( ! selection || ! selection.trim() ) return;

    let result = '';
    let characters = {

      child: atom.config.get('ascii-tree.characters.child'),
      lastChild: atom.config.get('ascii-tree.characters.lastChild'),
      indentWithLine: atom.config.get('ascii-tree.characters.indentWithLine'),
      indent: atom.config.get('ascii-tree.characters.indent')

    };

    let object = this.__interpretAsObject(selection);
    let generated = [];

    this.__buildLinesFromObject(object, generated, characters);

    result = generated.join('\n');

    editor.insertText(result);
    editor.selectToBeginningOfLine();
    editor.selectUp(result.split('\n').length - 1);

  },

  __reverseGeneratedTree(selection, characters) {

    let lines = selection
                 .replace(/\r\n/g, '\n')
                 .replace(/\n+/g, '\n')
                 .replace(/^\n/, '')
                 .replace(/\n$/, '')
                 .split('\n');

    let indentRegex = new RegExp(characters.indent, 'g');
    let indentWithLineRegex = new RegExp(characters.indentWithLine, 'g');

    lines.forEach((line, index) => {

      if ( line.indexOf(characters.child) !== -1 || line.indexOf(characters.lastChild) !== -1 ) {

        lines[index] = line
                 .replace(characters.child, '+-- ')
                 .replace(characters.lastChild, '+-- ')
                 .replace(indentRegex, '    ')
                 .replace(indentWithLineRegex, '    ');

      }
      else if ( atom.config.get('ascii-tree.characters.rootPrefix') ) {

        lines[index] = line.replace(/^\./, '');

      }

    });

    return lines.join('\n');

  },

  __interpretAsObject(selection) {

    let object = {};
    let lastParents = []; // To keep track of the last parents known on each level
    let text = selection
                 .replace(/\r\n/g, '\n')
                 .replace(/\n+/g, '\n')
                 .replace(/^\n/, '')
                 .replace(/\n$/, '')
                 .split('\n');

    // Read each line
    text.forEach((line, index) => {

      // If line is root (multiple roots are valid)
      if ( line.trim().substr(0, 3) !== '+--' ) {

        object[index + ':' + line.trim()] = {};
        lastParents[0] = index + ':' + line.trim();

      }
      else {

        let currentLevel = (line.indexOf('+--') / 4) + 1;
        let currentNode = index + ':' + line.replace('+--', '').trim();
        let parentIndex = currentLevel - 1;
        let ref = object;

        // Add the current node to the right parent
        for ( let lastParentIndex in lastParents ) {

          ref = ref[lastParents[lastParentIndex]];

          // If parent reached (note that lastParentIndex is a string)
          if ( lastParentIndex == parentIndex ) {

            if ( ! ref ) return;

            ref[currentNode] = {};

            break;

          }

        }

        // Determine if current node is a parent itself
        if ( text[index + 1] ) {

          let possibleParentIndicator = text[index + 1].substr(line.indexOf('+--') + 4, 3);

          if ( possibleParentIndicator === '+--' ) lastParents[currentLevel] = currentNode;

        }

      }

    });

    return object;

  },

  __buildLinesFromObject(object, generated, characters, prefix, level) {

    // Default values
    prefix = prefix || '';
    level = level || 0;

    let nodes = Object.keys(object);

    for ( let index in nodes ) {

      let lastChild = ! nodes[parseInt(index) + 1];

      // Generate a new line with current node prefixed
      generated.push(prefix +
        (! level && atom.config.get('ascii-tree.characters.rootPrefix') ? '.' : '') +
        (level ? (lastChild ? characters.lastChild : characters.child) : '') +
        nodes[index].replace(/^\d+:/, ''));

      let children = Object.keys(object[nodes[index]]);

      if ( children.length ) {

        let childPrefix = '';

        // If current node is the last child, prefix it's children differently
        if ( level ) {

          childPrefix += lastChild ?
                          prefix + characters.indent :
                          prefix + characters.indentWithLine;
        }

        // Generate lines from child
        this.__buildLinesFromObject(object[nodes[index]], generated, characters, childPrefix, level + 1);

      }

    }

  }

};
