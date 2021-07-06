# Script to run the for the Amplify Console CI Cypress testing
cd $(dirname $0)
cd ..

if [[ "${AWS_BRANCH}" == staging ]]; then
  npm run-script build-prod
elif [[ "${AWS_BRANCH}" == demo ]]; then
  npm run-script build-demo
elif [[ "${AWS_BRANCH}" == master ]]; then
  npm run-script build-prod
elif [[ "${AWS_BRANCH}" == pwsdemo ]]; then
  npm run-script build-prod
else
  npm run-script build
fi
