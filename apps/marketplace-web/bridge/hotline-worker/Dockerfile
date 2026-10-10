FROM node:22-alpine
WORKDIR /worker
COPY worker.mjs ./worker.mjs
USER node
CMD ["node", "worker.mjs"]
