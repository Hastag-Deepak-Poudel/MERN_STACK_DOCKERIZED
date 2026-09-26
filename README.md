🚚 Food Ordering Web App — MERN Stack
👨‍💻 Original Contributors

Dulanjali Senarathna
 — Project Owner

prem2621
 — Bug fixes, secure environment-variable handling, and image-display improvements

The original project was created by the contributors mentioned above. Their work provided the foundation for creating this fully Dockerized version of the application.

🐳 Dockerization Overview

Before diving into the Docker configuration, it is important to first understand how the application works and how to run it locally.

The goal is simple:

Before learning how to run an application inside Docker, we should first understand how the application runs without Docker.

Once the local development workflow is understood, containerizing each component becomes much easier.

🔄 Application Workflow

The application consists of three primary components:

Frontend — Customer-facing food ordering application

Admin Panel — Used to manage the application

Backend — Node.js/Express API that communicates with the database

MongoDB — Stores application data

The basic request flow is:

Customer
   │
   ▼
Frontend
   │
   ▼
Backend API
   │
   ▼
MongoDB
   │
   ▼
Backend API
   │
   ▼
Frontend
   │
   ▼
Customer


For example, when a customer places an order:

The customer interacts with the frontend.

The frontend sends a request to the backend API.

The backend processes the request.

The backend communicates with MongoDB to retrieve or store the required data.

The backend sends a response back to the frontend.

The frontend displays the result to the customer.

🔐 Removing Hardcoded URLs

When the repository was initially cloned, some URLs were hardcoded throughout the application.

Hardcoding URLs makes configuration more difficult because changing the backend URL, for example, may require modifying the source code in multiple places.

To solve this, the hardcoded URLs were removed and replaced with environment variables.

This allows configuration to be managed from .env files instead of modifying the application source code.

For example:

VITE_API_URL=http://localhost:5000


This approach makes it much easier to switch between environments such as:

Local development

Docker

Staging

Production

🖥️ Frontend & Admin Dockerfile

Both the Frontend and Admin Panel use Vite, so they can use the same Dockerfile structure.

FROM node:latest AS build

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

FROM nginx:latest

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

🏗️ Multi-Stage Build

This Dockerfile uses a multi-stage build.

Stage 1 — Build
FROM node:latest AS build


The first stage uses a Node.js image to:

Set the working directory.

Copy the package files.

Install dependencies.

Copy the application source code.

Run:

npm run build


Vite then generates the production-ready files inside the dist directory.

Stage 2 — Serve

The second stage uses Nginx:

FROM nginx:latest


The generated files from the first stage are copied into Nginx's default web directory:

COPY --from=build /app/dist /usr/share/nginx/html


Nginx then serves the static frontend files.

This approach keeps the final image smaller because the final image does not need the Node.js development environment or the source code used during the build.

🌐 Nginx and Port Mapping

One important clarification is that Nginx does not convert port 5173 into port 80.

Port 5173 is commonly used by Vite's development server.

In the Dockerized production setup, Nginx listens on port 80 inside the container.

Docker can then map a host port to the container's port.

For example:

docker run -p 5173:80 frontend


This means:

Your Computer
localhost:5173
      │
      ▼
Docker Container
      │
   Port 80
      │
      ▼
    Nginx
      │
      ▼
Built Frontend


So:

localhost:5173 → container:80 → Nginx → frontend


The host port (5173) and container port (80) are independent. Docker is performing the port mapping.

⚙️ Backend Dockerfile

The backend uses a standard Node.js Dockerfile.

A typical structure is:

FROM node:latest

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 5000

CMD ["npm", "start"]


The backend container:

Uses Node.js as its base image.

Creates /app as the working directory.

Installs the required dependencies.

Copies the backend source code.

Exposes the backend port.

Starts the application.

🐳 Docker Compose

Docker Compose is used to run and manage all the services required by the application.

A simplified MongoDB service looks like this:

mongodb:
  image: mongo:latest
  container_name: mern-mongodb

  ports:
    - "27017:27017"

  networks:
    - backend-network

  environment:
    MONGO_INITDB_ROOT_USERNAME: admin
    MONGO_INITDB_ROOT_PASSWORD: securepassword

  volumes:
    - mongo-data:/data/db

  healthcheck:
    test: ["CMD", "mongosh", "--eval", "db.adminCommand('ping')"]
    interval: 10s
    timeout: 5s
    retries: 5
    start_period: 10s

🍃 MongoDB Configuration
Image
image: mongo:latest


The MongoDB image is pulled from the official Docker Hub registry.

Container Name
container_name: mern-mongodb


This gives the MongoDB container a predictable name:

mern-mongodb

Authentication

The MongoDB root user is configured using environment variables:

MONGO_INITDB_ROOT_USERNAME: admin
MONGO_INITDB_ROOT_PASSWORD: securepassword


