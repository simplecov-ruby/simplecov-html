# frozen_string_literal: true

require "helper"

class TestSimpleCovHtml < Minitest::Test
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

  def test_output # rubocop:disable Metrics
    # Examples copied from simplecov's spec/source_file_spec.rb
    coverage_for_branches_rb = {
      "lines" => [1, 1, 1, nil, 1, nil, 1, 0, nil, 1, nil, nil, nil],
      "branches" => {
        [:if, 0, 3, 4, 3, 21] =>
        {[:then, 1, 3, 4, 3, 10] => 0, [:else, 2, 3, 4, 3, 21] => 1},
        [:if, 3, 5, 4, 5, 26] =>
        {[:then, 4, 5, 16, 5, 20] => 1, [:else, 5, 5, 23, 5, 26] => 0},
        [:if, 6, 7, 4, 11, 7] =>
        {[:then, 7, 8, 6, 8, 10] => 0, [:else, 8, 10, 6, 10, 9] => 1},
      },
    }
    coverage_for_sample_rb_with_more_lines = {
      "lines" => [nil, 1, 1, 1, nil, nil, 1, 0, nil, nil, nil, nil, nil, nil, nil, nil, nil],
    }
    coverage_for_inline = {
      "lines" => [1, 1, 1, nil, 1, 1, 0, nil, 1, nil, nil, nil, nil],
      "branches" => {
        [:if, 0, 3, 11, 3, 33] =>
        {[:then, 1, 3, 23, 3, 27] => 1, [:else, 2, 3, 30, 3, 33] => 0},
        [:if, 3, 6, 6, 10, 9] =>
        {[:then, 4, 7, 8, 7, 12] => 0, [:else, 5, 9, 8, 9, 11] => 1},
      },
    }
    coverage_for_never_rb = {"lines" => [nil, nil], "branches" => {}}
    coverage_for_nocov_complex_rb = {
      "lines" => [nil, nil, 1, 1, nil, 1, nil, nil, nil, 1, nil, nil, 1, nil, nil, 0, nil, 1, nil, 0, nil, nil, 1, nil, nil, nil, nil],
      "branches" => {
        [:if, 0, 6, 4, 11, 7] =>
        {[:then, 1, 7, 6, 7, 7] => 0, [:else, 2, 10, 6, 10, 7] => 1},
        [:if, 3, 13, 4, 13, 24] =>
        {[:then, 4, 13, 4, 13, 12] => 1, [:else, 5, 13, 4, 13, 24] => 0},
        [:while, 6, 16, 4, 16, 27] =>
        {[:body, 7, 16, 4, 16, 12] => 2},
        [:case, 8, 18, 4, 24, 7] => {
          [:when, 9, 20, 6, 20, 11] => 0,
          [:when, 10, 23, 6, 23, 10] => 1,
          [:else, 11, 18, 4, 24, 7] => 0,
        },
      },
    }
    coverage_for_nested_branches_rb = {
      "lines" => [nil, nil, 1, 1, 1, 1, 1, 1, nil, nil, 0, nil, nil, nil, nil],
      "branches" => {
        [:while, 0, 7, 8, 7, 31] =>
        {[:body, 1, 7, 8, 7, 16] => 2},
        [:if, 2, 6, 6, 9, 9] =>
        {[:then, 3, 7, 8, 8, 11] => 1, [:else, 4, 6, 6, 9, 9] => 0},
        [:if, 5, 5, 4, 12, 7] =>
        {[:then, 6, 6, 6, 9, 9] => 1, [:else, 7, 11, 6, 11, 11] => 0},
      },
    }
    coverage_for_case_statement_rb = {
      "lines" => [1, 1, 1, nil, 0, nil, 1, nil, 0, nil, 0, nil, nil, nil],
      "branches" => {
        [:case, 0, 3, 4, 12, 7] => {
          [:when, 1, 5, 6, 5, 10] => 0,
          [:when, 2, 7, 6, 7, 10] => 1,
          [:when, 3, 9, 6, 9, 10] => 0,
          [:else, 4, 11, 6, 11, 11] => 0,
        },
      },
    }
    coverage_for_case_without_else_statement_rb = {
      "lines" => [1, 1, 1, nil, 0, nil, 1, nil, 0, nil, nil, nil],
      "branches" => {
        [:case, 0, 3, 4, 10, 7] => {
          [:when, 1, 5, 6, 5, 10] => 0,
          [:when, 2, 7, 6, 7, 10] => 1,
          [:when, 3, 9, 6, 9, 10] => 0,
          [:else, 4, 3, 4, 10, 7] => 0,
        },
      },
    }
    coverage_for_elsif_rb = {
      "lines" => [1, 1, 1, 0, 1, 0, 1, 1, nil, 0, nil, nil, nil],
      "branches" => {
        [:if, 0, 7, 4, 10, 10] =>
        {[:then, 1, 8, 6, 8, 10] => 1, [:else, 2, 10, 6, 10, 10] => 0},
        [:if, 3, 5, 4, 10, 10] =>
        {[:then, 4, 6, 6, 6, 10] => 0, [:else, 5, 7, 4, 10, 10] => 1},
        [:if, 6, 3, 4, 11, 7] =>
        {[:then, 7, 4, 6, 4, 10] => 0, [:else, 8, 5, 4, 10, 10] => 1},
      },
    }
    coverage_for_branch_tester_rb = {
      "lines" => [nil, nil, 1, 1, nil, 1, nil, 1, 1, nil, nil, 1, 0, nil, nil, 1, 0, nil, 1, nil, nil, 1, 1, 1, nil, nil, 1, 0, nil, nil, 1, 1, nil, 0, nil, 1, 1, 0, 0, 1, 5, 0, 0, nil, 0, nil, 0, nil, nil, nil],
      "branches" => {
        [:if, 0, 4, 0, 4, 19] =>
        {[:then, 1, 4, 12, 4, 15] => 0, [:else, 2, 4, 18, 4, 19] => 1},
        [:unless, 3, 6, 0, 6, 23] =>
        {[:else, 4, 6, 0, 6, 23] => 0, [:then, 5, 6, 0, 6, 6] => 1},
        [:unless, 6, 8, 0, 10, 3] =>
        {[:else, 7, 8, 0, 10, 3] => 0, [:then, 8, 9, 2, 9, 14] => 1},
        [:unless, 9, 12, 0, 14, 3] =>
        {[:else, 10, 12, 0, 14, 3] => 1, [:then, 11, 13, 2, 13, 14] => 0},
        [:unless, 12, 16, 0, 20, 3] =>
        {[:else, 13, 19, 2, 19, 13] => 1, [:then, 14, 17, 2, 17, 14] => 0},
        [:if, 15, 22, 0, 22, 19] =>
        {[:then, 16, 22, 0, 22, 6] => 0, [:else, 17, 22, 0, 22, 19] => 1},
        [:if, 18, 23, 0, 25, 3] =>
        {[:then, 19, 24, 2, 24, 14] => 1, [:else, 20, 23, 0, 25, 3] => 0},
        [:if, 21, 27, 0, 29, 3] =>
        {[:then, 22, 28, 2, 28, 14] => 0, [:else, 23, 27, 0, 29, 3] => 1},
        [:if, 24, 31, 0, 35, 3] =>
        {[:then, 25, 32, 2, 32, 14] => 1, [:else, 26, 34, 2, 34, 13] => 0},
        [:if, 27, 42, 0, 47, 8] =>
        {[:then, 28, 43, 2, 45, 13] => 0, [:else, 29, 47, 2, 47, 8] => 0},
        [:if, 30, 40, 0, 47, 8] =>
        {[:then, 31, 41, 2, 41, 25] => 1, [:else, 32, 42, 0, 47, 8] => 0},
        [:if, 33, 37, 0, 48, 3] =>
        {[:then, 34, 38, 2, 39, 21] => 0, [:else, 35, 40, 0, 47, 8] => 1},
      },
    }
    coverage_for_single_nocov_rb = {
      "lines" => [nil, 1, 1, 1, 0, 1, 0, 1, 1, nil, 0, nil, nil, nil],
      "branches" => {
        [:if, 0, 8, 4, 11, 10] =>
        {[:then, 1, 9, 6, 9, 10] => 1, [:else, 2, 11, 6, 11, 10] => 0},
        [:if, 3, 6, 4, 11, 10] =>
        {[:then, 4, 7, 6, 7, 10] => 0, [:else, 5, 8, 4, 11, 10] => 1},
        [:if, 6, 4, 4, 12, 7] =>
        {[:then, 7, 5, 6, 5, 10] => 0, [:else, 8, 6, 4, 11, 10] => 1},
      },
    }
    coverage_for_uneven_nocov_rb = {
      "lines" => [1, 1, nil, 1, 0, 1, 0, nil, 1, 1, nil, nil, 0, nil, nil, nil],
      "branches" => {
        [:if, 0, 9, 4, 13, 10] =>
        {[:then, 1, 10, 6, 10, 10] => 1, [:else, 2, 13, 6, 13, 10] => 0},
        [:if, 3, 6, 4, 13, 10] =>
        {[:then, 4, 7, 6, 7, 10] => 0, [:else, 5, 9, 4, 13, 10] => 1},
        [:if, 6, 4, 4, 14, 7] =>
        {[:then, 7, 5, 6, 5, 10] => 0, [:else, 8, 6, 4, 13, 10] => 1},
      },
    }

    html_doc = format_results({
                                "branches.rb" => coverage_for_branches_rb,
                                "sample.rb" => coverage_for_sample_rb_with_more_lines,
                                "inline.rb" => coverage_for_inline,
                                "never.rb" => coverage_for_never_rb,
                                "nocov_complex.rb" => coverage_for_nocov_complex_rb,
                                "nested_branches.rb" => coverage_for_nested_branches_rb,
                                "case.rb" => coverage_for_case_statement_rb,
                                "case_without_else.rb" => coverage_for_case_without_else_statement_rb,
                                "elsif.rb" => coverage_for_elsif_rb,
                                "branch_tester_script.rb" => coverage_for_branch_tester_rb,
                                "single_nocov.rb" => coverage_for_single_nocov_rb,
                                "uneven_nocovs.rb" => coverage_for_uneven_nocov_rb,
                              })

    # All Files ( 74.12% covered at 0.84 hits/line )
    header_line_coverage = html_doc.at_css("div#AllFiles span.covered_percent span").content.strip

    assert_equal("74.12%", header_line_coverage)

    # 85 relevant lines, 63 lines covered and 22 lines missed. ( 74.12% )
    subheader_line_coverage = html_doc.at_css("div#AllFiles div.t-line-summary span:last-child").content.strip

    assert_equal("74.12%", subheader_line_coverage)

    # 58 total branches, 28 branches covered and 30 branches missed. ( 48.28% )
    subheader_branch_coverage = html_doc.at_css("div#AllFiles div.t-branch-summary span:last-child").content.strip

    assert_equal("48.28%", subheader_branch_coverage)

    sorted_line_coverages = [
      "57.14%",
      "64.29%",
      "66.67%",
      "66.67%",
      "80.00%",
      "85.71%",
      "85.71%",
      "85.71%",
      "100.00%",
      "100.00%",
      "100.00%",
      "100.00%",
    ]

    sorted_branch_coverages = [
      "25.00%",
      "25.00%",
      "45.83%",
      "50.00%",
      "50.00%",
      "50.00%",
      "60.00%",
      "75.00%",
      "100.00%",
      "100.00%",
      "100.00%",
      "100.00%",
    ]

    # % covered
    all_files_table_line_coverages = html_doc.css("div#AllFiles table.file_list tr.t-file td.t-file__coverage").map { |m| m.content.strip }

    assert_equal(sorted_line_coverages, all_files_table_line_coverages.sort_by(&:to_f))

    # Branch Coverage
    all_files_table_branch_coverages = html_doc.css("div#AllFiles table.file_list tr.t-file td.t-file__branch-coverage").map { |m| m.content.strip }

    assert_equal sorted_branch_coverages, all_files_table_branch_coverages.sort_by(&:to_f)

    # 66.67 lines covered
    single_file_page_line_coverages = html_doc.css("div.source_files div.header h4:nth-child(2) span").map { |m| m.content.strip }

    assert_equal(sorted_line_coverages, single_file_page_line_coverages.sort_by(&:to_f))

    # 25.0% branches covered
    single_file_page_branch_coverages = html_doc.css("div.source_files div.header h4:nth-child(3) span").map { |m| m.content.strip }

    assert_equal sorted_branch_coverages, single_file_page_branch_coverages.sort_by(&:to_f)
  end

private

  def format_results(coverage_results)
    coverage_results = coverage_results.to_h do |fixture_file_name, coverage|
      [fixtures_path.join(fixture_file_name).to_s, coverage]
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
