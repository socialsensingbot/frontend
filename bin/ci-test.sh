# Script to run the for the Amplify Console CI Cypress testing
cd $(dirname $0)
cd ..
tests="cypress/integration/quick/**/*"

if  [[ "${AWS_BRANCH}" = feature* ]]
then  tests="cypress/integration/quick/**/*"
fi
if  [[ "${AWS_BRANCH}" = release* ]]
then  tests="cypress/integration/**/*"
fi
if  [[ "${AWS_BRANCH}" = develop ]]
then  tests="cypress/integration/**/*"
fi
if  [[ "${AWS_BRANCH}" = staging ]]
then
  echo "Tests must not be run on STAGING"
  exit 1
fi
if  [[ "${AWS_BRANCH}" = staging ]]
then
  echo "Tests must not be run on MASTER"
  exit 1
fi


function test() {
  npx cypress run  -e TEST_AC_USER=${TEST_AC_USER},TEST_AC_PASS=${TEST_AC_PASS} --reporter mochawesome --reporter-options "reportDir=cypress/report/mochawesome-report-chrome,overwrite=false,html=false,json=true,timestamp=mmddyyyy_HHMMss" --spec ${tests}
#npx cypress run  -e TEST_AC_USER=${TEST_AC_USER},TEST_AC_PASS=${TEST_AC_PASS} --browser firefox --reporter mochawesome --reporter-options "reportDir=cypress/report/mochawesome-report-firefox,overwrite=false,html=false,json=true,timestamp=mmddyyyy_HHMMss"
}

test || (echo "TESTS FAILED, RETRYING" && test && echo "FLAKEY TESTS PASSED ON RETRY")
