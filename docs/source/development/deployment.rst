==========
Deployment
==========

This guide covers deployment strategies for The Genius Project across different environments, from local development to production cloud deployments.

Deployment Overview
===================

The Genius Project supports multiple deployment strategies:

- **Local Development**: Docker Compose for full-stack development
- **Vercel Serverless**: Frontend and API deployment
- **Docker Production**: Containerized production deployment
- **Cloud Services**: AWS, GCP, or Azure deployment
- **Hybrid Deployment**: Mixed cloud and on-premise solutions

Environment Configuration
==========================

Environment Variables
----------------------

Create environment-specific configuration files:

**Development (.env.development)**:

.. code-block:: bash

   # Application
   FLASK_ENV=development
   DEBUG=True
   SECRET_KEY=dev-secret-key
   JWT_SECRET_KEY=dev-jwt-secret
   
   # Database
   MONGODB_URI=mongodb://localhost:27017/genius_dev
   DATABASE_URL=sqlite:///instance/genius_dev.db
   
   # AI Services
   OLLAMA_BASE_URL=http://localhost:11434
   OPENAI_API_KEY=your-openai-dev-key
   PINECONE_API_KEY=your-pinecone-dev-key
   PINECONE_ENVIRONMENT=us-west1-gcp
   
   # External Services
   TIKTOK_CLIENT_ID=your-dev-tiktok-id
   META_APP_ID=your-dev-meta-id
   
   # Application Settings
   UPLOAD_FOLDER=./uploads
   MAX_CONTENT_LENGTH=16777216
   CORS_ORIGINS=http://localhost:3000

**Production (.env.production)**:

.. code-block:: bash

   # Application
   FLASK_ENV=production
   DEBUG=False
   SECRET_KEY=${SECRET_KEY}
   JWT_SECRET_KEY=${JWT_SECRET_KEY}
   
   # Database
   MONGODB_URI=${MONGODB_URI}
   DATABASE_URL=${DATABASE_URL}
   
   # AI Services
   OLLAMA_BASE_URL=${OLLAMA_BASE_URL}
   OPENAI_API_KEY=${OPENAI_API_KEY}
   PINECONE_API_KEY=${PINECONE_API_KEY}
   PINECONE_ENVIRONMENT=${PINECONE_ENVIRONMENT}
   
   # External Services
   TIKTOK_CLIENT_ID=${TIKTOK_CLIENT_ID}
   META_APP_ID=${META_APP_ID}
   
   # Security
   CORS_ORIGINS=${CORS_ORIGINS}
   RATE_LIMIT_PER_HOUR=1000

Configuration Management
------------------------

.. code-block:: python

   # backend/config/settings.py
   import os
   from typing import List

   class Config:
       """Base configuration."""
       SECRET_KEY = os.environ.get('SECRET_KEY')
       JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY')
       MONGODB_URI = os.environ.get('MONGODB_URI')
       
   class DevelopmentConfig(Config):
       """Development configuration."""
       DEBUG = True
       TESTING = False
       CORS_ORIGINS = ['http://localhost:3000']
       
   class ProductionConfig(Config):
       """Production configuration."""
       DEBUG = False
       TESTING = False
       CORS_ORIGINS = os.environ.get('CORS_ORIGINS', '').split(',')
       
   class TestingConfig(Config):
       """Testing configuration."""
       DEBUG = True
       TESTING = True
       MONGODB_URI = 'mongodb://localhost:27017/genius_test'

   config = {
       'development': DevelopmentConfig,
       'production': ProductionConfig,
       'testing': TestingConfig,
       'default': DevelopmentConfig
   }

Local Docker Deployment
=======================

Docker Compose Setup
--------------------

**docker-compose.yml**:

