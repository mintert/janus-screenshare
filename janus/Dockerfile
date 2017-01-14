# Use phusion/baseimage as base image. To make your builds reproducible, make
# sure you lock down to a specific version, not to `latest`!
# See https://github.com/phusion/baseimage-docker/blob/master/Changelog.md for
# a list of version numbers.
FROM phusion/baseimage:0.9.19

# Use baseimage-docker's init system.
CMD ["/sbin/my_init"]

RUN apt-get update && apt-get install -y \
  libmicrohttpd-dev \
  libjansson-dev \
  libnice-dev \
  libssl-dev \
  libsrtp-dev \
  libglib2.0-dev \
  libopus-dev \
  libogg-dev \
  libcurl4-openssl-dev \
  pkg-config \
  gengetopt \
  libtool \
  wget \
  git \
  cmake \
  golang \
  automake

# Install janus with boringssl
ADD install.sh /tmp/
RUN /tmp/install.sh

# Ingest configs
ADD configs/janus.cfg /opt/janus/etc/janus/
ADD configs/janus.transport.http.cfg /opt/janus/etc/janus/
ADD configs/janus.plugin.videoroom.cfg /opt/janus/etc/janus/

# Clean up APT when done.
RUN apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

EXPOSE 10000-10200/udp
EXPOSE 8089
EXPOSE 7889

ENTRYPOINT ["/opt/janus/bin/janus"]
