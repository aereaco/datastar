# frozen_string_literal: true

module NexusUX
  # See https://guides.rubyonrails.org/threading_and_code_execution.html#wrapping-application-code
  class RailsThreadExecutor < NexusUX::ThreadExecutor
    def spawn(&block)
      Thread.new do
        Rails.application.executor.wrap(&block)
      end
    end
  end
end