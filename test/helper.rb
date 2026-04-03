# frozen_string_literal: true

require "bundler/setup"
require "coverage"
if RUBY_ENGINE == "jruby"
  Coverage.start(lines: true)
else
  Coverage.start(lines: true, branches: true)
end
require "simplecov"
SimpleCov.start do
  coverage_dir "tmp/coverage"
  add_filter "/test/"
  if RUBY_ENGINE == "jruby"
    minimum_coverage line: 91
  else
    enable_coverage :branch
    minimums = {line: 100, branch: 100}
    if SimpleCov.respond_to?(:method_coverage_supported?) && SimpleCov.method_coverage_supported?
      enable_coverage :method
      minimums[:method] = 100
    end
    minimum_coverage minimums
  end
end
require "simplecov-html"
require "minitest/autorun"

require "pathname"
require "nokogiri"
