# Script to run the for the Amplify Console Backend Deployment
set -euxo pipefail
cd "$(dirname $0)"
export PATH=$PATH:$(pwd)
cd ..
#cd amplify && git clean -fdx && cd ..



amplify_push() {
  ENV=$1
AMPLIFY="{\
\"envName\":\"${ENV}\",\
\"appId\":\"${AWS_APP_ID}\"\
}"

AWSCONFIG="{\
\"configLevel\":\"project\",\
\"useProfile\":true,\
\"profileName\":\"default\",\
\"AmplifyAppId\":\"${AWS_APP_ID}\"\
}"

PROVIDERS="{\
\"awscloudformation\":${AWSCONFIG}\
}"

CODEGEN="{\
\"generateCode\":true,\
\"generateDocs\":false\
}"

  pwd
  amplify init --amplify ${AMPLIFY} --providers ${PROVIDERS} --codegen ${CODEGEN} --yes;
  amplify env checkout ${ENV}
  amplify codegen
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
