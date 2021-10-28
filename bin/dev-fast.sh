# Script to run the development server.
# You need to run this while developing and also before running sypress.sh
cd $(dirname $0)
cd ..
npm run-script start-fast
