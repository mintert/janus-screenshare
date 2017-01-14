# Janus Screenshare Demo App

### Getting started
Generate a SSL Certificate:
```sh
openssl req -x509 -newkey rsa:4086 \
  -subj "/C=XX/ST=XXXX/L=XXXX/O=XXXX/CN=your-domain.local" \
  -keyout "/path/to/cert.key" \
  -out "/path/to/cert.crt" \
  -days 365 -nodes -sha256
```

Getting Janus up and running:
```sh
docker build -t janus/janus:latest ./janus/
docker run -ti \
  -v /path/to/cert.crt:/usr/share/certificate.pem \
  -v /path/to/cert.key:/usr/share/certificate.key \
  -p 8089:8089 \
  -p 7889:7889 \
  -p 10000-10200:10000-10200 \
  janus/janus:latest
```

Getting the Rails-Frontend up and running:
```
cd frontend
bundle install
rake db:setup
thin start -p 3000 --ssl --ssl-key-file=/path/to/cert.key --ssl-cert-file=/path/to/cert.crt
```

Access `https://your-domain.local:3000`
