#!/bin/bash

# Fetch the organization ID of the AWS Organization
org_id=$(aws organizations describe-organization --query "Organization.Id" --output text)

# Check for errors or empty response
if [ -z "$org_id" ] || [ "$org_id" == "None" ]; then
    echo "Error: No Organization Id found"
    exit 1
fi

# If successful, print the organization ID
echo "awsOrganizationsId=$org_id"
