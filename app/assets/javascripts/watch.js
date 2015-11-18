$(document).ready(function() {
  var room = Number(window.location.hash.substring(1));
  var server = 'wss://' + window.location.hostname + ':8989';
  var janusSession = null;

  if (room > 0) {
    Janus.init({
      debug: 'all',
      callback: function() {
        janusSession = new Janus({
          server: server,
          success: function() {
            joinRoom(room);
          },
          error: function(error) {
            Janus.error(error);
            alert(error);
            window.location.reload();
          },
          destroyed: function() {
            window.location.reload();
          }
        });
      }}
    );
  } else {
    // no room given
  }

  function joinRoom(room) {
    var handle = null;

    janusSession.attach({
      plugin: 'janus.plugin.videoroom',
      success: function(pluginHandle) {
        handle = pluginHandle
        Janus.log('Plugin attached! (' + pluginHandle.getPlugin() + ', id=' + pluginHandle.getId() + ')');

        // join room
        var register = { 'request': 'join', 'room': room, 'ptype': 'publisher', 'display': randomString(12) };
        handle.send({'message': register});
      },
      onmessage: function(msg, jsep) {
        Janus.debug(' ::: Got a message (publisher) :::');
        Janus.debug(JSON.stringify(msg));
        var event = msg['videoroom'];
        Janus.debug('Event: ' + event);

        if(event != undefined && event != null) {
          if(event === 'joined') {
            var id = msg['id'];
            Janus.log('Successfully joined room ' + msg['room'] + ' with ID ' + id);

            if(msg["publishers"] !== undefined && msg["publishers"] !== null) {
              var list = msg["publishers"];
              Janus.debug("Got a list of available publishers/feeds:");
              Janus.debug(list);
              for(var f in list) {
                var id = list[f]["id"];
                var display = list[f]["display"];
                Janus.debug("  >> [" + id + "] " + display);
                newRemoteFeed(id, display);
              }

              if (list.length === 0) {
                $('#no_stream').show();
              }
            }
          } else if (msg["publishers"] !== undefined && msg["publishers"] !== null) {
            // in this case: new screencast handle
            var list = msg["publishers"];
            for(var f in list) {
              var id = list[f]["id"];
              var display = list[f]["display"];
              Janus.debug("  >> [" + id + "] " + display);
              newRemoteFeed(id, display);
            }
          } else if(msg["leaving"] !== undefined && msg["leaving"] !== null) {
            // One of the publishers has gone away?
            var leaving = msg["leaving"];
            Janus.log("Publisher left: " + leaving);
            window.location.reload();
          } else if(msg['error'] !== undefined && msg['error'] !== null) {
            alert(msg['error']);
          }
        }
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
      $('#screenstream').show();
    }
  }

  function newRemoteFeed(id, display) {
  // A new feed has been published, create a new plugin handle and attach to it as a listener
  var handle = null;

    janusSession.attach({
      plugin: 'janus.plugin.videoroom',
      success: function(pluginHandle) {
        handle = pluginHandle
        Janus.log('Plugin attached! (' + pluginHandle.getPlugin() + ', id=' + pluginHandle.getId() + ')');

        // We wait for the plugin to send us an offer
        var listen = { 'request': 'join', 'room': room, 'ptype': 'listener', 'feed': id };
        handle.send({"message": listen});
      },
      error: function(error) {
        Janus.error("  -- Error attaching plugin...", error);
      },
      onwebrtcup: function() {
        webRTCConnectionEstablished(display);
      },
      onmessage: function(msg, jsep) {
        Janus.debug(" ::: Got a message (listener) :::");
        Janus.debug(JSON.stringify(msg));
        var event = msg['videoroom'];
        Janus.debug('Event: ' + event);

        if(event != undefined && event != null) {
          if(event === 'attached') {
            // Subscriber created and attached
            Janus.log("Successfully attached to feed " + id + " (" + display + ") in room " + msg["room"]);
            handle.send({ 'message': { 'request': 'configure' }});
          } else {
            // What has just happened?
          }
        }
        if(jsep !== undefined && jsep !== null) {
          Janus.debug('Handling SDP as well...');
          Janus.debug(jsep);
          // Answer and attach
          handle.createAnswer(
            {
              jsep: jsep,
              media: { audioSend: false, videoSend: false },  // We want recvonly audio/video
              success: function(jsep) {
                Janus.debug('Got SDP!');
                Janus.debug(jsep);
                var body = { 'request': 'start', 'room': room };
                handle.send({'message': body, 'jsep': jsep});
              },
              error: function(error) {
                Janus.error('WebRTC error:', error);
                bootbox.alert('WebRTC error... ' + error);
              }
            });
        }
      },
      onlocalstream: function(stream) {
        // The subscriber stream is recvonly, we don't expect anything here
      },
      onremotestream: function(stream) {
        if (display == "screen") {
          if (videojs.players['screenvideo'] !== undefined && videojs.players['screenvideo'] !== null) {
            videojs('screenvideo').dispose();
          }

          $('#screenstream').append('<video class="video-js hide" id="screenvideo" width="100%" height="100%" autoplay muted="muted"/>');

          $("#screenvideo").bind("playing", function () {
            if (videojs.players['screenvideo'] === undefined || videojs.players['screenvideo'] === null) {
              videojs('screenvideo', { "controls": true, "fluid": true });
            }
          });

          attachMediaStream($('#screenvideo')[0], stream);
        }

        if (display == "webcam") {
          if($('#webcamvideo').length === 0) {
            $('#screenstream').append('<video class="video-js hide" id="webcamvideo" width="640" height="360" autoplay muted="muted"/>');
          }
          // Show the video, hide the spinner and show the resolution when we get a playing event
          $("#webcamvideo").bind("playing", function () {
            if (videojs.players['webcamvideo'] === undefined)
              videojs('webcamvideo', { "controls": false, "width": 320, "height": 240 });
          });
          attachMediaStream($('#webcamvideo')[0], stream);
        }
      },
      oncleanup: function() {
        Janus.log(" ::: Got a cleanup notification (remote feed " + id + ") :::");
        $()
      }
    });
  }

  function randomString(len, charSet) {
    charSet = charSet || 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var randomString = '';
    for (var i = 0; i < len; i++) {
      var randomPoz = Math.floor(Math.random() * charSet.length);
      randomString += charSet.substring(randomPoz,randomPoz+1);
    }
    return randomString;
  }

});