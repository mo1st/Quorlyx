# Quorlyx AI Message Format Plan

Use this discussion plan for a new Quorlyx feature that lets site owners force AI chat and proactive trigger messages into a specific format while still allowing AI to personalize small parts of the message.

## Problem

Prompt instructions alone cannot fully force AI output. The model can ignore wording, change order, omit product names, add unsupported button syntax, or produce a message that is too long.

Quorlyx should support locked message templates where the plugin controls the final format and the AI only fills approved dynamic slots.

Example target format:

```text
Before you leave {product_name}, try this: {ai_help_offer}
```

Rendered example:

```text
Before you leave Quorlyx Pro, try this: ask me about setup, pricing, or the best next step.
```

## Goals

- Let admins define exact opening-message formats for chat welcomes and trigger messages.
- Support placeholders such as product name, post title, page title, site name, category, campaign, cart state, coupon, and current URL.
- Allow optional AI-filled slots without giving AI control over the whole final message.
- Validate the final message before display.
- Keep a safe fallback when context or AI generation fails.
- Make the feature understandable from wp-admin without requiring prompt-engineering knowledge.

## Non-Goals

- Do not let AI create arbitrary HTML.
- Do not let AI invent discounts, deadlines, prices, guarantees, availability, stock status, or private user facts.
- Do not require admins to write JSON or code.
- Do not replace the current static message and AI-only modes. Add this as a stronger formatting option.

## Core Approach

Add a new message format layer:

1. Collect page, post, product, trigger, cart, and campaign context.
2. Resolve safe placeholders from WordPress and WooCommerce data.
3. Ask AI only for approved dynamic slot values when needed.
4. Render the final message with Quorlyx code.
5. Validate length, required placeholders, button syntax, and unsafe claims.
6. If validation fails, retry once or use the configured fallback message.

This makes the final message deterministic instead of relying only on AI obedience.

## Admin UX

Add a new section inside each trigger's AI-Generated Message panel:

- Format Mode
    - Free AI: current behavior.
    - Template Locked: Quorlyx renders the exact template and AI fills only allowed slots.
    - Hybrid: AI can write the message but must include selected required placeholders.
- Message Template
    - Textarea where admins write the final format.
    - Example: `Before you leave {product_name}, try this: {ai_help_offer}`
- Insert Placeholder
    - Dropdown or token picker that inserts supported placeholders into the template.
- AI Slot Instructions
    - Short instruction for each AI slot.
    - Example: `{ai_help_offer}` should be "one short helpful offer under 12 words."
- Missing Placeholder Behavior
    - Hide missing placeholder.
    - Use fallback text.
    - Block AI message and show fallback message.
- Preview Context
    - Admin can preview with a selected product, post, page, or current URL.

For chat welcome messages in Variation A and Variation B, add a smaller version:

- Welcome Format Mode
- Welcome Message Template
- Insert Placeholder
- Preview

## Placeholder Syntax

Use lowercase snake_case placeholders as the canonical format:

```text
{product_name}
{post_title}
{page_title}
{site_name}
```

Accept friendly aliases for admins and normalize them internally:

```text
{Product-name} -> {product_name}
{Product Name} -> {product_name}
{post title} -> {post_title}
```

Unsupported placeholders should be shown as admin validation warnings before save.

## Suggested Placeholder Registry

Basic site context:

- `{site_name}`
- `{site_url}`
- `{current_url}`
- `{page_title}`
- `{post_title}`
- `{post_type}`
- `{language}`

WooCommerce context:

- `{product_name}`
- `{product_price}`
- `{product_category}`
- `{product_sku}`
- `{cart_count}`
- `{cart_total}`
- `{coupon_code}`
- `{checkout_url}`
- `{cart_url}`

Trigger context:

- `{trigger_name}`
- `{trigger_type}`
- `{behavior_pattern}`
- `{predicted_next_step}`
- `{traffic_source}`
- `{utm_campaign}`
- `{referrer_domain}`

