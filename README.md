# 🚚 Food Ordering Web App (MERN Stack)

ORIGINAL
👨‍💻 Contributors

[Dulanjali Senarathna](https://github.com/DulanjaliSenarathna)
 — Project Owner

[prem2621](https://github.com/prem2621)
 — Bug fixes, secure env handling, image display improvement

---------------------------------------------------------------------------

### The above mentioned are the original owner and contributors of source code and thanks to them I was able to create a fully dockerized version of the application.


#### Here are the steps taken for the dockerization of the application:

#### Here, before deep diving into the project, first understand the project workflow. How the project works. Before running the app in the docker, first run in your local machine. If we were to learn how to run application in docker, we must know how to run it locally.



#### WHen i first cloned the repo. The urls was hardcoded. Thus, we must remove the hardcoded urls and create a .env file where it is easy for us to change the url from one place.


#### As both the Admin and Frontend use Vite, we can use the same dockerfile.

```bash
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
```
#### This is a multi-stage Build.
#### Here, Nginx is used as a reverse proxy so when frontend and admin is changed to docker image, the image use port 80 as a source of connection.

#### This Dockerfile uses a multi-stage build: the first stage uses Node.js to install dependencies and run npm run build, which creates the production files in the dist folder. The second stage uses Nginx to serve those static files from /usr/share/nginx/html. Nginx listens on port 80 inside the container; it does not convert port 5173 to 80. Port 5173 is typically Vite's development-server port, while Docker can map your computer's port 5173 to the container's port 80 using docker run -p 5173:80, meaning localhost:5173 → Docker container:80 → Nginx → your built website.


### As for the docker file of backend, it is a typical nodejs dockerfile found anywhere on internet.

## Docker Compose

```bash
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
```
Here, the container name is mern-mongodb, and the image is downloaded from offical dockerhub registry.
We have used 'admin' as USERNAME and 'securepassword' as PASSWORD.
As we know, database is crucial component of any web-application so we so regular healthcheck of database every 10 seconds. If, for some reason database, doesnot start then our backend won't work properly.

The backend service, frontend and admin is also pretty straight forward.

Network Architecture used:
```bash
					------------------------------------|	
					|					|---------------|-----------------	
					|					|				|				|
					|					|				|				|
					|			BACKEND-NETWORK			|	Frontend/	|
					|					|				|	admin		|
					|	Database		|	Backend		|				|	
					|					|				|				|
					|					|		FRONTEND-NETWORK		|
					|					|				|				|
					|					|---------------|----------------	
					|-----------------------------------|

```
Here, backend is a common point between Database, Backend and Frontend. Backend-Network is connected between Database 
and Backend. Frontend-Network is connected between Backend and Frontend network. The reason we dont use a single network for connecting is because, we donot want the end-users(Customers) to have direct access to the database. When we create a seperate network, end-users can only have access to the backend.

Here is the workflow:
- The customer orders some item using frontend. The request is then passed on to backend. then the backend will fetch the data from the database and then backend will server the response to the frontend.

Bridge network type is used. And mongo-data volume is used for persistenting the data even if we terminate docker-compose.