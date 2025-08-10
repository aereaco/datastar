# frozen_string_literal: true

require 'nexus_ux/async_executor'

module NexusUX
  class RailsAsyncExecutor < NexusUX::AsyncExecutor
    def prepare(response)
      response.delete_header 'Connection'
    end

    def spawn(&block)
      Async do
        Rails.application.executor.wrap(&block)
      end
    end
  end
end