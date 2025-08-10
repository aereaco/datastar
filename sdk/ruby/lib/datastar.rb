# frozen_string_literal: true

require_relative 'nexus_ux/version'
require_relative 'nexus_ux/consts'

module NexusUX
  BLANK_OPTIONS = {}.freeze

  def self.config
    @config ||= Configuration.new
  end

  def self.configure(&)
    yield config if block_given?
    config.freeze
    config
  end

  def self.new(...)
    Dispatcher.new(...)
  end

  def self.from_rack_env(env, view_context: nil)
    request = Rack::Request.new(env)
    Dispatcher.new(request:, view_context:)
  end
end

require_relative 'nexus_ux/configuration'
require_relative 'nexus_ux/dispatcher'
require_relative 'nexus_ux/server_sent_event_generator'
require_relative 'nexus_ux/railtie' if defined?(Rails::Railtie)