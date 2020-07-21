# Script to run the for the Amplify Console Backend Deployment
set -euxo pipefail
cd $(dirname $0)
export PATH=$PATH:$(pwd)
cd ..
cd amplify && git clean -fdx && cd ..

if [[ "${AWS_BRANCH}" == staging ]]; then
  backup.sh
  amplifyPush --simple
elif [[ "${AWS_BRANCH}" == demo ]]; then
  backup.sh
  amplifyPush --simple
elif [[ "${AWS_BRANCH}" == master ]]; then
  echo "NOTE: No backend changes should me made on master, all must pass through staging. So not pushing backend."
elif [[ "${AWS_BRANCH}" == release* ]]; then
#  backup.sh
  amplify init --yes
  amplify env checkout dev --yes
  amplify push --yes
else
  amplifyPush --simple
fi
