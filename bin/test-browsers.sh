# Script to run headless cross browser tests on local machine.
cd $(dirname $0) || exit 1
cd .. || exit 1
tests="$1"
browsers="chrome:canary edge:canary firefox:dev edge firefox chrome electron "

echo "Running against the following browsers: $browsers"
echo
echo "You can download any missing browsers from here:"
echo
echo "Chrome: https://www.google.co.uk/chrome"
echo "Chrome Canary: https://www.google.com/chrome/canary/"
echo
echo "Firefox: https://www.mozilla.org/en-GB/firefox/"
echo "Firefox Dev: https://www.mozilla.org/en-GB/firefox/developer/"
echo
echo "Edge: https://www.microsoft.com/en-us/edge"
echo "Edge Canary: https://www.microsoftedgeinsider.com/en-us/download"
echo
echo "Electron is built in to Cypress"
echo
echo

function test() {
  for browser in "$@"; do
    echo "TESTING WITH: $browser"
    if npx cypress run -e TEST_AC_USER=${TEST_AC_USER},TEST_AC_PASS=${TEST_AC_PASS} --browser ${browser} --headless --reporter mochawesome --reporter-options "reportDir=cypress/report/mochawesome-report-${browser},overwrite=false,html=false,json=true,timestamp=mmddyyyy_HHMMss" --spec "${tests}"; then
      echo "PASSED"
    else
      echo "FAILED: $browser"
      exit 1
    fi
  done
}

test $browsers
