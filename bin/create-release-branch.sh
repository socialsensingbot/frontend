#!/bin/bash
set -euo pipefail
# Script to run the for creating a new release branch

cd $(dirname $0)
cd ..

if (( $# < 1 ))
then
  echo "Usage $0: <version>"
  exit 1
fi

echo "Creating git branch 'release/$1' from master"
echo -n "Press enter to continue or Ctr-C to abort:"
read answer
git checkout -b release/$1 master
echo "Changing the release number in src/environments/environment.prod.ts"
sed -i bak -e "s/version:.*\".*\",/version: \"$1\",/" src/environments/environment.prod.ts
git commit -am "Branch for Release $1 created."
git push origin release/$1
