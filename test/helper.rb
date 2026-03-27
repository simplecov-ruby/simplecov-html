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
    minimum_coverage line: 97
  else
    enable_coverage :branch
    minimum_coverage line: 100, branch: 100
  end
end
require "simplecov-html"
require "minitest/autorun"

require "pathname"
require "nokogiri"
