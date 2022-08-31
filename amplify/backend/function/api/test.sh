cd "$(dirname $0)"
cd src
tsc --project tsconfig.json
TZ='UTC' npx mocha -b --timeout 26s --exit --trace-warnings test/**/*.test.js
