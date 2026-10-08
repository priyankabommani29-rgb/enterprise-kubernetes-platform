FROM node:20-alpine
WORKDIR /app
COPY package.json server.js ./
ENV NODE_ENV=production
USER node
EXPOSE 5678
CMD ["node", "server.js"]
