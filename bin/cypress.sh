# Script to run the Cypress UI for testing
# Make sure you set the environment variables:
# TEST_AC_USER (test a/c username) and TEST_AC_PASS (test a/c password)
cd $(dirname $0)
cd ..
export SNAPSHOT_DIFF_DIRECTORY=$(pwd)/cypress/snapshot-diff
export SNAPSHOT_BASE_DIRECTORY=$(pwd)/cypress/snapshots
DEBUG=cypress:* node ./node_modules/cypress/bin/cypress open -e TEST_AC_USER=${TEST_AC_USER},TEST_AC_PASS=${TEST_AC_PASS}
