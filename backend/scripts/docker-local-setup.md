# DynamoDB Local Setup Guide

## Task 0: Setup with Docker Compose (Recommended)
This method ensures your data persists in the `./docker/dynamodb` folder.
*Make sure you are in the `backend/` directory.*

Command:
```bash
docker-compose up -d
```

## Task 1: Manual Setup with Docker (Alternative)
*Use this only if docker-compose is not working. Standardized to port 8001 to match .env.*

Command:
```bash
docker run -d --name dynamodb-local `
  -p 8001:8000 `
  -v "${PWD}/docker/dynamodb:/home/dynamodblocal/data" `
  amazon/dynamodb-local `
  -jar DynamoDBLocal.jar -sharedDb -dbPath /home/dynamodblocal/data
```

## Data Persistence & Reliability
> [!IMPORTANT]
> Your data is stored in the `backend/docker/dynamodb/shared-local-instance.db` file. 
> 
> - **DO NOT** delete the `backend/docker/dynamodb` folder if you want to keep your data.
> - **DO NOT** use `docker-compose down -v` as it might clear configurations.
> - **DO** use `docker-compose stop` and `docker-compose start` (or `up -d`) to maintain state.

## Troubleshooting: Data "Gone" After Restart?
If you restart and `aws dynamodb list-tables` returns an empty list:
1. **Check the Port**: Ensure you are using port **8001** (check your `.env` file).
2. **Check the Volume**: Ensure the folder `backend/docker/dynamodb` contains `shared-local-instance.db`.
3. **Re-initialize**: If the table structure is missing, you MUST re-run **Task 5** to create the `gujcet-platform` table.

---

## Task 2: Check running containers
Command:
```bash
docker ps
```

## Task 3: Test connection (list tables)
Command:
```bash
aws dynamodb list-tables --endpoint-url http://localhost:8001
```

## Task 4: List tables with region
Command:
```bash
aws dynamodb list-tables --endpoint-url http://localhost:8001 --region ap-south-1
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
  --endpoint-url http://localhost:8001 `
  --region ap-south-1
```

## Task 6: Scan table to view data
Command:
```bash
aws dynamodb scan `
  --table-name gujcet-platform `
  --endpoint-url http://localhost:8001 `
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