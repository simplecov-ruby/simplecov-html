# frozen_string_literal: true

require "erb"
require "fileutils"
require "digest/sha1"
require "time"

# Ensure we are using a compatible version of SimpleCov
# :nocov:
raise "The version of SimpleCov you are using is too old." unless Gem::Version.new(SimpleCov::VERSION) >= Gem::Version.new("0.9.0")
# :nocov:

module SimpleCov
  module Formatter
    # Generates an HTML coverage report from SimpleCov results.
    class HTMLFormatter
      # Only have a few content types, just hardcode them
      CONTENT_TYPES = {
        ".js" => "text/javascript",
        ".png" => "image/png",
        ".gif" => "image/gif",
        ".css" => "text/css",
      }.freeze

      def initialize(silent: false, inline_assets: false)
        @branch_coverage = SimpleCov.branch_coverage?
        @method_coverage = SimpleCov.respond_to?(:method_coverage?) && SimpleCov.method_coverage?
        @templates = {}
        @inline_assets = inline_assets || !ENV["SIMPLECOV_INLINE_ASSETS"].nil?
        @public_assets_dir = File.join(File.dirname(__FILE__), "../public/")
        @silent = silent
      end

      def format(result)
        unless @inline_assets
          Dir[File.join(@public_assets_dir, "*")].each do |path|
            FileUtils.cp_r(path, asset_output_path, remove_destination: true)
          end
        end

        File.write(File.join(output_path, "index.html"), template("layout").result(binding), mode: "wb")
        puts output_message(result) unless @silent
      end

    private

      def branch_coverage?
        # cached in initialize because we truly look it up a whole bunch of times
        # and it's easier to cache here then in SimpleCov because there we might
        # still enable/disable branch coverage criterion
        @branch_coverage
      end

      def method_coverage?
        # cached in initialize because we truly look it up a whole bunch of times
        # and it's easier to cache here then in SimpleCov because there we might
        # still enable/disable branch coverage criterion
        @method_coverage
      end

      def line_status?(source_file, line)
        branch_coverage? && source_file.line_with_missed_branch?(line.number) ? "missed-branch" : line.status
      end

      def output_message(result)
        parts = []
        parts << "Coverage report generated for #{result.command_name} to #{output_path}"
        parts << "Line coverage: #{render_stats(result, :line)}"
        parts << "Branch coverage: #{render_stats(result, :branch)}" if branch_coverage?
        parts << "Method coverage: #{render_stats(result, :method)}" if method_coverage?

        parts.join("\n")
      end

      # Returns the an erb instance for the template of given name
      def template(name)
        @templates[name] ||= ERB.new(File.read(File.join(File.dirname(__FILE__), "../views/", "#{name}.erb")), trim_mode: "-")
      end

      def output_path
        SimpleCov.coverage_path
      end

      def asset_output_path
        @asset_output_path ||= File.join(output_path, "assets", SimpleCov::Formatter::HTMLFormatter::VERSION).tap do |path|
          FileUtils.mkdir_p(path)
        end
      end

      def assets_path(name)
        return asset_inline(name) if @inline_assets

        File.join("./assets", SimpleCov::Formatter::HTMLFormatter::VERSION, name)
      end

      def to_id(value)
        value.gsub(/^[^a-zA-Z]+/, "").gsub(/[^a-zA-Z0-9\-_]/, "")
      end

      def asset_inline(name)
        path = File.join(@public_assets_dir, name)
        # Equivalent to `Base64.strict_encode64(File.read(path))` but without depending on Base64
        base64_content = [File.read(path)].pack("m0")
        "data:#{CONTENT_TYPES[File.extname(name)]};base64,#{base64_content}"
      end

      # Returns the html for the given source_file
      def formatted_source_file(source_file)
        template("source_file").result(binding)
      rescue Encoding::CompatibilityError => e
        puts "Encoding problems with file #{source_file.filename}. Simplecov/ERB can't handle non ASCII characters in filenames. Error: #{e.message}."
      end

      # Returns a table containing the given source files
      def formatted_file_list(title, source_files)
        template("file_list").result(binding)
      end

      def covered_percent(percent)
        template("covered_percent").result(binding)
      end

      def coverage_css_class(covered_percent)
        if covered_percent > 90
          "green"
        elsif covered_percent > 80
          "yellow"
        else
          "red"
        end
      end

      def strength_css_class(covered_strength)
        if covered_strength > 1
          "green"
        elsif covered_strength == 1
          "yellow"
        else
          "red"
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
        source_file.filename.sub(SimpleCov.root, ".").gsub(%r{^\./}, "")
      end

      def link_to_source_file(source_file)
        %(<a href="##{id source_file}" class="src_link" title="#{shortened_filename source_file}">#{shortened_filename source_file}</a>)
      end

      def render_stats(result, criterion)
        stats = result.coverage_statistics.fetch(criterion)
        Kernel.format("%<covered>d / %<total>d (%<percent>.2f%%)", covered: stats.covered, total: stats.total, percent: stats.percent)
      end
    end
  end
end

$LOAD_PATH.unshift(File.join(File.dirname(__FILE__)))
require "simplecov-html/version"
