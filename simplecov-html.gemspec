# frozen_string_literal: true

$LOAD_PATH.push File.expand_path("../lib", __FILE__)
require "simplecov-html/version"

Gem::Specification.new do |gem|
  gem.name        = "simplecov-html"
  gem.version     = SimpleCov::Formatter::HTMLFormatter::VERSION
  gem.platform    = Gem::Platform::RUBY
  gem.authors     = ["Christoph Olszowka"]
  gem.email       = ["christoph at olszowka de"]
  gem.homepage    = "https://github.com/simplecov-ruby/simplecov-html"
  gem.description = %(Default HTML formatter for SimpleCov code coverage tool for ruby 2.5+)
  gem.summary     = gem.description
  gem.license     = "MIT"

  gem.required_ruby_version = ">= 2.6"

  gem.files = Dir.chdir(__dir__) do
    `git ls-files -z`.split("\x0").reject do |f|
      (File.expand_path(f) == __FILE__) ||
        f.start_with?(*%w[bin/ test/ spec/ features/ .git .github appveyor Gemfile assets .rubocop.yml Guardfile])
    end
  end
  gem.executables   = `git ls-files -- bin/*`.split("\n").map { |f| File.basename(f) }
  gem.require_paths = ["lib"]
  gem.metadata["rubygems_mfa_required"] = "true"
end
