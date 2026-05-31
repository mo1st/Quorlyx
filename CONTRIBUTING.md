# Contributing

Thanks for helping improve Quorlyx. The best contributions are specific, reproducible, and easy to review.

## Good First Contributions

- Fix typos or unclear setup docs.
- Add screenshots or GIFs for existing features.
- Improve Knowledge Base examples.
- Add WooCommerce setup recipes.
- Reproduce and document bugs with exact steps.
- Improve sanitization, escaping, accessibility, or performance in a focused area.

## Before Opening A Pull Request

1. Fork the repository.
2. Create a focused branch.
3. Keep the change small enough to review.
4. Do not commit API keys, private URLs, customer conversations, exports, or local `wp-config.php` files.
5. Run PHP syntax checks on edited PHP files:

```bash
php -l quorlyx.php
```

6. Describe what changed, why it changed, and how you tested it.

## Bug Reports

Include:

- WordPress version.
- PHP version.
- Quorlyx version.
- Browser and device if frontend-related.
- AI provider used, without sharing the API key.
- Steps to reproduce.
- Expected result.
- Actual result.
- Screenshots or logs when useful.

## Feature Requests

Explain:

- The workflow you are trying to improve.
- Who needs it: store owner, agency, developer, content team, support team, or marketplace operator.
- What the expected behavior should be.
- Any related WooCommerce, CRM, webhook, or AI-provider context.

## Code Style

- Prefer WordPress core APIs.
- Escape output.
- Sanitize input.
- Keep admin and frontend behavior predictable.
- Avoid adding new dependencies unless the benefit is clear.
- Keep unrelated refactors out of feature or bugfix PRs.
