FROM node:lts-alpine
#ENV NODE_ENV=production
ENV PORT=8080

# gcloud requirements
RUN apk --no-cache add curl
RUN apk add --no-cache python3
# Downloading gcloud package
RUN curl https://dl.google.com/dl/cloudsdk/channels/rapid/downloads/google-cloud-cli-412.0.0-linux-x86_64.tar.gz > /tmp/google-cloud-cli.tar.gz
# Installing the gcloud cli
RUN mkdir -p /usr/local/gcloud \
  && tar -xf /tmp/google-cloud-cli.tar.gz \
  && ./google-cloud-sdk/install.sh --quiet


WORKDIR /usr/src/app
COPY ["package.json", "package-lock.json*", "npm-shrinkwrap.json*", "./"]
#RUN npm install --production --silent && mv node_modules ../
RUN npm install --silent && mv node_modules ../
COPY . .
RUN npm run build
EXPOSE 8080
RUN chown -R node /usr/src/app
# USER node
CMD ["node", "build"]
