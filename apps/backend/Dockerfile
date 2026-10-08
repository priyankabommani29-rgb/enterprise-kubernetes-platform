FROM node:20-alpine
WORKDIR /app
COPY package.json server.js ./
ENV NODE_ENV=production
# Remove npm/yarn: not needed at runtime, and they bundle vulnerable dependencies
RUN rm -rf /usr/local/lib/node_modules /usr/local/bin/npm /usr/local/bin/npx /opt/yarn-*
USER node
EXPOSE 5678
CMD ["node", "server.js"]
