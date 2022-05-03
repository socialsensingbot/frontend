#!/bin/bash -eux
cd $(dirname $0)
cd ../../../../api || exit
npm ci
tsc --project tsconfig.json
npm pack
cd - || exit
cd src || exit
cp ../../../../../api/socialsensing-api*.tgz .
npm install socialsensing-api*.tgz
npm install
tsc --project tsconfig.json
if [[ "${AWS_BRANCH}" == staging ]]; then
  echo "Tests are run on dev branches only."
elif [[ "${AWS_BRANCH}" == demo ]]; then
  echo "Tests are run on dev branches only."
elif [[ "${AWS_BRANCH}" == master ]]; then
  echo "Tests are run on dev branches only."
elif [[ "${AWS_BRANCH}" == test ]]; then
  echo "Tests are run on dev branches only."
else
  env TZ='UTC' npm test
fi

echo "Completed Build OK"
