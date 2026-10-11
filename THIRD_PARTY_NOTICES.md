# Third-Party Notices

This project uses the following open-source libraries and dependencies.

## Runtime Dependencies

| Package | Version | Licence | Source |
|---|---|---|---|
| zod | ^3.23.0 | MIT | https://github.com/colinhacks/zod |
| react | ^18.x | MIT | https://github.com/facebook/react |
| react-dom | ^18.x | MIT | https://github.com/facebook/react |
| vite | ^5.x | MIT | https://github.com/vitejs/vite |
| @vitejs/plugin-react | ^4.x | MIT | https://github.com/vitejs/vite-plugin-react |
| react-router-dom | ^6.x | MIT | https://github.com/remix-run/react-router |
| xlsx (SheetJS Community Edition) | ^0.18.x | Apache-2.0 | https://github.com/SheetJS/sheetjs |
| @aws-sdk/client-dynamodb | ^3.x | Apache-2.0 | https://github.com/aws/aws-sdk-js-v3 |
| @aws-sdk/client-s3 | ^3.x | Apache-2.0 | https://github.com/aws/aws-sdk-js-v3 |
| @aws-sdk/client-textract | ^3.x | Apache-2.0 | https://github.com/aws/aws-sdk-js-v3 |
| @aws-sdk/client-sfn | ^3.x | Apache-2.0 | https://github.com/aws/aws-sdk-js-v3 |
| @aws-sdk/s3-presigned-post | ^3.x | Apache-2.0 | https://github.com/aws/aws-sdk-js-v3 |

## Development Dependencies

| Package | Version | Licence | Source |
|---|---|---|---|
| typescript | ^5.6.0 | Apache-2.0 | https://github.com/microsoft/TypeScript |
| vitest | ^2.1.0 | MIT | https://github.com/vitest-dev/vitest |
| aws-sam-cli | Latest | Apache-2.0 | https://github.com/aws/aws-sam-cli |

## AWS Services

| Service | Purpose |
|---|---|
| Amazon S3 | BOQ storage, evidence storage, Textract output cache |
| Amazon Textract | PDF table extraction |
| AWS Step Functions | Orchestrate async extraction pipeline |
| AWS Lambda | API handlers and pipeline steps |
| Amazon DynamoDB | Job state, lines, recommendations, deliveries |
| AWS API Gateway (HTTP API) | Public API endpoint |
| AWS Amplify | Frontend hosting |
| Amazon CloudWatch | Logs with jobId correlation |
| AWS Budgets | Cost alarm |

## Fonts

- Inter (Google Fonts) — SIL Open Font Licence 1.1

## Data Sources

See [SOURCES.md](SOURCES.md) for all regulatory and third-party data sources.
