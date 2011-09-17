require 'bundler'
Bundler::GemHelper.install_tasks

require 'rake/testtask'
Rake::TestTask.new(:test) do |test|
  test.libs << 'lib' << 'test'
  test.pattern = 'test/**/test_*.rb'
  test.verbose = true
end

task :default => :test

require 'rake/rdoctask'
Rake::RDocTask.new do |rdoc|
  rdoc.rdoc_dir = 'rdoc'
  rdoc.rdoc_files.include('README*')
  rdoc.rdoc_files.include('lib/**/*.rb')
end

namespace :assets do
  desc "Compiles all assets"
  task :compile do
    puts "Compiling assets"
    require 'sprockets'
    assets = Sprockets::Environment.new
    assets.append_path 'assets/javascripts'
    assets.append_path 'assets/stylesheets'
    puts assets['application.js'].write_to('public/application.js')
    puts assets['application.css'].write_to('public/application.css')
  end
end