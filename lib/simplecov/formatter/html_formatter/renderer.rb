# frozen_string_literal: true

require "erb"
require "cgi"
require "digest/sha1"
require "time"
require "base64"

module SimpleCov
  module Formatter
    class HTMLFormatter
      class Renderer
        CONTENT_TYPES = {
          ".js" => ["public", "text/javascript"],
          ".png" => ["assets/images", "image/png"],
          ".gif" => ["assets/images", "image/gif"],
          ".css" => ["public", "text/css"],
        }.freeze

        def initialize(base_dir, inline_assets)
          @base_dir = base_dir
          @inline_assets = inline_assets
          @branchable_result = SimpleCov.branch_coverage?
        end

        def render(result)
          template("layout").result(binding)
        end

      private

        attr_reader :base_dir

        # Returns the an erb instance for the template of given name
        def template(name)
          ERB.new(File.read(File.join(base_dir, "views", "#{name}.erb")))
        end

        def assets_path(name)
          if inline_assets?
            dir, content_type = CONTENT_TYPES.fetch(File.extname(name))
            path = File.join(base_dir, dir, name)
            base64_content = Base64.strict_encode64(File.open(path).read)

            "data:#{content_type};base64,#{base64_content}"
          else
            File.join("./assets", SimpleCov::Formatter::HTMLFormatter::VERSION, name)
          end
        end

        def branchable_result?
          # cached in initialize because we truly look it up a whole bunch of times
          # and it's easier to cache here then in SimpleCov because there we might
          # still enable/disable branch coverage criterion
          @branchable_result
        end

        def line_status?(source_file, line)
          if branchable_result? && source_file.line_with_missed_branch?(line.number)
            "missed-branch"
          else
            line.status
          end
        end

        # Returns the html for the given source_file
        def formatted_source_file(source_file)
          template("source_file").result(binding)
        rescue Encoding::CompatibilityError => e
          puts "Encoding problems with file #{source_file.filename}. Simplecov/ERB can't handle non ASCII characters in filenames. Error: #{e.message}."
        end

        # Returns a table containing the given source files
        def formatted_file_list(title, source_files)
          title_id = title.gsub(/^[^a-zA-Z]+/, "").gsub(/[^a-zA-Z0-9\-_]/, "")
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
          source_file.filename.sub(SimpleCov.root, ".").gsub(/^\.\//, "")
        end

        def link_to_source_file(source_file)
          %(<a href="##{id source_file}" class="src_link" title="#{shortened_filename source_file}">#{shortened_filename source_file}</a>)
        end

        def inline_assets?
          @inline_assets
        end
      end
    end
  end
end
