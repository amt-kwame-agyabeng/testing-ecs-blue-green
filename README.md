# ECS Blue-Green Deployment with AWS CodePipeline

This project demonstrates how to set up a complete CI/CD pipeline for containerized applications using AWS ECS with Blue-Green deployment strategy.

## Architecture Overview

The solution uses the following AWS services:
- **Amazon ECS (Fargate)** - Container orchestration
- **Application Load Balancer (ALB)** - Traffic routing
- **AWS CodeBuild** - Build automation
- **AWS CodeDeploy** - Blue-Green deployment
- **AWS CodePipeline** - CI/CD orchestration
- **Amazon ECR** - Container registry
- **GitHub** - Source code repository

## Prerequisites

- AWS CLI configured with appropriate permissions
- GitHub repository with your application code
- Docker installed locally (for testing)

## Setup Instructions

### 1. Repository Setup

Ensure your GitHub repository contains the following required files:
- `appspec.yaml` (CodeDeploy configuration)
- `buildspec.yaml` (CodeBuild configuration)
- `taskdef.json` (ECS task definition)
- `Dockerfile` (Container image definition)

### 2. AWS Infrastructure Setup

#### Security Groups
Create security groups for:
- Application Load Balancer (allow HTTP/HTTPS traffic)
- ECS tasks (allow traffic from ALB)

#### Load Balancer Configuration
1. Create an Application Load Balancer (ALB)
2. Create two target groups for Blue-Green deployment
3. Configure health checks for both target groups

#### Container Registry
Create an Amazon ECR repository to store your container images.

#### ECS Configuration
1. Create an ECS cluster (Fargate)
2. Create an ECS task definition
3. Create an ECS service

### 3. Required Configuration Files

#### taskdef.json
```json
{
  "family": "testing-ecs-blue-green-td",
  "containerDefinitions": [
    {
      "name": "testing-ecs-blue-green",
      "image": "public.ecr.aws/s6h7h0u3/mrrobertamoah/testing-ecs-blue-green:latest",
      "cpu": 256,
      "memory": 512,
      "portMappings": [
        {
          "name": "testing-ecs-blue-green-3000-tcp",
          "containerPort": 3000,
          "hostPort": 3000,
          "protocol": "tcp",
          "appProtocol": "http"
        }
      ],
      "essential": true,
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/testing-ecs-blue-green-td",
          "awslogs-create-group": "true",
          "awslogs-region": "eu-north-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ],
  "executionRoleArn": "arn:aws:iam::137068240060:role/ecsTaskExecutionRole",
  "networkMode": "awsvpc",
  "volumes": [],
  "placementConstraints": [],
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "runtimePlatform": {
    "cpuArchitecture": "X86_64",
    "operatingSystemFamily": "LINUX"
  },
  "enableFaultInjection": false
}
```

#### appspec.yaml
```yaml
version: 0.0
Resources:
  - TargetService:
      Type: AWS::ECS::Service
      Properties:
        TaskDefinition: "arn:aws:ecs:eu-north-1:137068240060:task-definition/testing-ecs-blue-green-td:1"
        LoadBalancerInfo:
          ContainerName: "testing-ecs-blue-green"
          ContainerPort: 3000
        PlatformVersion: "LATEST"
        NetworkConfiguration:
          AwsvpcConfiguration:
            AssignPublicIp: "ENABLED"
            Subnets: ["subnet-0e", "subnet-058"]
            SecurityGroups: ["sg-083"]
```

#### buildspec.yaml
```yaml
version: 0.2
phases:
  pre_build:
    commands:
      - echo Logging in to Amazon ECR...
      - aws ecr-public get-login-password --region us-east-1 | docker login --username AWS --password-stdin public.ecr.aws/<identifier>
  build:
    commands:
      - echo Build started on `date`
      - docker build -t $REPOSITORY_URI:latest .
      - docker tag $REPOSITORY_URI:latest $REPOSITORY_URI:$CODEBUILD_RESOLVED_SOURCE_VERSION
  post_build:
    commands:
      - echo Pushing the Docker image...
      - docker push $REPOSITORY_URI:latest
      - docker push $REPOSITORY_URI:$CODEBUILD_RESOLVED_SOURCE_VERSION
      - printf '[{"name":"testing-ecs-blue-green","imageUri":"%s"}]' $REPOSITORY_URI:$CODEBUILD_RESOLVED_SOURCE_VERSION > imagedefinitions.json
artifacts:
  files:
    - imagedefinitions.json
    - appspec.yaml
    - taskdef.json
```
You can copy the push login command by using the ECR console by using the `view push commands`.

### 4. CodeBuild Configuration

1. Create a CodeBuild project
2. Set the following environment variable:
   - `REPOSITORY_URI` - Your ECR repository URI

### 5. CodeDeploy Configuration

1. Create a CodeDeploy application
2. Create a deployment group for ECS Blue-Green deployment
3. Configure the deployment group with your ECS service and load balancer

### 6. CodePipeline Setup

Create a pipeline with the following stages:

1. **Source Stage**: Connect to your GitHub repository
2. **Build Stage**: Use the CodeBuild project created above
3. **Deploy Stage**: Use the CodeDeploy application and deployment group

*Note: Test stage is optional and can be skipped for this basic setup.*

## Deployment Process

1. Push code changes to your GitHub repository
2. CodePipeline automatically triggers the build process
3. CodeBuild creates a new container image and pushes it to ECR
4. CodeDeploy performs a Blue-Green deployment to ECS
5. Traffic is gradually shifted from the old version to the new version

## Important Notes

- Update the ARNs, subnet IDs, and security group IDs in the configuration files to match your AWS environment
- Ensure your ECS task execution role has the necessary permissions
- Monitor CloudWatch logs for troubleshooting deployment issues
- Test your application thoroughly before deploying to production

## Troubleshooting

- Check CodeBuild logs for build failures
- Verify ECS service health in the AWS Console
- Monitor ALB target group health checks
- Review CodeDeploy deployment logs for deployment issues
