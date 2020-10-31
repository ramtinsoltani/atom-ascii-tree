'use babel';

import { CompositeDisposable } from 'atom';

class AsciiNode {

  constructor() {

    this.value = null;
    this.child = null;
    this.sibling = null;
    this.parent = null;
    this.depth = 0;

  }

}

export default {

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

    const raw = selection.replace(/├──/g, '+--').replace(/└──/g, '+--').replace(/│/g, ' ');

    editor.insertText(raw);
    editor.selectToBeginningOfLine();
    editor.selectUp(raw.split('\n').length - 1);

  },

  generate() {

    let editor = atom.workspace.getActiveTextEditor();

    if ( ! editor ) return;

    let selection = editor.getSelectedText();

    if ( ! selection || ! selection.trim() ) return;

    // Sanitize selection
    selection = selection.replace(/\r\n/g, '\n');

    let baseIndentation = '';

    // Locate root
    const rootMatch = selection.match(/^(?<root>(?:(?!\+-- ).)*?)\n[ \t]*\+--/s);

    const root = new AsciiNode();

    // If root found, set as value
    if ( rootMatch ) root.value = rootMatch.groups.root;

    // Determine base indentation to be preserved
    if ( root.value !== null ) {

      baseIndentation = selection.match(/\n(?<indentation>[ \t]*?)\+-- /).groups.indentation;

    }
    else {

      baseIndentation = selection.match(/^(?<indentation>[ \t]*?)\+-- /).groups.indentation;

    }

    // Break the selection into lines for each node
    let lines = selection.match(/(?<=^|\n)[ \t]*\+-- .+(?=\n|$)/g);

    // If invalid syntax
    if ( ! lines ) return null;

    // Exclude the base indentation from all lines
    lines = lines.map(line => line.substr(baseIndentation.length));

    // Convert all lines to data model
    let currentNode = root;

    for ( const line of lines ) {

      const match = line.match(/(?<depth>[ \t]*)\+-- (?<value>.+)/s);

      // If invalid syntax
      if ( ! match ) return null;

      // Determine node depth
      const depth = Math.floor((match.groups.depth || '').length / 4) + 1;

      // If next level, create new child node
      if ( depth > currentNode.depth ) {

        currentNode.child = new AsciiNode();
        currentNode.child.depth = depth;
        currentNode.child.parent = currentNode;
        currentNode.child.value = match.groups.value;

        currentNode = currentNode.child;

      }
      // Otherwise, create new sibling node
      else {

        // If previous level, navigate back to correct parent
        if ( depth < currentNode.depth ) {

          const navigation = currentNode.depth - depth;

          // Navigate back to parent node
          for ( let i = 0; i < navigation; i++ ) {

            // If invalid syntax
            if ( currentNode.parent === null ) return;

            currentNode = currentNode.parent;

          }

        }

        // Add sibling node
        currentNode.sibling = new AsciiNode();
        currentNode.sibling.depth = depth;
        currentNode.sibling.parent = currentNode.parent;
        currentNode.sibling.value = match.groups.value;

        currentNode = currentNode.sibling;

      }

    }

    // Render the ascii tree
    let rendered = '';
    let backtrack = 0;
    let backtracking = false;
    let skipFirstNewLine = root.value === null;
    const prefix = [];

    // Traverse the tree
    currentNode = root;

    while ( currentNode ) {

      // If not backtracking
      if ( ! backtracking ) {

        // Render this node
        // If root
        if ( currentNode.depth === 0 ) {

          rendered += currentNode.value || '';

        }
        else {

          rendered += `${skipFirstNewLine ? '' : '\n'}${baseIndentation}${prefix.join('')}`;

          // If last child
          if ( ! currentNode.sibling ) rendered += `└── ${currentNode.value}`;
          else rendered += `├── ${currentNode.value}`;

          skipFirstNewLine = false;

        }

      }

      // If has child
      if ( currentNode.child && ! backtracking ) {

        // Add prefix if not root
        if ( currentNode.depth > 0 ) {

          if ( currentNode.sibling ) prefix.push('│   ');
          else prefix.push('    ');

        }

        backtrack++;
        currentNode = currentNode.child;
        continue;

      }

      // Disable backtracking
      backtracking = false;

      // If has sibling
      if ( currentNode.sibling ) {

        currentNode = currentNode.sibling;
        continue;

      }

      // Backtrack if necessary
      if ( backtrack ) {

        backtracking = true;
        currentNode = currentNode.parent;
        backtrack--;

        // Remove prefix
        prefix.pop();

      }
      // Otherwise, end the traverse
      else {

        currentNode = null;

      }

    }

    editor.insertText(rendered);
    editor.selectToBeginningOfLine();
    editor.selectUp(rendered.split('\n').length - 1);

  },

};
