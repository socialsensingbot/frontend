#!/bin/bash
set -eo pipefail
# Script to run the for creating a new release branch

cd $(dirname $0)
cd ..
branch="${2:-master}"

if (($# < 2)); then
  echo "Usage $0: <version> [<branch>]"
  exit 1
fi

echo "Creating git branch 'release/$1' from ${branch}"
echo -n "Press enter to continue or Ctr-C to abort:"
read answer
git checkout -b release/$1 origin/${branch}
echo "Changing the release number in src/environments/environment.prod.ts"
sed -i bak -e "s/version:.*\".*\",/version: \"$1\",/" src/environments/environment.prod.ts
git commit -am "Branch for Release $1 created."
git push origin release/$1
