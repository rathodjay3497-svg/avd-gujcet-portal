# DynamoDB Local Setup Guide

## Task 1: Setup with Docker
Command:
```bash
docker run -d --name dynamodb-local `
  -p 8000:8000 `
  -v "${PWD}\data:/home/dynamodblocal/data" `
  amazon/dynamodb-local `
  -jar DynamoDBLocal.jar -sharedDb -dbPath /home/dynamodblocal/data
```

## Task 2: Check running containers
Command:
```bash
docker ps
```

## Task 3: Test connection (list tables)
Command:
```bash
aws dynamodb list-tables --endpoint-url http://localhost:8000
```

## Task 4: List tables with region
Command:
```bash
aws dynamodb list-tables --endpoint-url http://localhost:8000 --region ap-south-1
```

## Task 5: Create table 'gujcet-platform' with GSI
Command:
```bash
aws dynamodb create-table `
  --table-name gujcet-platform `
  --attribute-definitions `
    AttributeName=PK,AttributeType=S `
    AttributeName=SK,AttributeType=S `
    AttributeName=GSI1PK,AttributeType=S `
    AttributeName=GSI1SK,AttributeType=S `
    AttributeName=entity_type,AttributeType=S `
    AttributeName=created_at,AttributeType=S `
  --key-schema `
    AttributeName=PK,KeyType=HASH `
    AttributeName=SK,KeyType=RANGE `
  --global-secondary-indexes file://scripts/gsi.json `
  --billing-mode PAY_PER_REQUEST `
  --endpoint-url http://localhost:8000 `
  --region ap-south-1
```

## Task 6: Scan table to view data
Command:
```bash
aws dynamodb scan `
  --table-name gujcet-platform `
  --endpoint-url http://localhost:8000 `
  --region ap-south-1 `
| ConvertFrom-Json | ConvertTo-Json -Depth 10
```

## Task 7: Stop DynamoDB Local container
Command:
```bash
docker stop dynamodb-local
```

## Task 8: Start DynamoDB Local container again
Command:
```bash
docker start dynamodb-local
```

## Task 9: Remove DynamoDB Local container
Command:
```bash
docker rm dynamodb-local
```
*Note: After removing, re-run Task 1 to recreate the container.*

## Task 10: View container logs
Command:
```bash
docker logs dynamodb-local
```