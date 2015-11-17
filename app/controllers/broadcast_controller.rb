class BroadcastController < ApplicationController
  def share
  end

  def watch
  end

  def create
    @broadcast = Broadcast.create
    render json: { id: @broadcast.id, path: @broadcast.path.to_s, update_url: update_broadcast_url(@broadcast) }
  end

  def update
    @broadcast = Broadcast.find(params[:id])
    @broadcast.update(broadcast_params)

    render json: nil
  end


  private

  def broadcast_params
    params.permit(:room, :webcam_handle, :screen_handle, :active, :recorded)
  end
end