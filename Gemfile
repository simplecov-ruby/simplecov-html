# frozen_string_literal: true

source "https://rubygems.org"

gemspec

gem "rake", ">= 11"

# Use local copy of simplecov in development if you want to
# gem "simplecov", :path => File.dirname(__FILE__) + "/../simplecov"
if RUBY_VERSION < "2.5"
  gem "simplecov", "< 0.19"
else
  gem "simplecov", git: "https://github.com/simplecov-ruby/simplecov"
end

group :test do
  gem "minitest"
end

group :development do
  gem "rubocop"
  gem "rubocop-minitest"
  gem "rubocop-performance"
  gem "rubocop-rake"
  gem "sass"
  gem "sprockets"
  gem "uglifier"
end

gem "logger" if RUBY_VERSION >= "3.4"
