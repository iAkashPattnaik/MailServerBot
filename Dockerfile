FROM ubuntu

# set timezone
ENV TZ=Asia/Kolkata
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# Install Dependencies
RUN apt update -y
RUN apt upgrade -y
RUN apt install curl -y
RUN curl -sL https://deb.nodesource.com/setup_14.x | bash -
RUN apt -y install nodejs
COPY . /root/app/
WORKDIR /root/app/

# Run
RUN npm install
RUN npm run build
EXPOSE 8080
CMD [ "node", "build" ]
