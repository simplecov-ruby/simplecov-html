require 'erb'
require 'fileutils'
require 'digest/sha1'
require 'time'
require 'simple_cov'

# Ensure we are using an compatible version of SimpleCov
if Gem::Version.new(SimpleCov::VERSION) < Gem::Version.new("0.2.0")
  raise RuntimeError, "The version of SimpleCov you are using is too old. Please update with 'gem install simple_cov'"
end

class SimpleCov::Formatter::HTMLFormatter
  def format(result)
    FileUtils.cp_r(File.join(File.dirname(__FILE__), '../assets'), output_path)
    
    File.open(File.join(output_path, "index.html"), "w+") do |file|
      file.puts template('layout').result(binding)
    end
    puts "Coverage report generated to #{output_path}"
  end
  
  private
  
  # Returns the an erb instance for the template of given name
  def template(name)
    ERB.new(File.read(File.join(File.dirname(__FILE__), '../views/', "#{name}.erb")))
  end
  
  def output_path
    SimpleCov.coverage_path
  end
  
  # Returns the html for the given source_file
  def formatted_source_file(source_file)
    template('source_file').result(binding)
  end
  
  # Returns a table containing the given source files
  def formatted_file_list(title, source_files)
    template('file_list').result(binding)
  end
  
  def coverage_css_class(covered_percent)
    if covered_percent > 90
      'green'
    elsif covered_percent > 80
      'yellow'
    else
      'red'
    end
  end
  
  # Return a (kind of) unique id for the source file given. Uses SHA1 on path for the id
  def id(source_file)
    Digest::SHA1.hexdigest(source_file.filename)
  end
  
  def timeago(time)
    "<abbr class=\"timeago\" title=\"#{time.iso8601}\">#{time.iso8601}</abbr>"
  end
  
  def shortened_filename(source_file)
    source_file.filename.gsub(/^#{File.expand_path(SimpleCov.root)}/, '.')
  end
  
  def link_to_source_file(source_file)
    %Q(<a href="##{id source_file}" class="src_link" title="#{shortened_filename source_file}">#{shortened_filename source_file}</a>)
  end
end

# Set up the html formatter
SimpleCov.formatter = SimpleCov::Formatter::HTMLFormatter