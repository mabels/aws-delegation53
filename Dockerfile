FROM node:lts-alpine3.11 as build

WORKDIR /app

COPY . /app

RUN rm -rf node_modules
RUN npm install 
RUN npm run build

FROM node:lts-alpine3.11

WORKDIR /app

COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/package.json /app/package.json
COPY --from=build /app/update-ns.js /app/update-ns.js
COPY --from=build /app/update-ns.js.map /app/update-ns.js.map

CMD npm run start

