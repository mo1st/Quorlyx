# Quorlyx

Open-source AI behavior automation plugin for WordPress and WooCommerce.

Quorlyx helps site owners and agencies create smart automations based on visitor behavior, store activity, page context, and AI-generated responses.

## Status

This release copy is prepared for open-source publishing.

- No paid account or purchase step is required.
- No commercial checkout, marketplace purchase, or private service dependency is included.
- Users provide their own AI provider API keys inside WordPress admin settings.
- The plugin is intended to be distributed under GPL-2.0-or-later.

## Included

- Main plugin bootstrap: `quorlyx.php`
- Frontend and admin assets: `assets/`, `dist/`
- Public docs: `docs/`
- Optional includes: `includes/`

## Excluded From This Release Copy

- `node_modules/`
- generated ZIP archives
- generated DOCX files and extracted DOCX temp folders
- local WordOps/server tools
- local DNS/config/test logs
- embedded commercial server implementation

## Installation

1. Copy the `quorlyx` folder into `wp-content/plugins/`.
2. Activate Quorlyx from WordPress admin.
3. Open **Quorlyx > Settings**.
4. Add your own AI provider API key and model.
5. Configure triggers, chat behavior, and content settings.

## Security Notes

- Do not commit real AI provider keys.
- Do not commit private customer conversations or exports.
- Do not commit production `wp-config.php` files.
- Keep webhook secrets and external service credentials in environment variables or server config.

## Monetization Model

The plugin core is free and open source. Paid work can be offered separately for installation, custom automations, WooCommerce/CRM/webhook integrations, and support.