AI-controlled slots:

- `{ai_help_offer}`
- `{ai_question}`
- `{ai_reassurance}`
- `{ai_next_step}`
- `{ai_button_label}`

Button context:

- `{button_url}`
- `{button_label}`

Supported button rendering should continue to use:

```text
[BUTTON: Label](https://url)
```

## Template Examples

Product exit intent:

```text
Before you leave {product_name}, try this: {ai_help_offer}
```

Product page time-on-page:

```text
Still comparing {product_name}? I can help with {ai_question}
```

Cart abandonment:

```text
Need help finishing checkout? I can clarify shipping, payment, or returns for the items in your cart.
```

Blog post scroll depth:

```text
Reading {post_title}? I can summarize the key points or suggest the next step.
```

Page title opener:

```text
On {page_title}? Ask me for a quick summary or the best next action.
```

Campaign landing page:

```text
Here for {utm_campaign}? I can help you find the offer details fast.
```

Button example:

```text
Want to continue with {product_name}? [BUTTON: View Product]({button_url})
```

## AI Slot Contract

When the template contains AI slots, Quorlyx should ask the AI for structured slot values instead of a full message.

Example prompt goal:

```text
Return JSON only with these keys:
{
  "ai_help_offer": "one short helpful offer under 12 words"
}
```

Example AI response:

```json
{
  "ai_help_offer": "ask me about sizing, shipping, or product fit"
}
```

Quorlyx then renders:

```text
Before you leave Trail Runner Pro, try this: ask me about sizing, shipping, or product fit.
```

## Validation Rules

Before showing the message, validate:

- Required placeholders are resolved.
- Final message is under the configured word or character limit.
- AI slot values contain no HTML.
- Button syntax is valid when a button exists.
- There is at most one AI-generated button unless the admin allows more.
- Message does not contain unsafe claims such as invented discounts, guaranteed delivery, fake stock status, or private user assumptions.
- Message does not use creepy tracking language such as "I watched you" or "I know you are leaving."

If validation fails:

1. Retry once with a stricter repair prompt.
2. If it still fails, show `ai_fallback_message`.
3. Log the failure reason for admin diagnostics.

## Data and Settings Plan

Add trigger settings:

- `ai_format_mode`: `free_ai`, `template_locked`, or `hybrid_required_tokens`.
- `ai_message_template`: raw template text.
- `ai_required_placeholders`: list of placeholders that must resolve.
- `ai_slot_instructions`: map of AI slot names to admin instructions.
- `ai_missing_placeholder_policy`: `hide`, `fallback_text`, or `use_fallback_message`.
- `ai_template_max_words`: optional format-specific limit.

Add variation settings for welcome messages:

- `welcome_format_mode`
- `welcome_message_template`
- `welcome_required_placeholders`
- `welcome_missing_placeholder_policy`

Cache key must include the template hash, placeholder context hash, language, trigger ID, page URL, product ID, and variation key.

## Runtime Flow

Template Locked trigger flow:

1. Trigger becomes eligible on frontend.
2. Frontend sends trigger ID, current URL, product ID when available, language, and variation key.
3. REST handler loads trigger and selected variation.
4. Context resolver builds placeholder values.
5. If template has AI slots, call AI for slot JSON only.
6. Renderer replaces placeholders.
7. Validator checks final message.
8. Response returns final message plus metadata.
9. Optional audit save records rendered message and template ID/hash.

Hybrid flow:

1. AI writes a complete message.
2. Validator checks that required placeholders or resolved values are present.
3. If missing, repair once or fallback.

Static flow:

1. Renderer replaces placeholders in the static proactive message.
2. No AI call is needed.

## Implementation Phases

Phase 1: Placeholder renderer

- Create a placeholder registry.
- Add context resolver for current page, post, product, trigger, and campaign data.
- Render placeholders in static proactive messages and welcome messages.
- Add admin preview and validation warnings.

