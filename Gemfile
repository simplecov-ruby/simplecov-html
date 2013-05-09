source :rubygems
source "http://gems.ooyala.com"
gemspec

group :development do
  # Use local copy of simplecov in development when checked out, fetch from git otherwise
=begin
  if File.directory?(File.dirname(__FILE__) + '/../simplecov')
    gem 'simplecov', :path => File.dirname(__FILE__) + '/../simplecov'
  else
    gem 'simplecov', :git => 'https://github.com/colszowka/simplecov'
  end
=end
  gem 'simplecov', '0.8.2.ooyala'

  gem 'guard-bundler'
  gem 'guard-rake'
end
