# The command line

A terminal lets you run project commands and inspect files. Use the terminal
built into your editor or your operating system's terminal app.

- Windows: Windows Terminal with PowerShell.
- macOS: Terminal or iTerm2 with zsh.
- Linux: your distribution's terminal with Bash or another shell.

Commands below use portable names where possible. PowerShell also supports
aliases such as `ls` and `pwd`, but the PowerShell command names are shown
when they differ.

## Move around

Show the current folder:

```sh
pwd
```

In PowerShell, the equivalent is:

```powershell
Get-Location
```

List files in the current folder:

```sh
ls
```

In PowerShell, use:

```powershell
Get-ChildItem
```

Change to a folder. Put paths containing spaces in quotes:

```sh
cd "workshop-webgl-glsl"
```

Move up one folder with `cd ..`. To go to the project root, use your file
manager to open a terminal in that folder, or enter its full path.

## Create and inspect files

Create a folder:

```sh
mkdir sketches
```

Print a text file:

```sh
cat README.md
```

PowerShell equivalent:

```powershell
Get-Content README.md
```

To create an empty file, use your editor. The `touch` command is available on
macOS and Linux, but it is not built into standard Windows PowerShell.

## Run project commands

In the project root, install dependencies and start the site:

```sh
npm ci
npm run dev
```

The terminal displays the local address for the site. Leave the terminal
running while you work. Stop the development server with `Ctrl+C`.

## Tips

- Commands run in the folder shown by the terminal prompt.
- Check the folder with `pwd` or `Get-Location` before running a command.
- Use the up-arrow key to recall a previous command.
- Use `Ctrl+C` to stop a running command.
- If a command fails, read the complete error and check the folder and
  spelling first.
