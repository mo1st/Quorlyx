=== Quorlyx ===
Contributors: mouhcine1st
Tags: ai, chatbot, woocommerce, automation, analytics
Requires at least: 6.0
Tested up to: 6.5
Requires PHP: 7.4
Stable tag: 2.2.5
License: GPL-2.0-or-later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Free open-source AI chatbot and behavior automation plugin for WordPress and WooCommerce.

== Description ==

Quorlyx helps WordPress and WooCommerce sites use BYOK AI chat, behavior-based triggers, Knowledge Base context, Content Insights, conversion goals, A/B testing, SEO tools, WooCommerce automation, and GitHub updates.

== Installation ==

1. Upload the `quorlyx` folder to `/wp-content/plugins/`.
2. Activate Quorlyx from WordPress admin.
3. Open Quorlyx > Settings.
4. Add your own AI provider API key and configure chat, Knowledge Base sources, triggers, and goals.

== Development ==

Run `composer install` to install local development tools.
Run `composer lint:php` or `vendor/bin/phpcs` to check PHP files against `phpcs.xml.dist`.
Run `composer lint:php:fix` or `vendor/bin/phpcbf` only after reviewing the changed files.

The release includes human-readable source assets in `assets/` and third-party vendor sources in `dist/vendor/`. Generated or distribution-ready assets are kept in `dist/`.

== Changelog ==

= 2.2.5 =
* Fixed PHPCS/WPCS issues found during standards cleanup.
* Added Composer development tooling for WordPress coding standards checks.
* Added a kind GitHub star support note in the About settings tab.

= 2.2.4 =
* Current open-source release.
