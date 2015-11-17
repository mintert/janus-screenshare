class CreateBroadcasts < ActiveRecord::Migration
  def change
    create_table :broadcasts do |t|
      t.string :room
      t.string :screen_handle
      t.string :webcam_handle
      t.boolean :active, default: true
      t.boolean :recorded, default: false
      t.timestamps null: false
    end
  end
end
