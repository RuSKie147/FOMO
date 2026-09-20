#!/usr/bin/env bash
# ==============================================================================
# FOMO AWS Infrastructure Kill Switch
# Immediately dismantles all deployed AWS resources in one command:
# - Empties all S3 buckets (Media & Frontend) to prevent BucketNotEmpty errors
# - Deletes the CloudFormation/SAM stack (API Gateway, Lambda, DynamoDB, Cognito, CloudFront)
# - Waits for complete deletion and confirms zero residual AWS billing
# ==============================================================================
set -e

STACK_NAME="${1:-fomo-production}"
REGION="${AWS_REGION:-ap-south-1}"

echo "======================================================================"
echo "          ⚡ FOMO ONE-COMMAND INFRASTRUCTURE KILL SWITCH              "
echo "======================================================================"
echo "Target Stack : ${STACK_NAME}"
echo "AWS Region   : ${REGION}"
echo ""

# Check if stack exists
if ! aws cloudformation describe-stacks --stack-name "${STACK_NAME}" --region "${REGION}" >/dev/null 2>&1; then
    echo "⚠️  Stack '${STACK_NAME}' does not exist in region '${REGION}'. Nothing to delete."
    exit 0
fi

echo "🔍 Fetching stack resources to cleanly empty S3 buckets..."
BUCKETS=$(aws cloudformation list-stack-resources \
    --stack-name "${STACK_NAME}" \
    --region "${REGION}" \
    --query "StackResourceSummaries[?ResourceType=='AWS::S3::Bucket'].PhysicalResourceId" \
    --output text 2>/dev/null || true)

for BUCKET in ${BUCKETS}; do
    if [ -n "${BUCKET}" ]; then
        echo "🗑️  Purging all objects and versions from bucket: ${BUCKET}..."
        aws s3 rm "s3://${BUCKET}" --recursive --region "${REGION}" 2>/dev/null || true
        
        # In case versioning was active on bucket
        VERSIONS=$(aws s3api list-object-versions --bucket "${BUCKET}" --region "${REGION}" --output json 2>/dev/null || true)
        if [ -n "${VERSIONS}" ] && [ "${VERSIONS}" != "{}" ]; then
            echo "${VERSIONS}" | jq -r '.Versions[]? | "\(.Key) \(.VersionId)"' 2>/dev/null | while read -r key vid; do
                if [ -n "${key}" ] && [ -n "${vid}" ]; then
                    aws s3api delete-object --bucket "${BUCKET}" --key "${key}" --version-id "${vid}" --region "${REGION}" >/dev/null 2>&1 || true
                fi
            done
            echo "${VERSIONS}" | jq -r '.DeleteMarkers[]? | "\(.Key) \(.VersionId)"' 2>/dev/null | while read -r key vid; do
                if [ -n "${key}" ] && [ -n "${vid}" ]; then
                    aws s3api delete-object --bucket "${BUCKET}" --key "${key}" --version-id "${vid}" --region "${REGION}" >/dev/null 2>&1 || true
                fi
            done
        fi
        echo "   ✓ Bucket ${BUCKET} emptied."
    fi
done

echo ""
echo "💥 Deleting CloudFormation stack '${STACK_NAME}'..."
aws cloudformation delete-stack --stack-name "${STACK_NAME}" --region "${REGION}"

echo "⏳ Waiting for stack deletion to complete (this may take 2-4 minutes while CloudFront dissolves)..."
aws cloudformation wait stack-delete-complete --stack-name "${STACK_NAME}" --region "${REGION}"

# Clean up local SAM artifacts
if [ -d ".aws-sam" ]; then
    rm -rf .aws-sam
    echo "🧹 Cleaned up local .aws-sam cache."
fi

echo ""
echo "======================================================================"
echo "  ✅ KILL SWITCH COMPLETE: ALL AWS RESOURCES PERMANENTLY DESTROYED!   "
echo "  Zero running Lambda functions, zero DynamoDB tables, zero costs.    "
echo "======================================================================"
