FROM node:22-alpine
WORKDIR /app
COPY package.json ./
COPY src ./src
COPY demo ./demo
COPY evals ./evals
COPY docs ./docs
COPY index.html ./
ENV HOST=0.0.0.0
ENV PORT=8787
EXPOSE 8787
CMD ["node", "demo/server.mjs"]
