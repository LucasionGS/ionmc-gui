# Use the official Node.js 16 image.
FROM node:16

ENV JAVA_PATH=/usr/src/java/jdk-21.0.2/bin/java
ENV PORT=3080

# Set the working directory
WORKDIR /usr/src/app

# Copy the local code to the container's workspace.
COPY ./client ./client
COPY ./server ./server
COPY ./shared ./shared
COPY ./build.sh ./build.sh

# Install production dependencies.
RUN bash ./build.sh
# Expose the port the app runs on
EXPOSE 3080

# Install java
WORKDIR /usr/src/java
RUN wget https://download.java.net/java/GA/jdk21.0.2/f2283984656d49d69e91c558476027ac/13/GPL/openjdk-21.0.2_linux-x64_bin.tar.gz -O openjdk-21.tar.gz
RUN tar -xvzf openjdk-21.tar.gz
RUN rm openjdk-21.tar.gz


# Start the application
WORKDIR /usr/src/app/dist
RUN rm /usr/src/app/dist/.env

CMD [ "node", "." ]