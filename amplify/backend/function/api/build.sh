cd ../../../../api || exit
npm install
npm pack
cd - || exit
cd src || exit
npm install ../../../../../api/socialsensing-api*.tgz
npm install
tsc --project tsconfig.json