.. code-block:: yaml

   version: '3.8'

   services:
     backend:
       build:
         context: .
         dockerfile: Dockerfile
       ports:
         - "5002:5002"
       environment:
         - FLASK_ENV=development
         - MONGODB_URI=mongodb://mongodb:27017/genius_db
         - OLLAMA_BASE_URL=http://ollama:11434
       volumes:
         - ./backend:/app/backend
         - ./uploads:/app/uploads
       depends_on:
         - mongodb
         - ollama
       networks:
         - genius-network

     frontend:
       build:
         context: ./frontend
         dockerfile: Dockerfile
       ports:
         - "3000:3000"
       environment:
         - REACT_APP_API_URL=http://localhost:5002
       volumes:
         - ./frontend/src:/app/src
       networks:
         - genius-network

     rag-app:
       build:
         context: ./rag-app
         dockerfile: Dockerfile
       ports:
         - "8000:8000"
       environment:
         - OLLAMA_BASE_URL=http://ollama:11434
       volumes:
         - ./rag-app/data:/app/data
         - ./rag-app/db:/app/db
       depends_on:
         - ollama
       networks:
         - genius-network

     mongodb:
       image: mongo:5.0
       ports:
         - "27017:27017"
       environment:
         - MONGO_INITDB_ROOT_USERNAME=admin
         - MONGO_INITDB_ROOT_PASSWORD=password123
         - MONGO_INITDB_DATABASE=genius_db
       volumes:
         - mongodb_data:/data/db
       networks:
         - genius-network

     ollama:
       image: ollama/ollama:latest
       ports:
         - "11434:11434"
       volumes:
         - ollama_data:/root/.ollama
       environment:
         - OLLAMA_ORIGINS=*
       networks:
         - genius-network

     nginx:
       image: nginx:alpine
       ports:
         - "80:80"
         - "443:443"
       volumes:
         - ./nginx/nginx.conf:/etc/nginx/nginx.conf
         - ./nginx/ssl:/etc/nginx/ssl
       depends_on:
         - backend
         - frontend
       networks:
         - genius-network

   volumes:
     mongodb_data:
     ollama_data:

   networks:
     genius-network:
       driver: bridge

**Dockerfile (Backend)**:

.. code-block:: dockerfile

   FROM python:3.11-slim

   WORKDIR /app

   # Install system dependencies
   RUN apt-get update && apt-get install -y \
       gcc \
       build-essential \
       && rm -rf /var/lib/apt/lists/*

   # Copy requirements first for better caching
   COPY backend/requirements.txt ./requirements.txt
   RUN pip install --no-cache-dir -r requirements.txt

   # Copy application code
   COPY backend/ ./backend/
   COPY api/ ./api/

   # Set environment variables
   ENV PYTHONPATH=/app
   ENV FLASK_APP=backend/app.py

   # Expose port
   EXPOSE 5002

   # Health check
   HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
       CMD curl -f http://localhost:5002/health || exit 1

   # Run application
   CMD ["python", "backend/app.py"]

**Dockerfile (Frontend)**:

.. code-block:: dockerfile

   FROM node:18-alpine as builder

   WORKDIR /app

   # Copy package files
   COPY package*.json ./
   RUN npm ci --only=production

   # Copy source code
   COPY . .

   # Build application
   RUN npm run build

   # Production stage
   FROM nginx:alpine

   # Copy built files
   COPY --from=builder /app/build /usr/share/nginx/html

   # Copy nginx configuration
   COPY nginx.conf /etc/nginx/conf.d/default.conf

   EXPOSE 80

   CMD ["nginx", "-g", "daemon off;"]

Running with Docker Compose
----------------------------

.. code-block:: bash

   # Start all services
   docker-compose up -d

   # View logs
   docker-compose logs -f backend

   # Stop services
   docker-compose down

   # Rebuild and restart
   docker-compose up --build -d

Vercel Serverless Deployment
=============================

Vercel Configuration
--------------------

**vercel.json**:

.. code-block:: json

   {
     "version": 2,
     "name": "the-genius-project",
     "builds": [
       {
         "src": "frontend/package.json",
         "use": "@vercel/static-build",
         "config": {
           "distDir": "build"
         }
       },
       {
         "src": "api/**/*.py",
         "use": "@vercel/python",
         "config": {
           "runtime": "python3.9",
           "maxLambdaSize": "50mb"
         }
       }
     ],
     "routes": [
       {
         "src": "/api/(.*)",
         "dest": "/api/$1"
       },
       {
         "src": "/(.*)",
         "dest": "/frontend/$1"
       }
     ],
     "env": {
       "SECRET_KEY": "@secret-key",
       "JWT_SECRET_KEY": "@jwt-secret-key",
       "MONGODB_URI": "@mongodb-uri",
       "OPENAI_API_KEY": "@openai-api-key",
       "PINECONE_API_KEY": "@pinecone-api-key"
     },
     "build": {
       "env": {
         "REACT_APP_API_URL": "https://your-domain.vercel.app"
       }
     }
   }

