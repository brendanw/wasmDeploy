#!/bin/bash
set -e  # Exit immediately on error

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# basebeta-monorepo is expected to be a sibling directory
MONOREPO_DIR="$SCRIPT_DIR/../basebeta-monorepo"

# Remove everything except netlify files and hidden files/folders
find . -mindepth 1 \( \
    -type f ! -name '_headers' ! -name 'deploy.sh' ! -name '.gitignore' ! -name 'netlify.toml' -exec rm -f {} \; -o \
    -type d \( -name '.*' -prune \) -o \
    -type d -exec rm -rf {} \; \
\)

# 1. Go to your monorepo directory
cd "$MONOREPO_DIR" || exit 1

# 2. Run the gradle build for the WASM distribution
./gradlew :common:wasmJsBrowserDistribution

# 3. Copy the build output to the wasmDeploy folder, overwriting existing files
cp -R "./common/build/dist/wasmJs/productionExecutable/"* "$SCRIPT_DIR/"

# 4. rename composeApp.js -> composeApp.[hash].js
myHash=$(echo $RANDOM | md5)
newFileName="composeApp.${myHash}.js"

cd "$SCRIPT_DIR"

if [[ -f "composeApp.js" ]]; then
    mv "composeApp.js" "$newFileName"
    echo "File renamed to $newFileName"
else
    echo "Error: composeApp.js does not exist."
fi

# 5. Update index.html to use the new file name
if [[ -f "index.html" ]]; then
    # Replace all instances of composeApp.js with the new file name
    sed -i.bak "s/composeApp\.js/${newFileName}/g" index.html
    echo "index.html updated with new file name: $newFileName"
    echo "Backup created as index.html.bak"
else
    echo "Error: index.html does not exist."
    exit 1
fi

# 6. Go to wasmDeploy folder, commit changes, and push to master
cd "$SCRIPT_DIR" || exit 1
git add .
git commit -a -m "deploy commit"
git push origin master
