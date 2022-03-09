# itch-io-bundle-claimer

When you purchase some game bundles on itch.io, you are required to manually claim every game that you want to add to your library. This script will let you take care of that automatically. To avoid over-burdening the itch.io servers, this is done at about the same speed as manually clicking all the links, assuming you're somewhat quick with a mouse and know what games you've claimed already.

## Instructions
These instructions assume you're working from the bash shell, or something similar. The general process should be the same anywhere, although the actual commands may vary.

1. Make sure that you have [node.js](https://nodejs.org) installed and accessible via your PATH variable.
2. Clone and install the repo:
```
git clone git@github.com:centuryglass/itch-io-bundle-claimer.git
cd itch-io-bundle-claimer
npm install
```
3. Define your itch.io username and password as environment variables:
```
read USER
enter-username-here
read -s PASS
enter-pass-here
export USER
export PASS
```
4. Run the script and wait:
```
node .
```
5. Close the shell, or at least run `unset PASS` to remove your password from memory.