**Deployment Script**:

.. code-block:: bash

   #!/bin/bash
   # deploy-vercel.sh

   echo "🚀 Deploying to Vercel..."

   # Install Vercel CLI if not present
   if ! command -v vercel &> /dev/null; then
       npm install -g vercel
   fi

   # Set environment variables
   vercel env add SECRET_KEY production < secret_key.txt
   vercel env add JWT_SECRET_KEY production < jwt_secret.txt
   vercel env add MONGODB_URI production < mongodb_uri.txt

   # Deploy
   vercel --prod

   echo "✅ Deployment complete!"

Frontend Build Configuration
-----------------------------

**package.json (Frontend)**:

.. code-block:: json

   {
     "name": "genius-project-frontend",
     "version": "1.0.0",
     "scripts": {
       "start": "react-scripts start",
       "build": "react-scripts build",
       "test": "react-scripts test",
       "eject": "react-scripts eject"
     },
     "dependencies": {
       "react": "^18.2.0",
       "react-dom": "^18.2.0",
       "axios": "^1.4.0"
     },
     "devDependencies": {
       "react-scripts": "5.0.1"
     },
     "engines": {
       "node": ">=16.0.0"
     }
   }

Production Cloud Deployment
============================

AWS Deployment
--------------

**Using AWS ECS with Fargate**:

.. code-block:: yaml

   # aws-ecs-task-definition.json
   {
     "family": "genius-project",
     "networkMode": "awsvpc",
     "requiresCompatibilities": ["FARGATE"],
     "cpu": "1024",
     "memory": "2048",
     "executionRoleArn": "arn:aws:iam::account:role/ecsTaskExecutionRole",
     "taskRoleArn": "arn:aws:iam::account:role/ecsTaskRole",
     "containerDefinitions": [
       {
         "name": "backend",
         "image": "your-account.dkr.ecr.region.amazonaws.com/genius-backend:latest",
         "portMappings": [
           {
             "containerPort": 5002,
             "protocol": "tcp"
           }
         ],
         "environment": [
           {
             "name": "FLASK_ENV",
             "value": "production"
           }
         ],
         "secrets": [
           {
             "name": "SECRET_KEY",
             "valueFrom": "arn:aws:secretsmanager:region:account:secret:genius/secret-key"
           }
         ],
         "logConfiguration": {
           "logDriver": "awslogs",
           "options": {
             "awslogs-group": "/ecs/genius-project",
             "awslogs-region": "us-west-2",
             "awslogs-stream-prefix": "ecs"
           }
         }
       }
     ]
   }

**Terraform Configuration**:

.. code-block:: hcl

   # terraform/main.tf
   provider "aws" {
     region = "us-west-2"
   }

   # VPC and networking
   resource "aws_vpc" "main" {
     cidr_block           = "10.0.0.0/16"
     enable_dns_hostnames = true
     enable_dns_support   = true

     tags = {
       Name = "genius-project-vpc"
     }
   }

   # ECS Cluster
   resource "aws_ecs_cluster" "main" {
     name = "genius-project"

     setting {
       name  = "containerInsights"
       value = "enabled"
     }
   }

   # Application Load Balancer
   resource "aws_lb" "main" {
     name               = "genius-project-alb"
     internal           = false
     load_balancer_type = "application"
     security_groups    = [aws_security_group.alb.id]
     subnets            = aws_subnet.public[*].id

     enable_deletion_protection = false
   }

   # RDS for production database
   resource "aws_db_instance" "main" {
     identifier = "genius-project-db"
     
     engine         = "postgres"
     engine_version = "13.7"
     instance_class = "db.t3.micro"
     
     allocated_storage     = 20
     max_allocated_storage = 100
     
     db_name  = "genius_db"
     username = "admin"
     password = var.db_password
     
     vpc_security_group_ids = [aws_security_group.rds.id]
     db_subnet_group_name   = aws_db_subnet_group.main.name
     
     backup_retention_period = 7
     backup_window          = "03:00-04:00"
     maintenance_window     = "sun:04:00-sun:05:00"
     
     skip_final_snapshot = true
   }

