# frozen_string_literal: true

$LOAD_PATH.push File.expand_path("lib", __dir__)
require "simplecov-html/version"

Gem::Specification.new do |gem|
  gem.name        = "simplecov-html"
  gem.version     = SimpleCov::Formatter::HTMLFormatter::VERSION
  gem.platform    = Gem::Platform::RUBY
  gem.authors     = ["Christoph Olszowka"]
  gem.email       = ["christoph at olszowka de"]
  gem.homepage    = "https://github.com/simplecov-ruby/simplecov-html"
  gem.summary     = "Default HTML formatter for SimpleCov code coverage tool"
  gem.description = gem.summary
  gem.license     = "MIT"

  gem.required_ruby_version = ">= 2.7"

  gem.metadata = {
    "homepage_uri" => gem.homepage,
    "source_code_uri" => gem.homepage,
    "changelog_uri" => "#{gem.homepage}/releases",
    "bug_tracker_uri" => "#{gem.homepage}/issues",
    "rubygems_mfa_required" => "true",
  }

  gem.files = Dir[
    "lib/**/*.rb",
    "public/**/*",
    "views/**/*.erb",
    "LICENSE"
  ]
  gem.require_paths = ["lib"]
end
