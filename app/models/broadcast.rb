class Broadcast < ActiveRecord::Base
  after_create :make_folder
  after_update :check_broadcast_finished

  def path
    Rails.root.join('public', 'broadcasts', self.id.to_s)
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
      if !self.active? && self.recorded?
        PostProcessBroadcastJob.perform_later(self)
      end
    end
end
