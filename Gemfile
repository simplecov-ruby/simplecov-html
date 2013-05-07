source :rubygems

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

  gem 'guard-bundler'
  gem 'guard-rake'
  gem 'simplecov', '=0.8.1.ooyala'
end