# Script to run the for creating a new release branch
cd $(dirname $0) || exit 1
cd .. || exit 1

if (($? < 1)); then
  echo "Usage $0: <version>"
  exit 1
fi
echo "Creating git branch 'release/$1' from master"
echo "Changing the release number in src/environments/environment.prod.ts"
sed -i bak -e "s/version:.*\".*\",/version: \"$1\",/" src/environments/environment.prod.ts
git commit -am "Branch for Release $1 created."
git push origin release/$1
