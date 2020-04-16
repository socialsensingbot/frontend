cd $(dirname $0)
cd ..
node ./node_modules/cypress/bin/cypress open -e TEST_AC_USER=${TEST_AC_USER},TEST_AC_PASS=${TEST_AC_PASS} 
