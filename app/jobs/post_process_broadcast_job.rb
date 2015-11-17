class PostProcessBroadcastJob < ActiveJob::Base
  queue_as :default

  def perform(broadcast)
    @broadcast = broadcast

    convert_webcam_recording
    convert_screen_recording
  end


  private

  def convert_screen_recording
    video = Pathname.new(Dir.glob("#{@broadcast.path}/videoroom-#{@broadcast.room}-user-#{@broadcast.screen_handle}-*-video.mjr").first || '')
    return unless video.exist?

    janus_encode_webm(video, 'screen_video.webm')

    movie = FFMPEG::Movie.new("#{@broadcast.path}/screen_video.webm")

    movie.transcode("#{@broadcast.path}/screen.mp4", {
      video_codec: 'libx264'
    })
  end

  def convert_webcam_recording
    video = Pathname.new(Dir.glob("#{@broadcast.path}/videoroom-#{@broadcast.room}-user-#{@broadcast.webcam_handle}-*-video.mjr").first || '')
    audio = Pathname.new(Dir.glob("#{@broadcast.path}/videoroom-#{@broadcast.room}-user-#{@broadcast.webcam_handle}-*-audio.mjr").first || '')

    return unless video.exist? && audio.exist?

    janus_encode_webm(video, 'webcam_video.webm')
    janus_encode_webm(audio, 'webcam_audio.opus')

    movie = FFMPEG::Movie.new("#{@broadcast.path}/webcam_video.webm")

    movie.transcode("#{@broadcast.path}/webcam.mp4", "-i #{@broadcast.path}/webcam_audio.opus -c:v libx264 -c:a aac -strict experimental")
  end

  def janus_encode_webm(file, target_name)
    system("#{Rails.root}/bin/janus-pp-rec '#{file}' '#{@broadcast.path}/#{target_name}'")
  end
end