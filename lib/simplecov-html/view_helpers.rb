# frozen_string_literal: true

require "digest/md5"
require "set"

module SimpleCov
  module Formatter
    class HTMLFormatter
      # Helper methods used by ERB templates for rendering coverage data.
      module ViewHelpers # rubocop:disable Metrics/ModuleLength
        def line_status?(source_file, line)
          if branch_coverage? && source_file.line_with_missed_branch?(line.number)
            "missed-branch"
          # :nocov:
          elsif method_coverage? && missed_method_lines(source_file).include?(line.number)
            "missed-method"
          # :nocov:
          else
            line.status
          end
        end

        # :nocov:
        def missed_method_lines(source_file)
          @missed_method_lines ||= {}
          @missed_method_lines[source_file.filename] ||= missed_method_line_set(source_file)
        end

        def missed_method_line_set(source_file)
          source_file.missed_methods
                     .select { |m| m.start_line && m.end_line }
                     .flat_map { |m| (m.start_line..m.end_line).to_a }
                     .to_set
        end
        # :nocov:

        def coverage_css_class(covered_percent)
          if covered_percent >= 90
            "green"
          elsif covered_percent >= 75
            "yellow"
          else
            "red"
          end
        end

        def id(source_file)
          Digest::MD5.hexdigest(source_file.filename)
        end

        def timeago(time)
          "<abbr class=\"timeago\" title=\"#{time.iso8601}\">#{time.iso8601}</abbr>"
        end

        def shortened_filename(source_file)
          source_file.filename.sub(SimpleCov.root, ".").delete_prefix("./")
        end

        def link_to_source_file(source_file)
          name = shortened_filename(source_file)
          %(<a href="##{id source_file}" class="src_link" title="#{name}">#{name}</a>)
        end

        def covered_percent(percent)
          template("covered_percent").result(binding)
        end

        def to_id(value)
          value.sub(/\A[^a-zA-Z]+/, "").gsub(/[^a-zA-Z0-9\-_]/, "")
        end

        def fmt(number)
          number.to_s.gsub(/(\d)(?=(\d{3})+(?!\d))/, '\\1,')
        end

        def coverage_bar(pct)
          css = coverage_css_class(pct)
          width = Kernel.format("%.1f", pct.floor(1))
          %(<div class="coverage-bar"><div class="coverage-bar__fill coverage-bar__fill--#{css}" style="width: #{width}%"></div></div>)
        end

        def coverage_cells(pct, covered, total, type:, totals: false) # rubocop:disable Metrics/MethodLength
          css = coverage_css_class(pct)
          if totals
            bar_cls = "cell--bar t-totals__#{type}-bar"
            pct_cls = "cell--pct strong t-totals__#{type}-pct #{css}"
            num_cls = "cell--numerator strong t-totals__#{type}-num"
            den_cls = "cell--denominator strong t-totals__#{type}-den"
          else
            bar_cls = "cell--bar"
            pct_cls = "cell--pct cell--#{type}-pct #{css}"
            num_cls = "cell--numerator"
            den_cls = "cell--denominator"
          end
          pct_str = Kernel.format("%.2f", pct.floor(2))
          pct_td = if totals
                     %(<td class="#{pct_cls}">#{pct_str}%</td>)
                   else
                     %(<td class="#{pct_cls}" data-order="#{Kernel.format('%.2f', pct)}">#{pct_str}%</td>)
                   end
          %(<td class="#{bar_cls}">#{coverage_bar(pct)}</td>) +
            pct_td +
            %(<td class="#{num_cls}">#{fmt(covered)}/</td>) +
            %(<td class="#{den_cls}">#{fmt(total)}</td>)
        end

        def coverage_header_cells(label, type, covered_label, total_label)
          <<~HTML
            <th class="cell--coverage" colspan="2">
              <div class="th-with-filter">
                <span class="th-label">#{label}</span>
                <div class="col-filter__coverage">
                  <select class="col-filter__op" data-type="#{type}"><option value="lt">&lt;</option><option value="lte" selected>&le;</option><option value="eq">=</option><option value="gte">&ge;</option><option value="gt">&gt;</option></select>
                  <span class="col-filter__pct-wrap"><input type="number" class="col-filter__value" min="0" max="100" data-type="#{type}" value="100" step="any"></span>
                </div>
              </div>
            </th>
            <th class="cell--numerator">#{covered_label}</th>
            <th class="cell--denominator">#{total_label}</th>
          HTML
        end

        def file_data_attrs(source_file) # rubocop:disable Metrics/AbcSize
          covered = source_file.covered_lines.count
          relevant = covered + source_file.missed_lines.count
          pairs = {"covered-lines" => covered, "relevant-lines" => relevant}
          pairs["covered-branches"] = source_file.covered_branches.count if branch_coverage?
          pairs["total-branches"] = source_file.total_branches.count if branch_coverage?
          pairs["covered-methods"] = source_file.covered_methods.count if method_coverage?
          pairs["total-methods"] = source_file.methods.count if method_coverage?
          pairs.map { |k, v| %(data-#{k}="#{v}") }.join(" ")
        end

        def coverage_type_summary(type, label, summary, enabled:, **opts) # rubocop:disable Metrics/AbcSize, Metrics/MethodLength
          return disabled_summary(type, label) unless enabled

          s = summary.fetch(type.to_sym)
          pct = s.fetch(:pct)
          covered = s.fetch(:covered)
          total = s.fetch(:total)
          missed = s.fetch(:missed)
          css = coverage_css_class(pct)
          parts = [
            %(<div class="t-#{type}-summary">\n    #{label}: ),
            %(<span class="#{css}"><b>#{Kernel.format('%.2f', pct.floor(2))}%</b></span>),
            %(<span class="coverage-cell__fraction"> #{covered}/#{total} #{opts.fetch(:suffix, 'covered')}</span>),
          ]
          parts << missed_summary_html(missed, opts.fetch(:missed_class, "red"), opts.fetch(:toggle, false)) if missed.positive?
          parts << "\n  </div>"
          parts.join
        end

        def coverage_summary(stats, show_method_toggle: false)
          _summary = {
            line: build_stats(stats.fetch(:covered_lines), stats.fetch(:total_lines)),
            branch: build_stats(stats.fetch(:covered_branches, 0), stats.fetch(:total_branches, 0)),
            method: build_stats(stats.fetch(:covered_methods, 0), stats.fetch(:total_methods, 0)),
            show_method_toggle: show_method_toggle,
          }
          template("coverage_summary").result(binding)
        end

        def build_stats(covered, total)
          pct = total.positive? ? (covered * 100.0 / total) : 100.0
          {covered: covered, total: total, missed: total - covered, pct: pct}
        end

      private

        def disabled_summary(type, label)
          %(<div class="t-#{type}-summary">\n    #{label}: <span class="coverage-disabled">disabled</span>\n  </div>)
        end

        def missed_summary_html(count, missed_class, toggle)
          missed = if toggle
                     %(<a href="#" class="t-missed-method-toggle"><b>#{count}</b> missed</a>)
                   else
                     %(<span class="#{missed_class}"><b>#{count}</b> missed</span>)
                   end
          %(<span class="coverage-cell__fraction">,</span>\n    #{missed})
        end
      end
    end
  end
end
