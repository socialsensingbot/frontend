#!/bin/bash -eux
cd $(dirname $0)
cd ../../../../api || exit
npm ci
tsc --project tsconfig.json
npm pack
cd - || exit
cd src || exit
cp ../../../../../api/socialsensing-api*.tgz .
npm install
tsc --project tsconfig.json
