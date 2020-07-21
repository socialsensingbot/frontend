# Script to run the for the Amplify Console Backend Deployment
set -euxo pipefail
cd "$(dirname $0)"
export PATH=$PATH:$(pwd)
cd ..
#cd amplify && git clean -fdx && cd ..

amplify_push() {
  pwd
  amplify init --yes
  amplify env checkout $1 --yes
  amplify push --yes
}

if [[ "${AWS_BRANCH}" == staging ]]; then
  backup.sh
  amplify_push prod
elif [[ "${AWS_BRANCH}" == demo ]]; then
  backup.sh
  amplify_push demo
elif [[ "${AWS_BRANCH}" == master ]]; then
  amplify init --yes
  amplify env checkout prod --yes
  echo "NOTE: No backend changes should me made on master, all must pass through staging. So not pushing backend."
elif [[ "${AWS_BRANCH}" == release* ]]; then
#  backup.sh
  amplify_push dev
else
  amplify_push dev
fi
