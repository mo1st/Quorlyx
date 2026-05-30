# Quorlyx

Free open-source AI chatbot and behavior automation plugin for WordPress and WooCommerce.

Quorlyx helps WordPress sites turn visitor behavior into useful AI-powered actions. Instead of showing the same static chatbot to every visitor, Quorlyx can react to what people are doing on the site: the page they are reading, the product they are viewing, how far they scroll, whether they are returning, whether they are close to leaving, what they click, what is in the cart, and how they move through a WooCommerce store.

## What Quorlyx Does

- Adds an AI chatbot to WordPress using the site owner's own AI provider API key.
- Supports Google Gemini, OpenAI, Anthropic Claude, Grok, Mistral, and DeepSeek.
- Creates behavior-based chat triggers for smarter proactive messages.
- Uses WordPress pages, posts, products, rendered page text, uploaded files, and live page context as Knowledge Base sources.
- Supports WooCommerce product context, cart behavior, checkout flow, purchase attribution, coupons, and product discovery.
- Tracks conversations, submissions, conversion goals, trigger analytics, A/B testing results, and content performance.
- Includes AI content generation, SEO tools, schema generation, internal-link suggestions, keyword ideas, and content refresh planning.
- Runs inside WordPress, so the site owner controls the plugin, provider, model, settings, conversations, and costs.

## Why It Saves Money

Many chatbot tools charge a monthly subscription per website, seat, contact volume, or feature tier. That becomes expensive for freelancers, agencies, small businesses, WooCommerce stores, and marketplace builders.

Quorlyx removes that extra chatbot SaaS subscription layer. The plugin is free and open source. You install it on your own WordPress site, add your own AI provider API key, and pay only for the AI usage you choose. There is no Quorlyx account fee, no per-site license fee, no paid unlock step, and no required hosted chatbot platform.

## Why It Can Be Better Than Generic Chatbots

Generic chat widgets usually wait for a visitor to ask a question. Quorlyx is built around WordPress, WooCommerce, and visitor behavior, so it can act at the right moment:

- It can open based on behavior, not only manual chat input.
- It understands WordPress content types, WooCommerce products, carts, and checkout context.
- It can use live page text, uploaded files, rendered content, and behavior snapshots as answer context.
- It lets site owners control provider, model, prompts, triggers, buttons, analytics, appearance, caching, and retention.
- It can test different chat variations and connect messages to real conversion goals.
- It is open source, so developers can inspect, modify, and extend it.

## Feature Map

### AI Providers And Model Control

- Provider support for Gemini, OpenAI, Anthropic, Grok, Mistral, and DeepSeek.
- Separate API key fields for each provider.
- Automatic model fetching for selected providers.
- Variation A and Variation B can use different providers, models, personas, settings, and appearances.
- Content Engine can reuse Variation A credentials or use independent provider credentials.
- Optional fallback provider and fallback model when the primary provider fails.
- Optional model routing for short questions or greetings to cheaper/faster models.
- Local greeting replies can answer simple greetings without calling an AI model.
- Global API timeout setting.

### Chat Widget

- Frontend chat widget enable/disable control.
- Bot name control.
- Welcome message and loading message controls.
- Custom floating logo.
- AI persona/instructions field for tone, rules, button behavior, and answer style.
- AI-generated contextual buttons.
- Persistent quick chat buttons.
- Quick button placement under messages, in the chat bar, or both.
- Action buttons that can open URLs or send predefined messages to AI.
- Normal chat response format modes: free AI, template locked, or hybrid required placeholders.
- Response templates with placeholders, slot instructions, missing-placeholder policy, and max word controls.
- Main chat capture for contact/data requests into Submissions with purpose, status, tags, and capture instructions.
- Conversation history support with configurable message and character budgets.

### Knowledge Base

- Select which public WordPress content types can be used as AI context.
- Use posts, pages, WooCommerce products, and other public custom post types.
- Include rendered public page text from blocks, page builders, shortcodes, templates, and custom fields.
- Include visible current page text from the visitor's active page.
- Upload Knowledge Base files for AI context.
- Supported file-oriented knowledge workflows for PDF, TXT, Markdown, CSV, JSON, HTML, and XML.
- Add behavior patterns from Content Insights as AI context.
- Control content excerpt words, product excerpt words, rendered page max characters, uploaded file count, and characters per file.
- Product tool-calling can let supported providers search WooCommerce products on demand.
- Tool result limits for product search.

### Appearance And Layout

- Desktop floating button positions: bottom right, bottom left, top right, top left, or custom coordinates.
- Desktop floating button size, logo scale, background color, and transparent background option.
- Mobile floating button size, logo scale, bottom offset, and side offset.
- Floating label text, label color, background color, transparency, max width, gap, desktop position, and desktop font size.
- Optional mobile label with separate mobile position and font size.
- Chat window desktop width and height.
- Mobile panel width, full-width mode, height, full-height mode, horizontal alignment, and vertical alignment.
- Header text color, user message background color, user message text color.
- Chat font family, font size, line height, background color, text color, border radius, and padding.
- Quick button style, shape, and font size.
- Generated button style, shape, and font size.

