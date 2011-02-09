require 'helper'

class TestSimpleCovHtml < Test::Unit::TestCase
  should "be defined" do
    assert defined?(SimpleCov::Formatter::HTMLFormatter)
    assert defined?(SimpleCov::Formatter::HTMLFormatter::VERSION)
  end
end
