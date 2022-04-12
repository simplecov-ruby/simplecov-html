# frozen_string_literal: true

# Ensure we are using a compatible version of SimpleCov
major, minor, patch = SimpleCov::VERSION.scan(/\d+/).first(3).map(&:to_i)
if major < 0 || minor < 9 || patch < 0
  raise "The version of SimpleCov you are using is too old. "\
  "Please update with `gem install simplecov` or `bundle update simplecov`"
end

$LOAD_PATH.unshift(File.join(File.dirname(__FILE__)))

require "simplecov/formatter/html_formatter"
require "simplecov/formatter/html_formatter/version"
