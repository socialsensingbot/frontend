set -euxo pipefail
cd $(dirname $0)
cd ..

function send() {
  while read x; do
    aws dynamodb --profile socialsensing batch-write-item --request-items $x
  done
}

#Replace testuser with metoffice and dev with prod

#aws dynamodb scan --table-name TweetIgnore-2qd3ccix5rfpjoq6numnkjpzxm-prod --profile socialsensing | jq -c '.Items[] | {"GroupTweetIgnore-ylh6vfwytjailgoufaol7tgqb4-dev": [{"PutRequest": {"Item":{"__typename": { "S": "GroupTweetIgnore" }, id:{"S": ("testuser:" + .tweetId.S) }, tweetId:.tweetId, url: .url, updatedAt: .updatedAt, createdAt: .createdAt,ignoredBy:.owner, "ownerGroups": { "L": [ { "S": "testuser" } ] }}}}]}' > /tmp/items.json
#send < /tmp/items.json

#aws dynamodb scan --table-name TwitterUserIgnore-2qd3ccix5rfpjoq6numnkjpzxm-prod --profile socialsensing | jq -c '.Items[] | {"GroupTwitterUserIgnore-ylh6vfwytjailgoufaol7tgqb4-dev": [{"PutRequest": {"Item":{"__typename": { "S": "GroupTwitterUserIgnore" }, id:{"S": ("testuser:" + .twitterScreenName.S) }, twitterScreenName:.twitterScreenName,  updatedAt: .updatedAt, createdAt: .createdAt, ignoredBy:.owner, "ownerGroups": { "L": [ { "S": "testuser" } ] }}}}]}' > /tmp/items.json
#send < /tmp/items.json
