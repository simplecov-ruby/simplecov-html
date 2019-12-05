source "https://rubygems.org"

gemspec

gem "rake", ">= 11"

# Use local copy of simplecov in development when checked out, fetch from git otherwise
if File.directory?(File.dirname(__FILE__) + "/../simplecov")
  gem "simplecov", :path => File.dirname(__FILE__) + "/../simplecov"
else
  gem "simplecov", :git => "https://github.com/colszowka/simplecov"
end

group :test do
  gem "minitest"
end

group :development do
  gem "rubocop", "~> 0.62.0"
  gem "sass"
  gem "sprockets"
end
