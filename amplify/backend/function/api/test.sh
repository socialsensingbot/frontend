cd "$(dirname $0)"
cd src
tsc --project tsconfig.json
npx mocha -b --timeout 26s --exit --trace-warnings test/**/*.test.js