### A/B Testing

- Enable or disable A/B testing.
- Separate Variation A and Variation B configuration.
- Compare conversations, trigger conversations, normal conversations, views, conversions, and conversion rates.
- Assign triggers to all variations, Variation A only, or Variation B only.
- Mark conversion goals as A/B goals.
- Dashboard statistics for each variation.
- Export A/B results as CSV.

### Engagement Triggers

- Trigger types: time on page, scroll depth, inactivity, click intent, cart abandonment, return visitor, page depth, UTM/referrer, instant condition, and desktop exit intent.
- Target page URL contains rules.
- Excluded page URL rules.
- Target section CSS selector rules.
- Proactive message per trigger.
- Normal side-panel opening or centered modal opening.
- Trigger quick reply buttons.
- Trigger-specific chat follow-up instructions.
- Trigger-specific submission capture with purpose, status, and tags.
- Trigger message modes: static, AI, AI-first, or static-first.
- Trigger AI controls for persona, provider scope, provider, model, temperature, max tokens, cache TTL, fallback message, and audit saving.
- Trigger response templates, required placeholders, slot instructions, missing-placeholder handling, and max word controls.
- Priority score and high-priority override.
- Trigger order preview.
- Cooldown modes: once per session, once per page, once per day, once per N days, disabled, or unlimited where supported.
- Cooldown day controls and dismiss-suppression limits.
- Suppress after conversion.
- Minimum time on page.
- Only if cart is empty or only if cart has items.
- Suppress if visitor already visited matching URLs.
- Date scheduling, day scheduling, and time-window scheduling.
- QA preview only mode with preview URL support.
- Recovery templates for cart/exit moments.
- Recovery CTA options: resume checkout, view cart, apply offer, custom action, coupon selection, custom label, and custom URL.
- Optional exit warning and fake exit button controls.

### Trigger Segmentation And Verification

- Content Insights gate for trigger eligibility.
- Gate windows for last 7 days or last 30 days.
- Gate refresh intervals: 1 day, 7 days, 30 days, or manual.
- Thresholds for views, conversions, conversion rate, average time, scroll depth, add to cart, and checkout flow.
- Segment by page type: homepage, product, post, page, or any.
- Segment by device: mobile, desktop, or any.
- Segment by traffic source: direct, search, social, paid, email, referral, or any.
- Segment by behavior pattern: fast leaver, medium leaver, slow leaver, comparison shopper, fast closer, discoverer closer, unknown, or any.
- Segment by predicted next step.
- Include and exclude URL pattern filters.
- Opportunity threshold and hysteresis buffer controls.

### WooCommerce And Marketplace Features

- Product Knowledge Base context.
- WooCommerce product visit conversion goals.
- Product search/select controls for goals and targeting.
- Add-to-cart tracking.
- Checkout and place-order action tracking.
- WooCommerce purchase attribution for Content Insights.
- Cart abandonment trigger.
- Cart-not-empty and cart-empty trigger conditions.
- Checkout flow and checkout dropout behavior signals.
- Coupon dropdown for recovery CTA offers.
- Product queue for AI content generation.
- Generate content for all products, specific products, or keyword topics.
- Related product recommendations in generated content.
- Product tool-calling for supported AI providers.

### Conversion Goals And Notifications

- Conversion goals by URL contains rules.
- Any detected conversion/payment success goal.
- CSS selector click goals.
- Form submit selector goals.
- Popular WordPress action goals.
- WooCommerce product visit goals.
- Common presets for WordPress button/CTA clicks, Contact Form 7, WPForms, Gravity Forms, Elementor forms, Fluent Forms, Ninja Forms, Formidable Forms, WooCommerce add to cart, WooCommerce checkout/place order, phone links, email links, and download links.
- Goal counters and A/B test goal selection.
- Email notifications for new leads.
- Optional full conversation transcript email to admin.

### Content Insights And Behavior Analytics

- Track all public content, selected post types, or target URLs.
- Include and exclude post types.
- Include and exclude exact URLs or URL contains rules.
- Filter by any content, AI-generated content, or manual content.
- Filter by improved or not-improved content.
- Opportunity scoring with threshold and top-opportunity limits.
- Conversion counting by any conversion signal or only configured goals.
- Database-first analytics processing option.
- Dedicated Content Insights admin page.
- Content performance labels such as promote, watch, or improve.
- Content Insights suggestions for practical next actions.
- Create triggers from insight opportunities.
- Import historical CSV analytics from external tools.
- Map CSV columns into Quorlyx fields.
- Pull historical metrics from compatible WordPress analytics data when available.

