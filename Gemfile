# frozen_string_literal: true

source "https://rubygems.org"

gemspec

gem "rake", ">= 11"

# Use local copy of simplecov in development if you want to
# gem "simplecov", :path => File.dirname(__FILE__) + "/../simplecov"
gem "simplecov", git: "https://github.com/simplecov-ruby/simplecov"

group :test do
  gem "minitest"
end

group :development do
  gem "rubocop"
  gem "rubocop-minitest"
  gem "rubocop-performance"
  gem "rubocop-rake"
  gem "sprockets"
  gem "uglifier"
  gem "yui-compressor"
end
