# Security

## Reporting A Vulnerability

Please do not open a public issue for a serious security vulnerability.

Report it privately through the project owner or the contact channel listed on:

`https://quorlyx.dev`

Include:

- A short summary.
- Affected Quorlyx version.
- WordPress and PHP versions.
- Reproduction steps.
- Impact.
- Suggested fix, if you have one.

## What Not To Share Publicly

Do not publish:

- AI provider API keys.
- Webhook secrets.
- Customer conversations.
- WooCommerce order/customer exports.
- Private site URLs that should not be public.
- `wp-config.php` files.
- Database dumps.

## Security Expectations

- Quorlyx should sanitize input and escape output.
- Admin actions should use capabilities and nonces.
- External requests should avoid leaking private site data.
- The plugin should not add hidden install/domain tracking.
- Secrets should stay in the WordPress site owner's environment.

## Supported Versions

Security fixes target the latest public GitHub release.
