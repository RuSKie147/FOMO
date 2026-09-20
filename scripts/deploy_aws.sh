#!/usr/bin/env bash
# ==============================================================================
# FOMO One-Command AWS Production Deployment
# 1. Builds and deploys backend, API Gateway, DynamoDB, S3, Cognito & CloudFront
# 2. Injects deployed API Gateway URL into frontend and builds React SPA
# 3. Uploads frontend build to S3 and invalidates CloudFront cache
# ==============================================================================
set -e

STACK_NAME="${1:-fomo-production}"
REGION="${AWS_REGION:-ap-south-1}"
SES_EMAIL="${SES_SENDER_EMAIL:-squad@fomo.app}"

echo "======================================================================"
echo "          🚀 FOMO AUTOMATED AWS PRODUCTION DEPLOYMENT                 "
echo "======================================================================"
echo "Stack Name : ${STACK_NAME}"
echo "Region     : ${REGION}"
echo ""

# 1. SAM Build
echo "📦 Step 1: Building backend SAM package (Python 3.12)..."
sam build --template-file infra/template.yaml

# 2. SAM Deploy
echo ""
echo "☁️  Step 2: Deploying CloudFormation infrastructure..."
sam deploy \
    --stack-name "${STACK_NAME}" \
    --region "${REGION}" \
    --capabilities CAPABILITY_IAM \
    --no-fail-on-empty-changeset \
    --resolve-s3 \
    --parameter-overrides \
        SesSenderEmail="${SES_EMAIL}"

# 3. Extract Outputs
echo ""
echo "🔍 Step 3: Fetching deployment outputs..."
API_URL=$(aws cloudformation describe-stacks \
    --stack-name "${STACK_NAME}" \
    --region "${REGION}" \
    --query "Stacks[0].Outputs[?OutputKey=='ApiUrl'].OutputValue" \
    --output text)

FRONTEND_BUCKET=$(aws cloudformation describe-stacks \
    --stack-name "${STACK_NAME}" \
    --region "${REGION}" \
    --query "Stacks[0].Outputs[?OutputKey=='FrontendBucket'].OutputValue" \
    --output text)

CF_DIST_ID=$(aws cloudformation describe-stacks \
    --stack-name "${STACK_NAME}" \
    --region "${REGION}" \
    --query "Stacks[0].Outputs[?OutputKey=='CloudFrontDistributionId'].OutputValue" \
    --output text)

FRONTEND_URL=$(aws cloudformation describe-stacks \
    --stack-name "${STACK_NAME}" \
    --region "${REGION}" \
    --query "Stacks[0].Outputs[?OutputKey=='FrontendUrl'].OutputValue" \
    --output text)

echo "   - API Gateway URL        : ${API_URL}"
echo "   - Frontend S3 Bucket     : ${FRONTEND_BUCKET}"
echo "   - CloudFront Distribution: ${CF_DIST_ID}"
echo "   - Live Frontend URL      : ${FRONTEND_URL}"

# 4. Build Frontend with Live API URL
echo ""
echo "⚛️  Step 4: Compiling frontend React production build..."
cd frontend
export VITE_API_URL="${API_URL}"
npm run build
cd ..

# 5. Upload frontend to S3
echo ""
echo "🚀 Step 5: Syncing build assets to S3 (s3://${FRONTEND_BUCKET})..."
aws s3 sync frontend/dist/ "s3://${FRONTEND_BUCKET}/" --delete --region "${REGION}"

# 6. Invalidate CloudFront edge cache (if CloudFront is used)
if [ -n "${CF_DIST_ID}" ] && [ "${CF_DIST_ID}" != "None" ]; then
    echo ""
    echo "⚡ Step 6: Invalidating CloudFront edge cache..."
    aws cloudfront create-invalidation \
        --distribution-id "${CF_DIST_ID}" \
        --paths "/*" >/dev/null || true
fi

echo ""
echo "======================================================================"
echo "  🎉 FOMO IS LIVE ON AWS!                                             "
echo "======================================================================"
echo "  🌐 Live URL: ${FRONTEND_URL}"
echo "  📡 API URL : ${API_URL}"
echo ""
echo "  To dismantle the entire deployment at any time, run:"
echo "  ./scripts/kill_switch.sh ${STACK_NAME}"
echo "======================================================================"
