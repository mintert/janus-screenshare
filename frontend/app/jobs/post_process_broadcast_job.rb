class PostProcessBroadcastJob < ActiveJob::Base
  queue_as :default

  def perform(broadcast)
    @broadcast = broadcast

    convert_webcam_recording
    convert_screen_recording
    merge_screen_and_webcam
  end


  private

  def convert_screen_recording
    return unless screen_video_file.exist?
    janus_encode_webm(screen_video_file, 'screen_video.webm')
  end

  def convert_webcam_recording
    return unless webcam_video_file.exist? && webcam_audio_file.exist?
    janus_encode_webm(webcam_video_file, 'webcam_video.webm')
    janus_encode_webm(webcam_audio_file, 'webcam_audio.opus')
 end

  def janus_encode_webm(file, target_name)
    system("#{Rails.root}/bin/janus-pp-rec '#{file}' '#{@broadcast.path}/#{target_name}'")
  end

  def merge_screen_and_webcam
    screen_video = Pathname.new("#{@broadcast.path}/screen_video.webm")
    webcam_video = Pathname.new("#{@broadcast.path}/webcam_video.webm")
    webcam_audio = Pathname.new("#{@broadcast.path}/webcam_audio.opus")
    return unless screen_video.exist? && webcam_video.exist? && webcam_audio.exist?

    movie = FFMPEG::Movie.new("#{screen_video}")
    merged = movie.transcode("#{@broadcast.path}/merged.mp4", "-i #{webcam_video} -i #{webcam_audio} -filter_complex 'overlay=main_w-overlay_w:0' -c:v libx264 -c:a aac -strict experimental")

    temp_file = Tempfile.new(['thumbnail', '.jpg'])
    merged.screenshot(temp_file.path, { seek_time: 1, resolution: merged.resolution }, preserve_aspect_ratio: :height)

    @broadcast.update_attributes(thumbnail: temp_file, processed: true)
    temp_file.unlink
  end


  private

  def webcam_audio_file
    @webcam_audio_file ||= Pathname.new(Dir.glob("#{@broadcast.path}/videoroom-#{@broadcast.room}-user-#{@broadcast.webcam_handle}-*-audio.mjr").first || '')
  end

  def webcam_video_file
    @webcam_video_file ||= Pathname.new(Dir.glob("#{@broadcast.path}/videoroom-#{@broadcast.room}-user-#{@broadcast.webcam_handle}-*-video.mjr").first || '')
  end

  def screen_video_file
    @screen_video_file ||= Pathname.new(Dir.glob("#{@broadcast.path}/videoroom-#{@broadcast.room}-user-#{@broadcast.screen_handle}-*-video.mjr").first || '')
  end
end