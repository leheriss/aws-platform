#!/bin/bash

# Fetch the root OU ID of the AWS Organization
root_ou_id=$(aws organizations list-roots --query "Roots[0].Id" --output text)

# Check for errors or empty response
if [ -z "$root_ou_id" ] || [ "$root_ou_id" == "None" ]; then
    echo "Error: No Root Organizations Id found"
    exit 1
fi

# If successful, print the root OU ID
echo "rootOuId=$root_ou_id"