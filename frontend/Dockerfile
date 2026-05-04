# syntax=docker/dockerfile:1.3
#--------------------------------------------
# Dev Stage - Assembles and Builds Frontend
#--------------------------------------------
FROM --platform=$BUILDPLATFORM node:20-alpine as dev

ARG APP_SHELL_VERSION=next

RUN mkdir -p /app
WORKDIR /app

COPY spa-assemble-config.json .
COPY spa-build-config.json .

ARG CACHE_BUST
RUN npx --legacy-peer-deps openmrs@${APP_SHELL_VERSION:-next} assemble --manifest --mode config --config spa-assemble-config.json --target ./spa
RUN npx --legacy-peer-deps openmrs@${APP_SHELL_VERSION:-next} build --build-config spa-build-config.json --target ./spa
RUN if [ ! -f ./spa/index.html ]; then echo 'Build failed. Please check the logs above for details. This may have happened because of an update to a library that OpenMRS depends on.'; exit 1; fi

# Inject the Ambient Scribe module into importmap.json and routes.registry.json
# importmap tells the browser where to find the JS; routes.registry triggers initialization
RUN node -e "\
  const fs = require('fs');\
  \
  const imp = JSON.parse(fs.readFileSync('./spa/importmap.json', 'utf8'));\
  imp.imports['@path-drc/esm-ambient-scribe-app'] = '/emr-ai/static/main.js';\
  fs.writeFileSync('./spa/importmap.json', JSON.stringify(imp, null, 2));\
  \
  const reg = JSON.parse(fs.readFileSync('./spa/routes.registry.json', 'utf8'));\
  reg['@path-drc/esm-ambient-scribe-app'] = {\
    '\$schema': 'https://json.openmrs.org/routes.schema.json',\
    'version': '1.0.0',\
    'extensions': [{\
      'name': 'ambient-scribe-button',\
      'slot': 'patient-actions-slot',\
      'component': 'ambientScribeButton',\
      'online': true,\
      'offline': false\
    }]\
  };\
  fs.writeFileSync('./spa/routes.registry.json', JSON.stringify(reg, null, 2));\
  \
  console.log('Injected @path-drc/esm-ambient-scribe-app into importmap and routes.registry.');\
"

#--------------------------------------------
# Runtime Stage - Published Image
#--------------------------------------------
FROM nginx:1.25-alpine

RUN apk update && \
    apk upgrade && \
    # add more utils for sponge and envsubst
    apk add --no-cache moreutils

# clear any default files installed by nginx
RUN rm -rf /usr/share/nginx/html/*

COPY startup.sh /usr/local/bin/startup.sh
RUN chmod +x /usr/local/bin/startup.sh

COPY nginx.conf /etc/nginx/nginx.conf

COPY --from=dev /app/spa /usr/share/nginx/html
COPY config-core_demo.json /usr/share/nginx/html
COPY ./resources/logo.png /usr/share/nginx/html
COPY ./resources/nav-logo.png /usr/share/nginx/html
COPY ./resources/favicon.ico /usr/share/nginx/html

CMD ["/usr/local/bin/startup.sh"]
