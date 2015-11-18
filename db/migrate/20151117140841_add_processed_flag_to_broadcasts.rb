class AddProcessedFlagToBroadcasts < ActiveRecord::Migration
  def change
    add_column :broadcasts, :processed, :boolean, default: false
  end
end
