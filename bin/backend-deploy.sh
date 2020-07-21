# Script to run the for the Amplify Console Backend Deployment
set -euxo pipefail
cd $(dirname $0)
export PATH=$PATH:$(pwd)
cd ..
git clean -fdx

if [[ "${AWS_BRANCH}" == staging ]]; then
  backup.sh
  amplifyPush --simple
elif [[ "${AWS_BRANCH}" == demo ]]; then
  backup.sh
  amplifyPush --simple
elif [[ "${AWS_BRANCH}" == master ]]; then
  echo "NOTE: No backend changes should me made on master, all must pass through staging. So not pushing backend."
elif [[ "${AWS_BRANCH}" == release* ]]; then
  backup.sh
  amplifyPush --simple
else
  amplifyPush --simple
fi
