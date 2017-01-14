# Install boringssl
git clone https://boringssl.googlesource.com/boringssl
cd boringssl
sed -i s/" -Werror"//g CMakeLists.txt
mkdir -p build
cd build
cmake -DCMAKE_CXX_FLAGS="-lrt" ..
make
cd ..
mkdir -p /opt/boringssl/lib
cp -R include /opt/boringssl/
cp build/ssl/libssl.a /opt/boringssl/lib/
cp build/crypto/libcrypto.a /opt/boringssl/lib/

# Install Janus
wget https://github.com/meetecho/janus-gateway/archive/v0.2.1.tar.gz
tar xf v0.2.1.tar.gz
cd janus-gateway-0.2.1
sh autogen.sh
./configure --prefix=/opt/janus \
            --enable-boringssl \
            --disable-plugin-audiobridge \
            --disable-plugin-echotest \
            --disable-plugin-recordplay \
            --disable-plugin-sip \
            --disable-plugin-streaming \
            --disable-plugin-videocall \
            --disable-plugin-voicemail \
            --disable-plugin-textroom \
            --disable-data-channels \
            --disable-rabbitmq \
            --disable-unix-sockets \
            --disable-mqtt \
            --disable-dependency-tracking && \
make
make install

