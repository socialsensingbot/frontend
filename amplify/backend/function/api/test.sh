cd "$(dirname $0)"
cd src
tsc --project tsconfig.json
STORAGE_JSONSTORAGE_BUCKETNAME=json183906-dev TZ='UTC' npx mocha -b --timeout 180s --exit --trace-warnings test/**/*.test.js
