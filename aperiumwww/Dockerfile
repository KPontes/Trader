FROM nginx:1.15.8

WORKDIR /usr/share/nginx/html
# change working directory to root of nginx webhost

COPY . .
# I don't have to specify EXPOSE or CMD because they're in my FROM

WORKDIR /etc/nginx/conf.d
COPY nginx-nocache.conf 000nginx.conf
# Update nginx configuration
