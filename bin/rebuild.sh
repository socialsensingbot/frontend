# Script to run the for the Amplify Console CI Cypress testing
cd $(dirname $0)
cd ..
cp src/app/map/data/map-data.ts api/
cd api && npm install
cd ./amplify/backend/function/query && npm install && ./build.sh
cd ./amplify/backend/function/api && npm install && ./build.sh
cd ./amplify/backend/function/sqsquery && npm install && ./build.sh

npx browserslist@latest --update-db

if [[ "${AWS_BRANCH}" == staging ]]; then
  npm run-script build-prod
elif [[ "${AWS_BRANCH}" == demo ]]; then
  npm run-script build-demo
elif [[ "${AWS_BRANCH}" == master ]]; then
  npm run-script build-prod
elif [[ "${AWS_BRANCH}" == test ]]; then
  npm run-script build-test
else
  npm run-script build
fi
