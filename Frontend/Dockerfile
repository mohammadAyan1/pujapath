# Build Stage

FROM node:20 AS build

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

ARG VITE_BACKEND_URL
ARG VITE_BACKEND_FOR_URL
ARG VITE_RAZORPAY_KEY_ID
ARG VITE_VAPID_PUBLIC_KEY

ENV VITE_BACKEND_URL=$VITE_BACKEND_URL
ENV VITE_BACKEND_FOR_URL=$VITE_BACKEND_FOR_URL
ENV VITE_RAZORPAY_KEY_ID=$VITE_RAZORPAY_KEY_ID
ENV VITE_VAPID_PUBLIC_KEY=$VITE_VAPID_PUBLIC_KEY

RUN npm run build

# Production Stage

FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
