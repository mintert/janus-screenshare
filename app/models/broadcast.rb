class Broadcast < ActiveRecord::Base
  after_create :make_folder
  after_update :check_broadcast_finished
  has_attached_file :thumbnail, styles: { medium: "500x500>", thumb: "100x100>" }, default_url: "/images/:style/missing.png"
  validates_attachment_content_type :thumbnail, content_type: /\Aimage\/.*\Z/

  def path
    Rails.root.join('public', 'broadcasts', self.id.to_s)
  end

  def merged_video_path
    file = path.join('merged.mp4')
    file.exist? ? file : nil
  end

  def merged_video_url
    if merged_video_path.exist?
      "/broadcasts/#{self.id}/merged.mp4"
    end
  end

  def active?
    !!self.active
  end

  def recorded?
    !!self.recorded
  end


  private
    def make_folder
      FileUtils.mkdir_p(self.path.to_s)
    end

    def check_broadcast_finished
      # Recorded broadcast finished
      if !self.active? && self.recorded? && !self.processed
        PostProcessBroadcastJob.perform_later(self)
      end
    end
end