Note: In a production environment, credentials should not be hardcoded directly in docker-compose.yml. They should be stored securely using environment variables, Docker secrets, or another secret-management solution.

Port Mapping
ports:
  - "27017:27017"


This maps MongoDB's default port inside the container to port 27017 on the host.

Volume
volumes:
  - mongo-data:/data/db


The named volume mongo-data provides persistent storage for MongoDB.

This means that MongoDB data can survive the removal or recreation of the MongoDB container.

Health Check

MongoDB is a critical component of the application, so a health check is configured:

healthcheck:
  test: ["CMD", "mongosh", "--eval", "db.adminCommand('ping')"]
  interval: 10s
  timeout: 5s
  retries: 5
  start_period: 10s


Docker periodically checks whether MongoDB is responding correctly.

The health check:

Runs every 10 seconds

Allows 5 seconds for a response

Retries up to 5 times

Waits 10 seconds before starting health checks

This allows other services to determine whether MongoDB is ready before attempting to communicate with it.

🌐 Docker Network Architecture

The application uses two separate Docker bridge networks:

backend-network

frontend-network

The backend acts as the communication point between the frontend and database.

                         ┌───────────────────────┐
                         │       Frontend        │
                         │       / Admin         │
                         └───────────┬───────────┘
                                     │
                              frontend-network
                                     │
                                     ▼
                         ┌───────────────────────┐
                         │        Backend        │
                         └───────────┬───────────┘
                                     │
                               backend-network
                                     │
                                     ▼
                         ┌───────────────────────┐
                         │       MongoDB         │
                         └───────────────────────┘

🔒 Why Use Separate Networks?

The purpose of using separate networks is to control which services can communicate with each other.

The database does not need to be directly accessible from the frontend.

Instead:

Frontend
   │
   │ frontend-network
   ▼
Backend
   │
   │ backend-network
   ▼
MongoDB


The frontend communicates with the backend, while the backend communicates with MongoDB.

This creates a logical separation between the public-facing application components and the database layer.

The frontend does not need direct network access to MongoDB.

🔄 Complete Request Workflow

The complete workflow can be summarized as follows:

┌──────────────┐
│   Customer   │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   Frontend   │
└──────┬───────┘
       │
       │ HTTP Request
       ▼
┌──────────────┐
│    Backend   │
└──────┬───────┘
       │
       │ Database Query
       ▼
┌──────────────┐
│   MongoDB    │
└──────┬───────┘
       │
       │ Database Response
       ▼
┌──────────────┐
│    Backend   │
└──────┬───────┘
       │
       │ HTTP Response
       ▼
┌──────────────┐
│   Frontend   │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   Customer   │
└──────────────┘


For example, when a customer requests information about a food item:

The customer makes a request through the frontend.

The frontend sends the request to the backend.

The backend processes the request.

The backend queries MongoDB.

MongoDB returns the requested data.

The backend sends the data back to the frontend.

The frontend displays the information to the customer.

🌉 Docker Bridge Network

The application uses Docker's bridge network functionality.

Bridge networks allow containers to communicate with one another while providing network isolation from containers that are not connected to the same network.

In this architecture:

frontend-network

Frontend ────────── Backend


backend-network

Backend ────────── MongoDB


The backend is therefore connected to both networks and acts as the communication layer between the frontend and database.

💾 Data Persistence

A Docker volume is used to persist MongoDB data:

volumes:
  - mongo-data:/data/db


Without a persistent volume, deleting the MongoDB container could also result in the loss of the database data stored inside that container's writable layer.

With the named volume:

MongoDB Container
       │
       ▼
 /data/db
       │
       ▼
  mongo-data
       │
       ▼
Persistent Storage


The MongoDB container can therefore be recreated without losing the data stored in the volume.

📌 Architecture Summary

The final Dockerized architecture can be represented as:

                         ┌─────────────────┐
                         │    Customer     │
                         └────────┬────────┘
                                  │
                                  ▼
                    ┌─────────────────────────┐
                    │  Frontend / Admin       │
                    │      (Nginx)            │
                    └────────────┬────────────┘
                                 │
                         frontend-network
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │        Backend          │
                    │     Node.js/Express     │
                    └────────────┬────────────┘
                                 │
                          backend-network
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │        MongoDB           │
                    │     Persistent Volume    │
                    └─────────────────────────┘

🚀 Key Dockerization Concepts Used

This project demonstrates several important Docker concepts:

Multi-stage Docker builds

Node.js containers

Nginx for serving production frontend files

Docker Compose

Docker bridge networks

Network isolation

MongoDB containers

Docker health checks

Named volumes for persistent data

Environment variables

Container-to-container communication

Host-to-container port mapping

The overall objective of the Dockerization is to make the application easier to build, configure, run, and deploy consistently across different environments, while keeping the database isolated from direct frontend access.