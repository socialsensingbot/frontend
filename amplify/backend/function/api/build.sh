cd ../../../../api || exit
npm ci
tsc --project tsconfig.json
npm pack
cd - || exit
cd src || exit
npm install ../../../../../api/socialsensing-api*.tgz
npm ci
tsc --project tsconfig.json
