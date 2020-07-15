# ASCII Tree

An Atom package to generate ASCII trees to visualize file/folder structure.

![animation](https://user-images.githubusercontent.com/7918069/33242100-633bd938-d284-11e7-9a07-fb2c42a40f93.gif)

# Installation

```
apm install ascii-tree
```

# Commands

## Generate

Write trees using `+-- ` to create child nodes and plain text to define nodes at root (make sure to use 4 spaces for each child indentation).

### Example

Write the following tree:

```
root
+-- dir1
+-- dir2
    +-- file1
+-- dir3
    +-- file2
    +-- file3
    +-- dir4
        +-- file4
+-- file5
```

then select the text and press `ctrl-alt-t` or use the command `ascii-tree:generate` to generate the following ASCII tree:

```
root
├── dir1
├── dir2
│   └── file1
├── dir3
│   ├── file2
│   ├── file3
│   └── dir4
│       └── file4
└── file5
```

> **NOTE:** If the ASCII tree is not being generated, it means the syntax is incorrect. Please double check your input before opening an issue.

> **NOTE:** Any indentation existing on the whole tree (including and excluding the root) would be preserved.

> **NOTE:** Having a root is not mandatory.

## Reverse

Select the generated tree and press `ctrl-alt-r` or use the command `ascii-tree:reverse` to reverse the tree back to the raw syntax.
