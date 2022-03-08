cd ../../../../api || exit
npm ci
tsc --project tsconfig.json
npm pack
cd - || exit
cd src || exit
cp ../../../../../api/socialsensing-api*.tgz
npm ci socialsensing-api*.tgz
npm ci
tsc --project tsconfig.json
