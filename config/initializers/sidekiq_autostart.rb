class SidekiqAutostart < Rails::Railtie
  config.after_initialize do
    if !Sidekiq.server?
      puts "Sidekiq server starting ..."

      # kill running process
      pid = `cat #{ Rails.root }/tmp/pids/sidekiq.pid`
      begin
        Process.getpgid(pid.to_i)
        puts "* ... Sidekiq server already running with PID #{pid} - killing it ..."
        # Stop accepting jobs and let it finish work within 3 seconds, then kill it
        system("kill -USR1 #{pid}")
        sleep 3
        system("kill #{pid}")
      rescue Errno::ESRCH
        # process not found
      end

      puts "* ... starting Sidekiq server"
      system "sidekiq -C config/sidekiq.yml -d -e #{Rails.env}"
      puts "------------"
    end
  end
end