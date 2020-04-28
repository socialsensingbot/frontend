# Use this script to create live users in AWS
# Note you need to create a profile called socialsensing with your AWS credentials
#
# PLEASE SEE https://github.com/socialsensingbot/frontend#aws-services

if [ $# -ne 2 ]; then
  echo "$0 <email> <temp-password>"
  exit 1
fi
aws cognito-idp --profile socialsensing admin-create-user --user-pool-id eu-west-2_dkJC8ZcOU --username $1 --user-attributes Name=email,Value=$1 Name=email_verified,Value=true --temporary-password $2
