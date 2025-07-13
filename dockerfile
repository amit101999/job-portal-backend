FROM node:18

WORKDIR /job-portal-backend/app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 6500

CMD ["npm" ,"run", "start-server"]
