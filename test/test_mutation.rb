# frozen_string_literal: true

require "helper"

# Focused tests for mutation testing — exercises private methods directly.
# Uses cover() to explicitly tell mutant which methods each test covers.
class TestMutation < Minitest::Test
  cover "SimpleCov::Formatter::HTMLFormatter#coverage_css_class" if respond_to?(:cover)

  def test_coverage_css_class_green
    assert_equal "green", formatter.send(:coverage_css_class, 100)
    assert_equal "green", formatter.send(:coverage_css_class, 91)
    assert_equal "green", formatter.send(:coverage_css_class, 90.01)
  end

  def test_coverage_css_class_yellow
    assert_equal "yellow", formatter.send(:coverage_css_class, 90)
    assert_equal "yellow", formatter.send(:coverage_css_class, 81)
    assert_equal "yellow", formatter.send(:coverage_css_class, 80.01)
  end

  def test_coverage_css_class_red
    assert_equal "red", formatter.send(:coverage_css_class, 80)
    assert_equal "red", formatter.send(:coverage_css_class, 50)
    assert_equal "red", formatter.send(:coverage_css_class, 0)
  end

  cover "SimpleCov::Formatter::HTMLFormatter#strength_css_class" if respond_to?(:cover)

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

private

  def formatter
    @formatter ||= SimpleCov::Formatter::HTMLFormatter.new
  end
end
