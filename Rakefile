# frozen_string_literal: true

require "bundler"
Bundler::GemHelper.install_tasks

require "rake/testtask"
Rake::TestTask.new(:test) do |test|
  test.libs << "lib" << "test"
  test.pattern = "test/**/test_*.rb"
  test.verbose = true
end

begin
  require "rubocop/rake_task"
  RuboCop::RakeTask.new
rescue LoadError
  task :rubocop do
    warn "Rubocop is disabled"
  end
end

task default: %i[test rubocop]

namespace :assets do
  desc "Compiles all assets using esbuild"
  task :compile do
    puts "Compiling assets"

    # JS: esbuild bundles TypeScript + highlight.js and minifies
    sh "esbuild src/app.ts --bundle --minify --target=es2015 --outfile=public/application.js"

    # CSS: concatenate in order and minify
    css = %w[
      assets/stylesheets/reset.css
      assets/stylesheets/plugins/highlight.css
      assets/stylesheets/screen.css
    ].map { |f| File.read(f) }.join("\n")

    IO.popen(%w[esbuild --minify --loader=css], "r+") do |io|
      io.write(css)
      io.close_write
      File.write("public/application.css", io.read)
    end
  end
end
