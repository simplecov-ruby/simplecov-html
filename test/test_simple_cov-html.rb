# frozen_string_literal: true

require "helper"
require "coverage_fixtures"

class TestSimpleCovHtml < Minitest::Test
  EXPECTED_LINE_COVERAGES = %w[
    57.14% 64.28% 66.66% 66.66% 80.00% 85.71%
    85.71% 85.71% 100.00% 100.00% 100.00% 100.00%
  ].freeze

  EXPECTED_BRANCH_COVERAGES = %w[
    25.00% 25.00% 45.83% 50.00% 50.00% 50.00%
    60.00% 75.00% 100.00% 100.00% 100.00% 100.00%
  ].freeze

  def setup
    SimpleCov.coverage_dir(output_path)
    SimpleCov.enable_coverage(:branch)
  end

  def teardown
    SimpleCov.coverage_dir(nil)
    SimpleCov.clear_coverage_criteria
  end

  def test_defined
    assert defined?(SimpleCov::Formatter::HTMLFormatter::VERSION)
  end

  def test_output
    html_doc = format_results(CoverageFixtures::ALL_FIXTURES)

    assert_header_coverage(html_doc)
    assert_line_coverages(html_doc)
    assert_branch_coverages(html_doc) if RUBY_ENGINE != "jruby"
  end

private

  def assert_header_coverage(html_doc)
    header_line_coverage = html_doc.at_css("div#AllFiles span.covered_percent span").content.strip

    assert_equal("74.11%", header_line_coverage)

    subheader_line_coverage = html_doc.at_css("div#AllFiles div.t-line-summary span:last-child").content.strip

    assert_equal("74.11%", subheader_line_coverage)

    return if RUBY_ENGINE == "jruby"

    subheader_branch_coverage = html_doc.at_css("div#AllFiles div.t-branch-summary span:last-child").content.strip

    assert_equal("48.27%", subheader_branch_coverage)
  end

  def assert_line_coverages(html_doc)
    table_coverages = html_doc.css("div#AllFiles table.file_list tr.t-file td.t-file__coverage").map { |m| m.content.strip }

    assert_equal(EXPECTED_LINE_COVERAGES, table_coverages.sort_by(&:to_f))

    page_coverages = html_doc.css("div.source_files div.header h4:nth-child(2) span").map { |m| m.content.strip }

    assert_equal(EXPECTED_LINE_COVERAGES, page_coverages.sort_by(&:to_f))
  end

  def assert_branch_coverages(html_doc)
    table_coverages = html_doc.css("div#AllFiles table.file_list tr.t-file td.t-file__branch-coverage").map { |m| m.content.strip }

    assert_equal(EXPECTED_BRANCH_COVERAGES, table_coverages.sort_by(&:to_f))

    page_coverages = html_doc.css("div.source_files div.header h4:nth-child(3) span").map { |m| m.content.strip }

    assert_equal(EXPECTED_BRANCH_COVERAGES, page_coverages.sort_by(&:to_f))
  end

  def format_results(coverage_results)
    coverage_results = coverage_results.transform_keys do |fixture_file_name|
      fixtures_path.join(fixture_file_name).to_s
    end
    result = SimpleCov::Result.new(coverage_results)
    capture_io { SimpleCov::Formatter::HTMLFormatter.new.format(result) }

    # Return an HTML doc instance
    output_path.join("index.html").open { |f| Nokogiri::HTML(f) }
  end

  def output_path
    Pathname.new(__dir__).parent.join("tmp", "test_output")
  end

  def fixtures_path
    Pathname.new(__dir__).join("fixtures")
  end
end
