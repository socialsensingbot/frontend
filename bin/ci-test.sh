# Script to run the for the Amplify Console CI Cypress testing
cd $(dirname $0)
cd ..
function test() {
  npx cypress run  -e TEST_AC_USER=${TEST_AC_USER},TEST_AC_PASS=${TEST_AC_PASS} --reporter mochawesome --reporter-options "reportDir=cypress/report/mochawesome-report-chrome,overwrite=false,html=false,json=true,timestamp=mmddyyyy_HHMMss"
#npx cypress run  -e TEST_AC_USER=${TEST_AC_USER},TEST_AC_PASS=${TEST_AC_PASS} --browser firefox --reporter mochawesome --reporter-options "reportDir=cypress/report/mochawesome-report-firefox,overwrite=false,html=false,json=true,timestamp=mmddyyyy_HHMMss"
}

test || (echo "TESTS FAILED, RETRYING" && test && echo "FLAKEY TESTS PASSED ON RETRY")
