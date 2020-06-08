# Use this script to remove no-longer used feature branch environments
# Amplify creates a feature branch environment for every feature/xxx branch
# In github. Run this script to remove them when no longer needed.
# Passsing the xxx value as the first and only argument to the script
aws amplify delete-branch --app-id dtmxl3q3i7oix --branch-name "feature/frontend-$1" --profile socialsensing
