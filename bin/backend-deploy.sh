# Script to run the for the Amplify Console Backend Deployment
set -euxo pipefail
cd "$(dirname $0)"
export PATH=$PATH:$(pwd)
cd ..
#cd amplify && git clean -fdx && cd ..
./amplify/backend/function/query/build.sh
./amplify/backend/function/api/build.sh

if [[ "${AWS_BRANCH}" == staging ]]; then
  backup.sh
  amplifyPush --simple
elif [[ "${AWS_BRANCH}" == demo ]]; then
  envCache --set stackInfo ""
  amplifyPush --simple
  backup.sh
elif [[ "${AWS_BRANCH}" == master ]]; then
  echo "NOTE: No backend changes should me made on master, all must pass through staging. So not pushing backend."
elif [[ "${AWS_BRANCH}" == release* ]]; then
  #  backup.sh
  amplifyPush --simple
else
  amplifyPush --simple
fi
