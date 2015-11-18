class AddAttachmentThumbnailToBroadcasts < ActiveRecord::Migration
  def self.up
    change_table :broadcasts do |t|
      t.attachment :thumbnail
    end
  end

  def self.down
    remove_attachment :broadcasts, :thumbnail
  end
end