Google Cloud Platform Deployment
---------------------------------

**Cloud Run Deployment**:

.. code-block:: yaml

   # cloudbuild.yaml
   steps:
   # Build backend image
   - name: 'gcr.io/cloud-builders/docker'
     args: ['build', '-t', 'gcr.io/$PROJECT_ID/genius-backend', './backend']
   
   # Push backend image
   - name: 'gcr.io/cloud-builders/docker'
     args: ['push', 'gcr.io/$PROJECT_ID/genius-backend']
   
   # Deploy to Cloud Run
   - name: 'gcr.io/cloud-builders/gcloud'
     args:
     - 'run'
     - 'deploy'
     - 'genius-backend'
     - '--image=gcr.io/$PROJECT_ID/genius-backend'
     - '--region=us-central1'
     - '--platform=managed'
     - '--allow-unauthenticated'

**Kubernetes Deployment**:

.. code-block:: yaml

   # k8s/deployment.yaml
   apiVersion: apps/v1
   kind: Deployment
   metadata:
     name: genius-backend
     labels:
       app: genius-backend
   spec:
     replicas: 3
     selector:
       matchLabels:
         app: genius-backend
     template:
       metadata:
         labels:
           app: genius-backend
       spec:
         containers:
         - name: backend
           image: gcr.io/project-id/genius-backend:latest
           ports:
           - containerPort: 5002
           env:
           - name: FLASK_ENV
             value: "production"
           - name: SECRET_KEY
             valueFrom:
               secretKeyRef:
                 name: genius-secrets
                 key: secret-key
           resources:
             requests:
               memory: "512Mi"
               cpu: "250m"
             limits:
               memory: "1Gi"
               cpu: "500m"
   ---
   apiVersion: v1
   kind: Service
   metadata:
     name: genius-backend-service
   spec:
     selector:
       app: genius-backend
     ports:
     - protocol: TCP
       port: 80
       targetPort: 5002
     type: LoadBalancer

Monitoring and Logging
======================

Application Monitoring
----------------------

**Prometheus Configuration**:

.. code-block:: yaml

   # monitoring/prometheus.yml
   global:
     scrape_interval: 15s

   scrape_configs:
   - job_name: 'genius-backend'
     static_configs:
     - targets: ['backend:5002']
     metrics_path: /metrics
     scrape_interval: 5s

   - job_name: 'genius-rag'
     static_configs:
     - targets: ['rag-app:8000']
     metrics_path: /metrics

**Grafana Dashboard**:

.. code-block:: json

   {
     "dashboard": {
       "title": "Genius Project Metrics",
       "panels": [
         {
           "title": "Request Rate",
           "type": "graph",
           "targets": [
             {
               "expr": "rate(http_requests_total[5m])",
               "legendFormat": "{{method}} {{status}}"
             }
           ]
         },
         {
           "title": "Response Time",
           "type": "graph",
           "targets": [
             {
               "expr": "http_request_duration_seconds",
               "legendFormat": "{{endpoint}}"
             }
           ]
         }
       ]
     }
   }

Centralized Logging
-------------------

**ELK Stack Configuration**:

.. code-block:: yaml

   # logging/docker-compose.yml
   version: '3.8'
   services:
     elasticsearch:
       image: docker.elastic.co/elasticsearch/elasticsearch:7.15.0
       environment:
         - discovery.type=single-node
       ports:
         - "9200:9200"

     kibana:
       image: docker.elastic.co/kibana/kibana:7.15.0
       environment:
         - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
       ports:
         - "5601:5601"
       depends_on:
         - elasticsearch

     logstash:
       image: docker.elastic.co/logstash/logstash:7.15.0
       volumes:
         - ./logstash.conf:/usr/share/logstash/pipeline/logstash.conf
       depends_on:
         - elasticsearch

Security Considerations
=======================

SSL/TLS Configuration
---------------------

