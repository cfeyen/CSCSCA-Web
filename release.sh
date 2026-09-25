#!/bin/bash

if [[ $# -ne 1 ]]; then
    echo "pass destination"
    exit 1;
fi

DEST="$1"

cd cscsca_bindings
wasm-pack build --release --target web
if [[ $? -ne 0 ]]; then
    cd -
    exit 1;
fi
cd -

bun run build.ts

if [[ $? -ne 0 ]]; then
    exit 1;
fi

echo "Copying files"

rm -rf "$DEST/cscsca"
cp -r "dist" "$DEST/cscsca"
cp "LICENSE" "$DEST/cscsca"