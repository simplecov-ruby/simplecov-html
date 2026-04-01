Default HTML formatter for SimpleCov
====================================

***Note: To learn more about SimpleCov, check out the main repo at https://github.com/simplecov-ruby/simplecov***

Generates an HTML report of your SimpleCov Ruby code coverage results with interactive sorting, filtering, and syntax-highlighted source views.

Setup
-----

```bash
bin/setup
```

This installs both Ruby and Node dependencies. Node dependencies (esbuild, TypeScript, highlight.js) are only needed for development.

Development
-----------

Run the test suite:

```bash
bundle exec rake
```

If you modify the TypeScript or CSS assets, recompile them:

```bash
bundle exec rake assets:compile
```

Type-check the TypeScript:

```bash
bun run typecheck
```

Copyright
---------

Copyright (c) 2010-2026 Christoph Olszowka and Erik Berlin. See LICENSE for details.
