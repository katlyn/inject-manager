FROM node:15-alpine
WORKDIR /usr/build
COPY tsconfig.json package.json package-lock.json prisma /usr/build/
RUN npm ci
COPY ./src /usr/build/src/
RUN npm run build

FROM node:15-alpine
WORKDIR /usr/injects
COPY package.json package-lock.json prisma /usr/injects/
RUN npm ci --production
COPY --from=0 /usr/build/dist /usr/injects/dist

CMD [ "node", "/usr/injects/dist/index.js" ]
