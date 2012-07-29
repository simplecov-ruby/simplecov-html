require "simplecov"
require 'erb'
require 'cgi'
require 'fileutils'
require 'digest/sha1'
require 'time'

# Ensure we are using an compatible version of SimpleCov
if Gem::Version.new(SimpleCov::VERSION) < Gem::Version.new("0.4.2")
  raise RuntimeError, "The version of SimpleCov you are using is too old. Please update with 'gem install simplecov'"
end

class SimpleCov::Formatter::SlikFormatter < SimpleCov::Formatter::HTMLFormatter
  def format(result)
    Dir[File.join(File.dirname(__FILE__), '../../assets/slik/**/*')].each do |path|
      FileUtils.cp_r(path, asset_output_path)
    end

    File.open(File.join(output_path, "index.html"), "w+") do |file|
      file.puts template('layout').result(binding)
    end
    puts "Coverage report generated for #{result.command_name} to #{output_path}. #{result.covered_lines} / #{result.total_lines} LOC (#{result.covered_percent.round(2)}%) covered."
  end

  private

  # Returns the an erb instance for the template of given name
  def template(name)
    ERB.new(File.read(File.join(File.dirname(__FILE__), '../../views/slik', "#{name}.erb")))
  end

  def asset_output_path
    return @asset_output_path if @asset_output_path
    @asset_output_path = File.join(output_path, 'assets', 'slik', SimpleCov::Formatter::HTMLFormatter::VERSION)
    FileUtils.mkdir_p(@asset_output_path)
    @asset_output_path
  end

  def assets_path(name)
    File.join('./assets/slik', SimpleCov::Formatter::HTMLFormatter::VERSION, name)
  end

  def coverage_css_class(covered_percent)
    if covered_percent > 90
      'high'
    elsif covered_percent > 80
      'medium'
    elsif covered_percent >= 50
      'low'
    else
      'terrible'
    end
  end

  def path_without_filename(source_file)
    file = source_file.filename.split("/").last
    shortened_filename(source_file).gsub(file, "").strip
  end

  def file_name(source_file)
    source_file.filename.split("/").last.strip
  end

  def shortened_filename(source_file)
    source_file.filename.gsub(SimpleCov.root, '').gsub(/\A\//, "").strip
  end
end

$LOAD_PATH.unshift(File.join(File.dirname(__FILE__)))
require 'simplecov-html/version'
