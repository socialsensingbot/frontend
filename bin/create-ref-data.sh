set -euxo pipefail
cd $(dirname $0)
cd ..

function send() {
  while read x; do
    aws dynamodb --profile socialsensing batch-write-item --request-items "{\"$1\": [{\"PutRequest\": {\"Item\":$x}}]}"
  done
}

#Replace testuser with metoffice and dev with prod
timestamp=$(date -u +%FT%TZ)
cat ref_data/datasets.json | jq -c ".Items[]" | sed -e "s/__TIMESTAMP__/$timestamp/g" | send "DataSet-$1"