Phase 2: Template Locked trigger messages

- Add `ai_format_mode` and `ai_message_template` to trigger settings.
- Add AI slot JSON generation.
- Add final render and validation.
- Update cache keys and logs.

Phase 3: Welcome message formatting

- Add format controls to Variation A and Variation B welcome messages.
- Support `{site_name}`, `{page_title}`, `{product_name}`, `{post_title}`, and `{ai_question}` where context is available.

Phase 4: Presets and suggestions

- Add template presets by trigger type.
- Suggest placeholders based on page type.
- Product pages should suggest `{product_name}`.
- Posts should suggest `{post_title}`.
- Pages should suggest `{page_title}`.
- Cart triggers should suggest `{cart_count}`, `{cart_total}`, and `{checkout_url}`.

Phase 5: Analytics

- Track template ID/hash in trigger analytics.
- Compare reply rate and conversion rate by template format.
- Surface weak templates in Content Insights recommendations.

## Preset Library

Exit intent:

```text
Before you leave {product_name}, try this: {ai_help_offer}
```

Time on page:

```text
Need a quick shortcut on {page_title}? I can summarize this or point you to the next step.
```

Scroll depth:

```text
Deep into {post_title}? I can pull out the key takeaways.
```

Cart abandonment:

```text
Almost done. I can help with shipping, payment, returns, or checkout questions.
```

Return visitor:

```text
Welcome back to {site_name}. I can help you continue from the most useful next step.
```

Campaign visitor:

```text
Looking for {utm_campaign}? I can help you find the relevant offer or details.
```

## Safety Notes

- Product price, stock, discounts, coupons, shipping dates, and availability should only be inserted from trusted WooCommerce or Knowledge Base data.
- If a placeholder is not available, do not ask AI to guess it.
- AI slots should be short and purpose-specific.
- The renderer should escape all output at display time.
- Admin preview should clearly show unresolved placeholders before the trigger is activated.

## Acceptance Criteria

- Admins can insert `{product_name}`, `{post_title}`, and `{page_title}` into trigger messages.
- A product exit-intent trigger can render `Before you leave {product_name}, try this: {ai_help_offer}` with the real product name.
- If product context is missing, the message uses fallback behavior instead of showing `{product_name}` to visitors.
- AI can fill `{ai_help_offer}` but cannot change the surrounding template text.
- Unsupported placeholders produce admin warnings.
- Final messages still support the existing `[BUTTON: Label](https://url)` syntax.
- Generated messages are cached and invalidated when the template changes.
- Logs identify whether output came from Free AI, Template Locked, Hybrid, or Static rendering.

## Implementation Status

Applied first code slice in `quorlyx.php`:

- Added trigger settings for Free AI, Template Locked, and Hybrid required-placeholder modes.
- Added placeholder rendering for trigger proactive messages and fallback messages.
- Added placeholder rendering for normal welcome messages and floating labels.
- Added Template Locked rendering in the trigger AI REST endpoint.
- Added AI slot JSON generation for `{ai_help_offer}`, `{ai_question}`, `{ai_reassurance}`, `{ai_next_step}`, and `{ai_button_label}`.
- Added validation and fallback behavior before a generated trigger message is displayed.
- Updated trigger AI cache keys so template, context, persona, language, product, and variation changes invalidate cached output.
- Added opt-in Normal Chat Response Format per variation. Free AI remains the default fast path.
- Added `{ai_answer}` for Template Locked normal chat response templates.
- Template Locked normal chat applies after the normal answer is generated; extra `{ai_*}` slots may add one AI call.
- Hybrid normal chat can ask AI to include resolved placeholders without locking the whole response layout.
- Normal chat response cache keys include the format signature so template changes invalidate cached output.

Still pending:

- Dedicated welcome-format admin controls.
- Admin-side live preview for template placeholders.
- Analytics breakdown by template hash or format mode.
