0.11.0.beta1 (2020-01-05)
========

Changes ruby support to 2.4+, adds branch coverage support. Meant to be used with simplecov 0.18

## Breaking Changes
* Drops support for EOL'ed ruby versions, new support is ~> 2.4

## Enhancements
* Support/display of branch coverage from simplecov 0.18.0.beta1, little badges saying `hit_count, positive_or_negative` will appear next to lines if branch coverage is activated. `0, +` means positive branch was never hit, `2, -` means negative branch was hit twice
* Encoding compatibility errors are now caught and printed out

0.10.2 (2017-08-14)
========

## Bugfixes

* Allow usage with frozen-string-literal-enabled. See [#56](https://github.com/colszowka/simplecov-html/pull/56) (thanks @pat)

0.10.1 (2017-05-17)
========

## Bugfixes

* circumvent a regression that happens in the new JRuby 9.1.9.0 release. See [#53](https://github.com/colszowka/simplecov-html/pull/53) thanks @koic