### Behavior Pattern Engine

- Browser behavior snapshots and milestone sync.
- Buyer/closer and non-converter profile tracking.
- WooCommerce purchase as primary conversion.
- Custom conversion rules for form submit, click, and event signals.
- Checkout flow signals for cart and checkout abandonment.
- Minimum sessions for classification.
- Sync interval, snapshot gap controls, server sync controls, and profile retention.
- Database-first profile aggregation option.
- Dynamic calibration lookback, minimum calibration profiles, and prediction confidence.
- Reference matching against stored behavior profiles.
- Reference error tolerance, minimum profiles per source, minimum samples per pattern, and fallback to rule-based classification.
- Pattern metrics: visit frequency, pages viewed, dwell time, cart activity, scroll depth, started chat, checkout flow, and traffic source.
- Per-metric weights for behavior prediction.
- Behavior classifications including fast leaver, medium leaver, slow leaver, comparison shopper, fast closer, and discoverer closer.

### Content Engine And SEO Tools

- Automated AI post generation.
- Manual "generate one post now" action.
- Generation schedules: manual only, daily, twice daily, or weekly.
- Posts per run control.
- Duplicate prevention with generation history and reset history.
- Generation sources: topic keyword queue, all products discovery mode, specific products, and product queue.
- Custom AI instructions for generated posts.
- Select output post type, author, and draft/publish status.
- Related recommendations appended to generated content.
- Recommendation sections for products, posts, and services.
- Taxonomy relevance for recommendations.
- Custom service taxonomies.
- Custom recommendation section labels.
- Recommendation cache TTL.
- Generate keyword ideas with AI.
- Analyze a topic for SEO.
- Generate schema markup.
- Suggest internal links.
- Improve existing posts, pages, and products with saved SEO suggestions.
- Filter SEO improvement targets by source and improvement status.
- Mark content as improved.

### Dashboard, Logs, Exports, And Maintenance

- Quorlyx Dashboard with conversation statistics, trigger analytics, conversion goals, and Content Insights summary.
- Submissions admin area for captured leads/contact/data requests.
- Conversations admin area for stored chat history.
- Export A/B results CSV.
- Export trigger analytics CSV.
- Export submissions CSV.
- Export conversations CSV.
- Event Logs tab.
- Clear all logs and delete selected logs.
- Analyze logs with AI.
- Setup guide chat for plugin questions.
- Health Check.
- Frontend Probe.
- Site snapshot for diagnostics.
- Reset selected data for A/B stats, goal counters, action counters, trigger analytics, product insights, content insights, behavior patterns, and conversations.
- Data retention controls for conversations and submissions.

### Performance And Cost Controls

- Response caching and response cache TTL.
- Context cache TTL.
- Optional WordPress object cache usage.
- Session context reuse for follow-up questions.
- Chat debounce.
- Context detail level: full or compact.
- Content excerpt length and product excerpt length.
- Rendered page max characters.
- Uploaded Knowledge Base file count and character budgets.
- Chat history message and character budgets.
- Persona prompt trimming and max character limit.
- Server-side chat rate limiting with request/window settings.
- Fallback provider cooldown.

## Open-Source Model

Quorlyx is free and open source under GPL-2.0-or-later. The plugin core is available on GitHub, can be installed on your own WordPress server, and does not require a Quorlyx subscription.

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
5. Configure chat behavior, Knowledge Base sources, triggers, goals, and optional content tools.

## Updates From GitHub

Quorlyx includes a GitHub update bridge for self-hosted open-source installs.

- WordPress checks the latest public GitHub release from `https://github.com/mo1st/Quorlyx/`.
- Available releases appear in the normal WordPress **Dashboard > Updates** and **Plugins** screens.
- Admins can use the **Check GitHub updates** plugin-row action to force a fresh release check.
- GitHub source ZIP folders are normalized during upgrade so the plugin stays installed as `wp-content/plugins/quorlyx/`.

To publish a new update:

1. Update the plugin header `Version` and the `QUORLYX_VERSION` constant in `quorlyx.php`.
2. Commit and push the change to GitHub.
3. Create a GitHub release tag such as `v2.2.5`.
4. WordPress sites with Quorlyx installed will discover the release during the next plugin update check.

## Install Counts And Domains

GitHub webhooks are not a replacement for plugin install analytics. A GitHub webhook sends repository events to an external server URL; it does not receive pings from WordPress sites and it cannot tell how many domains have installed the plugin.

If Quorlyx needs install counts or domain reporting, use a Quorlyx-owned endpoint such as `https://quorlyx.dev/wp-json/quorlyx/v1/install` and make reporting explicit in the WordPress admin. A responsible telemetry flow should be opt-in, explain what is sent, and avoid sending API keys, conversations, customer data, or private settings.
