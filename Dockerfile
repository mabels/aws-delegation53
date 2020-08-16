FROM node:lts-alpine3.11 as build

WORKDIR /app

COPY . /app

RUN rm -rf node_modules
RUN npm install 
RUN npm run build

FROM node:lts-alpine3.11

WORKDIR /app

COPY --from=build /app/dist/index.js /app/dist/index.js
COPY --from=build /app/package.json /app/package.json

CMD npm run start

