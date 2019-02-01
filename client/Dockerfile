# Stage 0, "build-stage", based on Node.js, to build and compile the frontend
FROM node:11 as build-stage

# Update npm
RUN npm i npm@6.7.0
# Install dependencies
WORKDIR /app
COPY package.json ./
RUN npm install
# copy in our source code last, as it changes the most
COPY . .

RUN REACT_APP_STAGE=prod npm run build
# CMD ["npm", "run", "start"]

# Stage 1, based on Nginx, to have only the compiled app, ready for production with Nginx
FROM nginx:1.15.8-alpine
COPY --from=build-stage /app/build/ /usr/share/nginx/html

# Copy the default nginx.conf. This configuration file directs everything to index.html,
# so that if you use a router like React router it can take care of it's routes
COPY ./nginx.conf /etc/nginx/conf.d/default.conf

# default to port 3000 for reactapp
ARG PORT=3000
ENV PORT $PORT
EXPOSE $PORT

#install bash & curl
RUN apk add --no-cache bash
RUN apk --no-cache add curl
