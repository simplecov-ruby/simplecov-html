# frozen_string_literal: true

require "English"
require "helper"
require "coverage_fixtures"
require "set"

class TestViewHelpers < Minitest::Test
  cover "SimpleCov::Formatter::HTMLFormatter::ViewHelpers#coverage_css_class" if respond_to?(:cover)

  def test_coverage_css_class_green
    assert_equal "green", formatter.send(:coverage_css_class, 100)
    assert_equal "green", formatter.send(:coverage_css_class, 91)
    assert_equal "green", formatter.send(:coverage_css_class, 90)
  end

  def test_coverage_css_class_yellow
    assert_equal "yellow", formatter.send(:coverage_css_class, 89.99)
    assert_equal "yellow", formatter.send(:coverage_css_class, 76)
    assert_equal "yellow", formatter.send(:coverage_css_class, 75)
  end

  def test_coverage_css_class_red
    assert_equal "red", formatter.send(:coverage_css_class, 74.99)
    assert_equal "red", formatter.send(:coverage_css_class, 50)
    assert_equal "red", formatter.send(:coverage_css_class, 0)
  end

  cover "SimpleCov::Formatter::HTMLFormatter::ViewHelpers#strength_css_class" if respond_to?(:cover)

  def test_strength_css_class_green
    assert_equal "green", formatter.send(:strength_css_class, 2)
    assert_equal "green", formatter.send(:strength_css_class, 1.01)
  end

  def test_strength_css_class_yellow
    assert_equal "yellow", formatter.send(:strength_css_class, 1)
    assert_equal "yellow", formatter.send(:strength_css_class, 1.0)
  end

  def test_strength_css_class_red
    assert_equal "red", formatter.send(:strength_css_class, 0.99)
    assert_equal "red", formatter.send(:strength_css_class, 0)
  end

  cover "SimpleCov::Formatter::HTMLFormatter::ViewHelpers#id" if respond_to?(:cover)

  def test_id_returns_sha1_hexdigest_of_filename
    source_file = stub_source_file("/path/to/file.rb")
    result = formatter.send(:id, source_file)

    assert_equal Digest::SHA1.hexdigest("/path/to/file.rb"), result
  end

  def test_id_different_filenames_produce_different_ids
    file_a = stub_source_file("/a.rb")
    file_b = stub_source_file("/b.rb")

    refute_equal formatter.send(:id, file_a), formatter.send(:id, file_b)
  end

  cover "SimpleCov::Formatter::HTMLFormatter::ViewHelpers#timeago" if respond_to?(:cover)

  def test_timeago_generates_abbr_tag_with_iso8601
    time = Time.new(2026, 1, 15, 10, 30, 0)
    result = formatter.send(:timeago, time)

    assert_includes result, "<abbr"
    assert_includes result, 'class="timeago"'
    assert_includes result, "title=\"#{time.iso8601}\""
    assert_includes result, ">#{time.iso8601}</abbr>"
  end

  def test_timeago_uses_iso8601_in_both_title_and_content
    time = Time.new(2025, 6, 1, 12, 0, 0)
    result = formatter.send(:timeago, time)
    iso = time.iso8601

    assert_equal "<abbr class=\"timeago\" title=\"#{iso}\">#{iso}</abbr>", result
  end

  cover "SimpleCov::Formatter::HTMLFormatter::ViewHelpers#shortened_filename" if respond_to?(:cover)

  def test_shortened_filename_removes_root
    source_file = stub_source_file("#{SimpleCov.root}/lib/foo.rb")

    assert_equal "lib/foo.rb", formatter.send(:shortened_filename, source_file)
  end

  def test_shortened_filename_strips_dot_slash_prefix
    source_file = stub_source_file("#{SimpleCov.root}/bar.rb")
    result = formatter.send(:shortened_filename, source_file)

    refute result.start_with?("./"), "Expected no leading ./ but got: #{result}"
    assert_equal "bar.rb", result
  end

  cover "SimpleCov::Formatter::HTMLFormatter::ViewHelpers#link_to_source_file" if respond_to?(:cover)

  def test_link_to_source_file_generates_anchor
    source_file = stub_source_file("#{SimpleCov.root}/lib/foo.rb")
    result = formatter.send(:link_to_source_file, source_file)

    assert_includes result, "src_link"
    assert_includes result, "href=\"##{Digest::SHA1.hexdigest(source_file.filename)}\""
    assert_includes result, "title=\"lib/foo.rb\""
    assert_includes result, ">lib/foo.rb</a>"
  end

  cover "SimpleCov::Formatter::HTMLFormatter::ViewHelpers#to_id" if respond_to?(:cover)

  def test_to_id_strips_leading_non_alpha
    assert_equal "abc", formatter.send(:to_id, "123abc")
    assert_equal "abc", formatter.send(:to_id, "---abc")
    assert_equal "a", formatter.send(:to_id, "a")
  end

  def test_to_id_strips_invalid_chars
    assert_equal "ab-c_d", formatter.send(:to_id, "ab-c_d!@#")
    assert_equal "abc", formatter.send(:to_id, "a.b.c")
  end

  def test_to_id_preserves_valid_ids
    assert_equal "AllFiles", formatter.send(:to_id, "AllFiles")
    assert_equal "my-group_1", formatter.send(:to_id, "my-group_1")
  end

  def test_to_id_returns_empty_for_all_invalid
    assert_equal "", formatter.send(:to_id, "123")
    assert_equal "", formatter.send(:to_id, "!@#")
  end

  cover "SimpleCov::Formatter::HTMLFormatter::ViewHelpers#build_stats" if respond_to?(:cover)

  def test_build_stats_basic
    stats = formatter.send(:build_stats, 80, 100)

    assert_equal 80, stats[:covered]
    assert_equal 100, stats[:total]
    assert_equal 20, stats[:missed]
    assert_in_delta 80.0, stats[:pct], 0.01
  end

  def test_build_stats_zero_total
    stats = formatter.send(:build_stats, 0, 0)

    assert_equal 0, stats[:covered]
    assert_equal 0, stats[:total]
    assert_equal 0, stats[:missed]
    assert_in_delta 100.0, stats[:pct], 0.01
  end

  def test_build_stats_full_coverage
    stats = formatter.send(:build_stats, 50, 50)

    assert_equal 0, stats[:missed]
    assert_in_delta 100.0, stats[:pct], 0.01
  end

  def test_build_stats_no_coverage
    stats = formatter.send(:build_stats, 0, 100)

    assert_equal 100, stats[:missed]
    assert_in_delta 0.0, stats[:pct], 0.01
  end

  def test_build_stats_returns_hash_with_four_keys
    stats = formatter.send(:build_stats, 3, 7)

    assert_equal %i[covered missed pct total], stats.keys.sort
  end

  cover "SimpleCov::Formatter::HTMLFormatter::ViewHelpers#line_status?" if respond_to?(:cover)

  def test_line_status_missed_branch
    set_coverage_flags(branch: true, method: false)

    source_file = stub_line_source(missed_branch_lines: [5])
    line = stub_line(5)

    assert_equal "missed-branch", formatter.send(:line_status?, source_file, line)
  end

  def test_line_status_no_missed_branch_returns_line_status
    set_coverage_flags(branch: true, method: false)

    source_file = stub_line_source(missed_branch_lines: [])
    line = stub_line(10, "covered")

    assert_equal "covered", formatter.send(:line_status?, source_file, line)
  end

  def test_line_status_without_branch_coverage_returns_line_status
    set_coverage_flags(branch: false, method: false)

    line = stub_line(1, "never")

    assert_equal "never", formatter.send(:line_status?, nil, line)
  end

  def test_line_status_missed_method
    set_coverage_flags(branch: false, method: true)

    source_file = stub_method_source("test.rb", missed_lines: [5, 6, 7])
    line = stub_line(6, "covered")

    assert_equal "missed-method", formatter.send(:line_status?, source_file, line)
  end

  def test_line_status_method_coverage_not_missed
    set_coverage_flags(branch: false, method: true)

    source_file = stub_method_source("test.rb", missed_lines: [5, 6, 7])
    line = stub_line(10, "covered")

    assert_equal "covered", formatter.send(:line_status?, source_file, line)
  end

  def test_line_status_branch_takes_priority_over_method
    set_coverage_flags(branch: true, method: true)

    source_file = stub_branch_priority_source
    line = stub_line(5)

    assert_equal "missed-branch", formatter.send(:line_status?, source_file, line)
  end

  cover "SimpleCov::Formatter::HTMLFormatter::ViewHelpers#coverage_summary" if respond_to?(:cover)

  def test_coverage_summary_renders_line_stats
    result = render_summary(covered_lines: 80, total_lines: 100)

    assert_includes result, "Line coverage:"
    assert_includes result, "80.00%"
  end

  def test_coverage_summary_renders_branch_stats
    f = new_formatter_with(branch: true)
    result = f.send(:coverage_summary, full_stats)

    assert_includes result, "Branch coverage:"
  end

  def test_coverage_summary_shows_branch_disabled_when_no_branch_coverage
    f = new_formatter_with(branch: false)
    result = f.send(:coverage_summary, zero_stats(covered_lines: 80, total_lines: 100))

    assert_includes result, "disabled"
  end

  def test_coverage_summary_defaults_branch_and_method_to_zero
    f = new_formatter_with(branch: true, method: true)
    result = f.send(:coverage_summary, {covered_lines: 80, total_lines: 100})

    assert_includes result, "Line coverage:"
    assert_includes result, "Branch coverage:"
    assert_includes result, "Method coverage:"
    assert_match(/Branch coverage:.*100.00%/m, result)
    assert_match(/Method coverage:.*100.00%/m, result)
  end

  def test_coverage_summary_with_show_method_toggle_true
    f = new_formatter_with(method: true)
    result = f.send(:coverage_summary, method_stats, show_method_toggle: true)

    assert_includes result, "t-missed-method-toggle"
  end

  def test_coverage_summary_with_show_method_toggle_false
    f = new_formatter_with(method: true)
    result = f.send(:coverage_summary, method_stats, show_method_toggle: false)

    refute_includes result, "t-missed-method-toggle"
  end

  def test_coverage_summary_default_show_method_toggle_is_false
    f = new_formatter_with(method: true)
    result = f.send(:coverage_summary, method_stats)

    refute_includes result, "t-missed-method-toggle"
    assert_includes result, "missed-method-text-color"
  end

  def test_coverage_summary_shows_missed_lines_when_present
    result = render_summary(covered_lines: 80, total_lines: 100)

    assert_includes result, "20"
    assert_includes result, "missed"
  end

  def test_coverage_summary_hides_missed_when_zero
    result = render_summary(covered_lines: 100, total_lines: 100)

    refute_match(%r{<span class="red"><b>0</b> missed</span>}, result)
  end

  def test_coverage_summary_shows_method_disabled_when_no_method_coverage
    f = new_formatter_with(method: false)
    result = f.send(:coverage_summary, zero_stats(covered_lines: 80, total_lines: 100))

    assert_match(/Method coverage:.*disabled/m, result)
  end

  def test_coverage_summary_with_all_coverages_enabled
    f = new_formatter_with(branch: true, method: true)
    result = f.send(:coverage_summary, full_stats)

    assert_includes result, "Line coverage:"
    assert_includes result, "Branch coverage:"
    assert_includes result, "Method coverage:"
  end

  def test_coverage_summary_passes_stats_to_template
    f = new_formatter_with(branch: false, method: false)
    result = f.send(:coverage_summary, zero_stats(covered_lines: 42, total_lines: 50))

    assert_includes result, "42"
    assert_includes result, "50"
  end

  def test_coverage_summary_uses_build_stats_for_line
    f = new_formatter_with(branch: false, method: false)
    result = f.send(:coverage_summary, {covered_lines: 75, total_lines: 100})

    assert_includes result, "75.00%"
    assert_includes result, "75"
    assert_includes result, "100"
  end

  def test_coverage_summary_uses_build_stats_for_branches
    f = new_formatter_with(branch: true)
    result = f.send(:coverage_summary, {
                      covered_lines: 80, total_lines: 100,
                      covered_branches: 6, total_branches: 8
                    })

    assert_includes result, "75.00%"
    assert_includes result, "6"
    assert_includes result, "8"
  end

  def test_coverage_summary_uses_build_stats_for_methods
    f = new_formatter_with(method: true)
    result = f.send(:coverage_summary, {
                      covered_lines: 80, total_lines: 100,
                      covered_methods: 3, total_methods: 4
                    })

    assert_includes result, "75.00%"
    assert_includes result, "3"
    assert_includes result, "4"
  end

  def test_coverage_summary_fetch_defaults_branch_covered_to_zero
    f = new_formatter_with(branch: true, method: false)
    result = f.send(:coverage_summary, {
                      covered_lines: 80, total_lines: 100,
                      total_branches: 10
                    })

    assert_includes result, "0/10 covered"
  end

  def test_coverage_summary_fetch_defaults_branch_total_to_zero
    f = new_formatter_with(branch: true, method: false)
    result = f.send(:coverage_summary, {
                      covered_lines: 80, total_lines: 100,
                      covered_branches: 0
                    })

    assert_includes result, "0/0 covered"
  end

  def test_coverage_summary_fetch_defaults_method_covered_to_zero
    f = new_formatter_with(branch: false, method: true)
    result = f.send(:coverage_summary, {
                      covered_lines: 80, total_lines: 100,
                      total_methods: 10
                    })

    assert_includes result, "0/10 covered"
  end

  def test_coverage_summary_fetch_defaults_method_total_to_zero
    f = new_formatter_with(branch: false, method: true)
    result = f.send(:coverage_summary, {
                      covered_lines: 80, total_lines: 100,
                      covered_methods: 0
                    })

    assert_includes result, "0/0 covered"
  end

  def test_coverage_summary_branch_missed_shown_when_nonzero
    f = new_formatter_with(branch: true)
    result = f.send(:coverage_summary, {
                      covered_lines: 80, total_lines: 100,
                      covered_branches: 5, total_branches: 10,
                      covered_methods: 0, total_methods: 0
                    })

    assert_includes result, "missed-branch-text"
    assert_includes result, "5"
  end

  def test_coverage_summary_method_missed_shown_when_nonzero_no_toggle
    f = new_formatter_with(method: true)
    result = f.send(:coverage_summary, {
                      covered_lines: 80, total_lines: 100,
                      covered_branches: 0, total_branches: 0,
                      covered_methods: 3, total_methods: 10
                    }, show_method_toggle: false)

    assert_includes result, "missed-method-text-color"
    assert_includes result, "7"
  end

  cover "SimpleCov::Formatter::HTMLFormatter::ViewHelpers#covered_percent" if respond_to?(:cover)

  def test_covered_percent_renders_template
    result = formatter.send(:covered_percent, 85.5)

    assert_includes result, "85.50%"
  end

  def test_covered_percent_renders_green_for_high
    result = formatter.send(:covered_percent, 95.0)

    assert_includes result, "green"
    assert_includes result, "95.00%"
  end

  def test_covered_percent_renders_yellow_for_medium
    result = formatter.send(:covered_percent, 80.0)

    assert_includes result, "yellow"
    assert_includes result, "80.00%"
  end

  def test_covered_percent_renders_red_for_low
    result = formatter.send(:covered_percent, 50.0)

    assert_includes result, "red"
    assert_includes result, "50.00%"
  end

  def test_covered_percent_zero
    result = formatter.send(:covered_percent, 0.0)

    assert_includes result, "0.00%"
    assert_includes result, "red"
  end

  def test_covered_percent_hundred
    result = formatter.send(:covered_percent, 100.0)

    assert_includes result, "100.00%"
    assert_includes result, "green"
  end

  def test_covered_percent_uses_floor_with_two_decimals
    result = formatter.send(:covered_percent, 85.999)

    assert_includes result, "85.99%"
  end

  cover "SimpleCov::Formatter::HTMLFormatter::ViewHelpers#missed_method_line_set" if respond_to?(:cover)

  def test_missed_method_line_set_returns_set_of_line_numbers
    source_file = stub_method_source("test.rb", missed_lines: [5, 10])
    result = formatter.send(:missed_method_line_set, source_file)

    assert_instance_of Set, result
    assert_equal Set[5, 6, 7, 8, 9, 10], result
  end

  def test_missed_method_line_set_empty_when_no_missed_methods
    source_file = Object.new
    source_file.define_singleton_method(:missed_methods) { [] }
    result = formatter.send(:missed_method_line_set, source_file)

    assert_instance_of Set, result
    assert_empty result
  end

  def test_missed_method_line_set_multiple_methods
    result = formatter.send(:missed_method_line_set, two_method_source(5, 7, 20, 22))

    assert_equal Set[5, 6, 7, 20, 21, 22], result
  end

  def test_missed_method_line_set_skips_methods_with_nil_start_line
    result = formatter.send(:missed_method_line_set, two_method_source(nil, 7, 20, 22))

    assert_equal Set[20, 21, 22], result
  end

  def test_missed_method_line_set_skips_methods_with_nil_end_line
    result = formatter.send(:missed_method_line_set, two_method_source(5, nil, 20, 22))

    assert_equal Set[20, 21, 22], result
  end

  def test_missed_method_line_set_single_line_method
    source_file = single_method_source(5, 5)
    result = formatter.send(:missed_method_line_set, source_file)

    assert_equal Set[5], result
  end