**Nginx SSL Configuration**:

.. code-block:: nginx

   # nginx/nginx.conf
   server {
       listen 80;
       server_name your-domain.com;
       return 301 https://$server_name$request_uri;
   }

   server {
       listen 443 ssl http2;
       server_name your-domain.com;

       ssl_certificate /etc/nginx/ssl/cert.pem;
       ssl_certificate_key /etc/nginx/ssl/key.pem;
       ssl_protocols TLSv1.2 TLSv1.3;
       ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;

       location /api/ {
           proxy_pass http://backend:5002;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }

       location / {
           proxy_pass http://frontend:3000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }

Secret Management
-----------------

**Using AWS Secrets Manager**:

.. code-block:: python

   # backend/config/secrets.py
   import boto3
   import json
   from botocore.exceptions import ClientError

   def get_secret(secret_name, region_name="us-west-2"):
       """Retrieve secret from AWS Secrets Manager."""
       session = boto3.session.Session()
       client = session.client(
           service_name='secretsmanager',
           region_name=region_name
       )
       
       try:
           response = client.get_secret_value(SecretId=secret_name)
           return json.loads(response['SecretString'])
       except ClientError as e:
           raise e

Database Security
-----------------

**MongoDB Security Configuration**:

.. code-block:: javascript

   // MongoDB security setup
   use admin
   db.createUser({
     user: "admin",
     pwd: "secure_password",
     roles: ["userAdminAnyDatabase", "dbAdminAnyDatabase"]
   })

   use genius_db
   db.createUser({
     user: "app_user",
     pwd: "app_password",
     roles: ["readWrite"]
   })

Deployment Automation
=====================

CI/CD Pipeline
--------------

**GitHub Actions Workflow**:

.. code-block:: yaml

   # .github/workflows/deploy.yml
   name: Deploy

   on:
     push:
       branches: [main]

   jobs:
     test:
       runs-on: ubuntu-latest
       steps:
       - uses: actions/checkout@v3
       - name: Run tests
         run: |
           pip install -r backend/requirements.txt
           pytest tests/

     build-and-deploy:
       needs: test
       runs-on: ubuntu-latest
       steps:
       - uses: actions/checkout@v3
       
       - name: Configure AWS credentials
         uses: aws-actions/configure-aws-credentials@v2
         with:
           aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
           aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
           aws-region: us-west-2

       - name: Build and push Docker image
         run: |
           aws ecr get-login-password | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.us-west-2.amazonaws.com
           docker build -t genius-backend .
           docker tag genius-backend:latest $AWS_ACCOUNT_ID.dkr.ecr.us-west-2.amazonaws.com/genius-backend:latest
           docker push $AWS_ACCOUNT_ID.dkr.ecr.us-west-2.amazonaws.com/genius-backend:latest

       - name: Deploy to ECS
         run: |
           aws ecs update-service --cluster genius-project --service genius-backend --force-new-deployment

**Automated Database Migrations**:

.. code-block:: bash

   #!/bin/bash
   # scripts/deploy.sh

   set -e

   echo "🚀 Starting deployment..."

   # Run database migrations
   echo "📊 Running database migrations..."
   python backend/migrate.py

   # Build and deploy backend
   echo "🏗️ Building backend..."
   docker build -t genius-backend .
   docker tag genius-backend:latest $REGISTRY_URL/genius-backend:$BUILD_NUMBER

   # Push to registry
   echo "📤 Pushing to registry..."
   docker push $REGISTRY_URL/genius-backend:$BUILD_NUMBER

   # Update deployment
   echo "🔄 Updating deployment..."
   kubectl set image deployment/genius-backend backend=$REGISTRY_URL/genius-backend:$BUILD_NUMBER

   # Wait for rollout
   echo "⏳ Waiting for rollout..."
   kubectl rollout status deployment/genius-backend

   echo "✅ Deployment complete!"

Health Checks and Rollbacks
---------------------------

**Health Check Endpoint**:

.. code-block:: python

   # backend/routes/health.py
   from flask import Blueprint, jsonify
   import psutil
   import time

   health_bp = Blueprint('health', __name__)

   @health_bp.route('/health')
   def health_check():
       """Comprehensive health check."""
       checks = {
           'status': 'healthy',
           'timestamp': time.time(),
           'checks': {
               'database': check_database(),
               'ai_service': check_ai_service(),
               'memory': check_memory(),
               'disk': check_disk_space()
           }
       }
       
       # Determine overall health
       all_healthy = all(
           check['status'] == 'healthy' 
           for check in checks['checks'].values()
       )
       
       if not all_healthy:
           checks['status'] = 'unhealthy'
           return jsonify(checks), 503
           
       return jsonify(checks)

   def check_database():
       """Check database connectivity."""
       try:
           from backend.models import db
           db.session.execute('SELECT 1')
           return {'status': 'healthy', 'latency_ms': 10}
       except Exception as e:
           return {'status': 'unhealthy', 'error': str(e)}

**Automated Rollback**:

.. code-block:: bash

   #!/bin/bash
   # scripts/rollback.sh

   DEPLOYMENT_NAME="genius-backend"
   PREVIOUS_VERSION=$(kubectl rollout history deployment/$DEPLOYMENT_NAME --revision=1 | grep -o '[0-9]\+$')

   echo "🔄 Rolling back to version $PREVIOUS_VERSION..."

   kubectl rollout undo deployment/$DEPLOYMENT_NAME --to-revision=$PREVIOUS_VERSION

   echo "⏳ Waiting for rollback to complete..."
   kubectl rollout status deployment/$DEPLOYMENT_NAME

   echo "✅ Rollback complete!"

Performance Optimization
========================

Caching Strategies
------------------

**Redis Configuration**:

.. code-block:: python

   # backend/config/cache.py
   import redis
   from flask import current_app

   class Cache:
       def __init__(self):
           self.redis_client = redis.Redis(
               host=current_app.config['REDIS_HOST'],
               port=current_app.config['REDIS_PORT'],
               decode_responses=True
           )
       
       def get(self, key):
           return self.redis_client.get(key)
       
       def set(self, key, value, timeout=3600):
           return self.redis_client.setex(key, timeout, value)
       
       def delete(self, key):
           return self.redis_client.delete(key)

CDN Configuration
-----------------

**CloudFront Distribution**:

.. code-block:: json

   {
     "DistributionConfig": {
       "CallerReference": "genius-project-cdn",
       "Origins": [
         {
           "Id": "frontend-origin",
           "DomainName": "your-domain.com",
           "CustomOriginConfig": {
             "HTTPPort": 80,
             "HTTPSPort": 443,
             "OriginProtocolPolicy": "https-only"
           }
         }
       ],
       "DefaultCacheBehavior": {
         "TargetOriginId": "frontend-origin",
         "ViewerProtocolPolicy": "redirect-to-https",
         "CachePolicyId": "managed-caching-optimized"
       },
       "Comment": "Genius Project CDN",
       "Enabled": true
     }
   }

Troubleshooting Deployment Issues
==================================

Common Problems
---------------

**Port Conflicts**:
- Check for processes using required ports
- Use different ports for services
- Update firewall rules

**Environment Variable Issues**:
- Verify all required variables are set
- Check variable naming and format
- Validate secret values

**Database Connection Problems**:
- Verify connection strings
- Check network connectivity
- Validate credentials

**Memory/Resource Issues**:
- Monitor resource usage
- Adjust container limits
- Scale horizontally if needed

Debugging Tools
---------------

.. code-block:: bash

   # Check service status
   docker-compose ps
   kubectl get pods

   # View logs
   docker-compose logs -f backend
   kubectl logs -f deployment/genius-backend

   # Check resource usage
   docker stats
   kubectl top pods

   # Test connectivity
   curl -f http://localhost:5002/health
   kubectl port-forward svc/genius-backend 8080:80

Next Steps
==========

1. **Choose deployment strategy** based on your requirements
2. **Set up monitoring and logging** for production visibility
3. **Implement CI/CD pipeline** for automated deployments
4. **Configure security measures** including SSL and secrets management
5. **Plan scaling strategy** for handling increased load

This deployment guide provides comprehensive coverage of different deployment scenarios. Choose the approach that best fits your infrastructure requirements and operational capabilities.
