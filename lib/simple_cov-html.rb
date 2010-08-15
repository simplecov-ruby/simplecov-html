require 'erb'
require 'fileutils'
require 'digest/sha1'
class SimpleCov::Formatter::HTMLFormatter
  def format(result)
    FileUtils.rm_rf(output_path)
    FileUtils.mkdir_p(output_path)
    FileUtils.cp_r(File.join(File.dirname(__FILE__), '../assets'), output_path)
    
    File.open(File.join(output_path, "index.html"), "w+") do |file|
      file.puts template('layout').result(binding)
    end
    puts "Coverage report generated to #{output_path}"
  end
  
  # Returns the html for the given source_file
  def formatted_source_file(source_file)
    template('source_file').result(binding)
  end
  
  # Returns the an erb instance for the template of given name
  def template(name)
    ERB.new(File.read(File.join(File.dirname(__FILE__), '../views/', "#{name}.erb")))
  end
  
  def output_path
    @output_path ||= File.join(Dir.getwd, 'coverage')
  end
  
  # Return a (kind of) unique id for the source file given. Uses SHA1 on path for the id
  def id(source_file)
    Digest::SHA1.hexdigest(source_file.filename)
  end
  
  def coverage_css_class(source_file)
    if source_file.covered_percent > 90
      'green'
    elsif source_file.covered_percent > 80
      'yellow'
    else
      'red'
    end
  end
end

# Set up the html formatter
SimpleCov.formatter = SimpleCov::Formatter::HTMLFormatter