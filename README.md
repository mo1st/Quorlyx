# Quorlyx

Free open-source AI chatbot and behavior automation plugin for WordPress and WooCommerce.

Quorlyx helps WordPress sites turn visitor behavior into useful AI-powered actions. Instead of showing the same chatbot to every visitor, Quorlyx can react to what people are doing on the site: which page they are reading, which product they are viewing, whether they are returning, whether they are close to leaving, what they clicked, and how they move through a WooCommerce store.

## What Quorlyx Does

- Adds an AI chatbot to WordPress using your own AI provider API key.
- Creates behavior-based triggers for smarter messages and automations.
- Supports WooCommerce context such as products, carts, checkout flow, and store activity.
- Helps answer visitor questions using site content, product context, and configured knowledge.
- Tracks goals and conversion events so store owners can understand what works.
- Includes logs, diagnostics, A/B testing controls, and content engine tools.
- Runs inside WordPress, so site owners keep control of the plugin and setup.

## Why It Saves Money

Many chatbot platforms charge a monthly subscription per website, per seat, per contact volume, or per feature tier. That can become expensive for freelancers, agencies, small businesses, and WooCommerce store owners.

Quorlyx removes that extra chatbot SaaS subscription layer. The plugin itself is free and open source. You install it on your own WordPress site, add your own AI provider API key, and pay only for the AI usage you choose. There is no Quorlyx account fee, no per-site license fee, and no paid unlock step inside the plugin.

For agencies and marketplace builders, this is especially useful because the same open-source plugin can be installed across client projects without adding another recurring chatbot tool to every site.

## Why It Can Be Better Than Generic Chatbots

Generic chat widgets usually wait for a visitor to ask a question. Quorlyx is built for WordPress and WooCommerce behavior, so it can be more useful in real site situations:

- It can react to visitor behavior instead of only waiting for manual chat input.
- It understands WordPress pages, posts, products, and WooCommerce store context.
- It supports smart triggers for moments like product interest, cart hesitation, page depth, or exit intent.
- It gives site owners control over provider, model, prompts, triggers, logs, and setup.
- It is open source, so developers can inspect, modify, and extend it.
- It is free, which makes it easier to test, customize, and deploy without committing to another monthly tool.

## How It Helps WordPress Sites

Quorlyx can help blogs, business sites, service websites, landing pages, directories, and content-heavy WordPress projects by:

- answering common visitor questions;
- guiding users to relevant pages or services;
- turning site content into AI-assisted support context;
- capturing leads and useful user intent;
- testing different AI messages and trigger strategies;
- reducing manual support for repeated questions.

## How It Helps WooCommerce Stores And Marketplaces

For WooCommerce shops and marketplaces, Quorlyx can support product discovery and buyer assistance:

- answer product questions using page and store context;
- guide shoppers when they hesitate on product or cart pages;
- create behavior-based prompts for checkout, comparison, or support moments;
- help marketplace sellers and agencies add AI assistance without paying for a separate chatbot SaaS per store;
- connect automation ideas to WooCommerce, CRM, webhook, or custom workflows.

## Open-Source Model

Quorlyx is free and open source under GPL-2.0-or-later. The plugin core is available on GitHub, and paid work can be offered separately for installation, custom automations, WooCommerce/CRM/webhook integrations, and setup support.

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
