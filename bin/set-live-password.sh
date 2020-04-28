# Use this script to set user passwords in AWS
# Note you need to create a profile called socialsensing with your AWS credentials
# An example id is ce259cfd-65cc-4fa8-8cd1-604c1fc37b05
# PLEASE SEE https://github.com/socialsensingbot/frontend#aws-services

aws cognito-idp admin-set-user-password --user-pool-id eu-west-2_dkJC8ZcOU --username $1 --password $2 --profile socialsensing