private

  def formatter
    @formatter ||= SimpleCov::Formatter::HTMLFormatter.new
  end

  def stub_source_file(filename)
    obj = Object.new
    obj.define_singleton_method(:filename) { filename }
    obj
  end

  def stub_line(number, status = nil)
    obj = Object.new
    obj.define_singleton_method(:number) { number }
    obj.define_singleton_method(:status) { status } if status
    obj
  end

  def stub_line_source(missed_branch_lines:)
    obj = Object.new
    obj.define_singleton_method(:line_with_missed_branch?) { |n| missed_branch_lines.include?(n) }
    obj
  end

  def stub_method_source(filename, missed_lines:)
    missed_method = make_method_stub(missed_lines.first, missed_lines.last)
    obj = Object.new
    obj.define_singleton_method(:filename) { filename }
    obj.define_singleton_method(:missed_methods) { [missed_method] }
    obj
  end

  def stub_branch_priority_source
    obj = Object.new
    obj.define_singleton_method(:line_with_missed_branch?) { |_n| true }
    obj.define_singleton_method(:filename) { "priority.rb" }
    obj
  end

  def set_coverage_flags(branch: false, method: false)
    formatter.instance_variable_set(:@branch_coverage, branch)
    formatter.instance_variable_set(:@method_coverage, method)
  end

  def new_formatter_with(branch: nil, method: nil)
    f = SimpleCov::Formatter::HTMLFormatter.new
    f.instance_variable_set(:@branch_coverage, branch) unless branch.nil?
    f.instance_variable_set(:@method_coverage, method) unless method.nil?
    f
  end

  def render_summary(covered_lines:, total_lines:)
    f = SimpleCov::Formatter::HTMLFormatter.new
    f.send(:coverage_summary, zero_stats(covered_lines: covered_lines, total_lines: total_lines))
  end

  def full_stats
    {
      covered_lines: 80, total_lines: 100,
      covered_branches: 10, total_branches: 20,
      covered_methods: 5, total_methods: 10
    }
  end

  def zero_stats(covered_lines: 0, total_lines: 0)
    {
      covered_lines: covered_lines, total_lines: total_lines,
      covered_branches: 0, total_branches: 0,
      covered_methods: 0, total_methods: 0
    }
  end

  def method_stats
    {
      covered_lines: 80, total_lines: 100,
      covered_branches: 0, total_branches: 0,
      covered_methods: 5, total_methods: 10
    }
  end

  def make_method_stub(start_line, end_line)
    m = Object.new
    m.define_singleton_method(:start_line) { start_line }
    m.define_singleton_method(:end_line) { end_line }
    m
  end

  def two_method_source(start1, end1, start2, end2)
    m1 = make_method_stub(start1, end1)
    m2 = make_method_stub(start2, end2)
    obj = Object.new
    obj.define_singleton_method(:missed_methods) { [m1, m2] }
    obj
  end

  def single_method_source(start_line, end_line)
    m1 = make_method_stub(start_line, end_line)
    obj = Object.new
    obj.define_singleton_method(:missed_methods) { [m1] }
    obj
  end
end
