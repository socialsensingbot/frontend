set -euxo pipefail
cd $(dirname $0)
cd ..

echo "Backing up environments"
npm install -g cognito-backup
cognito-backup backup-all-users eu-west-2_dkJC8ZcOU --region eu-west-2
for file in eu-west-2*.json
do
  aws s3 cp $file s3://socialsensing-backups/cognito/$file
  rm $file
done

for table in $(aws dynamodb list-tables  | jq -r .TableNames[])
do
  aws dynamodb scan --profile socialsensing --table-name $table --output json > /tmp/table-dump.json
  aws s3 cp  /tmp/table-dump.json s3://socialsensing-backups/dynamodb/$table.json
done
