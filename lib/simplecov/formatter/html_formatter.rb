# frozen_string_literal: true

require "fileutils"
require "simplecov/formatter/html_formatter/renderer"

module SimpleCov
  module Formatter
    class HTMLFormatter
      def initialize
        @base_dir = File.expand_path(File.join(File.dirname(__FILE__), "../../../"))
        @inline_assets = !ENV["SIMPLECOV_INLINE_ASSETS"].nil?
        @renderer = SimpleCov::Formatter::HTMLFormatter::Renderer.new(base_dir, @inline_assets)
      end

      def format(result)
        prepare

        File.open(File.join(output_path, "index.html"), "wb") do |file|
          file.puts renderer.render(result)
        end

        puts output_message(result)
      end

      def output_message(result)
        "Coverage report generated for #{result.command_name} to #{output_path}. #{result.covered_lines} / #{result.total_lines} LOC (#{result.covered_percent.round(2)}%) covered."
      end

    private

      attr_reader :renderer, :base_dir

      def prepare
        return if inline_assets?

        asset_output_path = File.join(output_path, "assets", SimpleCov::Formatter::HTMLFormatter::VERSION)

        FileUtils.mkdir_p(asset_output_path)

        Dir[File.join(base_dir, "public/*")].each do |path|
          FileUtils.cp_r(path, asset_output_path)
        end
      end

      def output_path
        SimpleCov.coverage_path
      end

      def inline_assets?
        @inline_assets
      end
    end
  end
end
