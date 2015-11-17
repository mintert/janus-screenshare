$(document).ready(function() {
  var server = 'wss://' + window.location.hostname + ':8989';
  var janusSession = null, started = false, role = 'publisher';

  Janus.init({
    debug: 'all',
    callback: function() {
      $('#start_broadcast').click(function() {
        if (started) return;
        started = true;
        $(this).attr('disabled', true).unbind('click');

        janusSession = new Janus({
          server: server,
          success: function() {
            createRoomAndShare();
          },
          error: function(error) {
            Janus.error(error);
            alert(error);
            window.location.reload();
          },
          destroyed: function() {
            window.location.reload();
          }
        })
      })
    }}
  );

  function createRoomAndShare() {
    var handle = null;

    janusSession.attach({
      plugin: 'janus.plugin.videoroom',
      success: function(pluginHandle) {
        handle = pluginHandle
        Janus.log('Plugin attached! (' + pluginHandle.getPlugin() + ', id=' + pluginHandle.getId() + ')');

        var create = { 'request': 'create', 'description': 'desc', 'bitrate': 2048 * 1024, 'publishers': 2, 'record': false };
        handle.send({
          message: create,
          success: function(result) {
            var event = result["videoroom"];
            if (event != undefined && event != null) {
              var room = result['room'];

              var url = $('#watch_link').data('href') + '#' + room;
              $('#watch_link').attr('href', url).text(url);
              
              createScreencastHandle(room);
              createWebcamHandle(room);
            }
          }
        });
      }
    });
  }

  var screenReady = false, webcamReady = false;
  function webRTCConnectionEstablished(display) {
    if (display === 'webcam') {
      webcamReady = true;
    } else if (display === 'screen') {
      screenReady = true;
    }

    // if both streams are up, switch to preview
    if (webcamReady && screenReady) {
      $('#pre_share').hide();
      $('#post_share').show();
    }
  }

  // ===============================================================
  //  SCREEN SHARE
  // ===============================================================
  //   Attach a new plugin to Janus Session
  function createScreencastHandle(room) {
    var handle = null;

    janusSession.attach({
      plugin: 'janus.plugin.videoroom',
      success: function(pluginHandle) {
        handle = pluginHandle
        Janus.log('Plugin attached! (' + pluginHandle.getPlugin() + ', id=' + pluginHandle.getId() + ')');

        handle.send({ 'message': { 'request': 'join', 'room': room, 'ptype': 'publisher', 'display': 'screen' } });
      },
      onmessage: function(msg, jsep) {
        Janus.debug(' ::: Got a message (publisher) :::');
        Janus.debug(JSON.stringify(msg));
        var event = msg["videoroom"];
        Janus.debug("Event: " + event);

        if(event != undefined && event != null) {
          if(event === 'joined') {
            var id = msg["id"];
            Janus.log('Successfully joined room ' + msg['room'] + ' with ID ' + id);

            handle.createOffer({
              media: { video: 'screen', audio: false, videoRecv: false},
              success: function(jsep) {
                Janus.debug('Got publisher SDP!');
                Janus.debug(jsep);
                var publish = { 'request': 'configure', 'audio': true, 'video': true, 'bitrate': 2048 * 1024 };
                handle.send({'message': publish, 'jsep': jsep});
              },
              error: function(error) {
                Janus.error('WebRTC error:', error);
                alert(JSON.stringify(error));
              }
            });
          } else if(msg['error'] !== undefined && msg['error'] !== null) {
            alert(msg['error']);
          }
        }

        if(jsep !== undefined && jsep !== null) {
          Janus.debug("Handling SDP as well...");
          Janus.debug(jsep);
          handle.handleRemoteJsep({jsep: jsep});
        }
      },
      onwebrtcup: function() {
        webRTCConnectionEstablished('screen');
      },
      onlocalstream: function(stream) {
        Janus.debug(' ::: Got a local stream :::');
        Janus.debug(JSON.stringify(stream));

        $('#screenpreview').append('<video class="video-js" id="screenvideo" controls autoplay muted="muted"/>');
        $("#screenvideo").bind("playing", function () {
          if (videojs.players['screenvideo'] === undefined)
            videojs('screenvideo', { "controls": true, "fluid": true });
        });
        attachMediaStream($('#screenvideo')[0], stream);
      }
    });
  };

  // ===============================================================
  //  WEBCAM
  // ===============================================================
  //   Attach a new plugin to Janus Session
  function createWebcamHandle(room) {
   var handle = null;

    janusSession.attach({
      plugin: 'janus.plugin.videoroom',
      success: function(pluginHandle) {
        handle = pluginHandle
        Janus.log('Plugin attached! (' + pluginHandle.getPlugin() + ', id=' + pluginHandle.getId() + ')');

        handle.send({ 'message': { 'request': 'join', 'room': room, 'ptype': 'publisher', 'display': 'webcam' } });
      },
      onmessage: function(msg, jsep) {
        Janus.debug(' ::: Got a message (publisher) :::');
        Janus.debug(JSON.stringify(msg));
        var event = msg["videoroom"];
        Janus.debug("Event: " + event);

        if(event != undefined && event != null) {
          if(event === 'joined') {
            var id = msg["id"];
            Janus.log('Successfully joined room ' + msg['room'] + ' with ID ' + id);

            handle.createOffer({
              media: { audioRecv: false, videoRecv: false, audioSend: true, videoSend: true, video: "lowres"},
              success: function(jsep) {
                Janus.debug('Got publisher SDP!');
                Janus.debug(jsep);
                var publish = { "request": "configure", "audio": true, "video": true, "bitrate": 2048 * 1024 };
                handle.send({'message': publish, 'jsep': jsep});
              },
              error: function(error) {
                Janus.error('WebRTC error:', error);
                alert(JSON.stringify(error));
              }
            });
          } else if(msg['error'] !== undefined && msg['error'] !== null) {
            alert(msg['error']);
          }
        }

        if(jsep !== undefined && jsep !== null) {
          Janus.debug("Handling SDP as well...");
          Janus.debug(jsep);
          handle.handleRemoteJsep({jsep: jsep});
        }
      },
      onwebrtcup: function() {
        webRTCConnectionEstablished('webcam');
      },
      onlocalstream: function(stream) {
        Janus.debug(' ::: Got a local stream :::');
        Janus.debug(JSON.stringify(stream));

        $('#screenpreview').append('<video class="video-js" id="webcamvideo" controls autoplay muted="muted"/>');
        $("#webcamvideo").bind("playing", function () {
          if (videojs.players['webcamvideo'] === undefined)
            videojs('webcamvideo', { "controls": false, "width": 320, "height": 240 });
        });
        attachMediaStream($('#webcamvideo')[0], stream);
      }
    });
  }

});