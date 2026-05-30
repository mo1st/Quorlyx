# Quorlyx WordPress Plugin Coding Standards

All future development and edits must strictly adhere to the following guidelines based on WordPress.org Reviewer feedback.

## 1. Resource Management (JS/CSS)
**Rule:** Never output raw `<script>` or `<style>` tags.
- **Static Files:** Use `wp_enqueue_script()` and `wp_enqueue_style()`.
- **Inline Code:** Use `wp_add_inline_script()` and `wp_add_inline_style()`.
- **Hooks:** Use `wp_enqueue_scripts` (frontend) and `admin_enqueue_scripts` (admin).

## 2. Security: Escaping & Sanitization
**Rule:** Escape late, sanitize early.
- **Output:** Every variable echoed must be escaped at the point of output (e.g., `esc_html($var)`, `esc_attr($var)`, `wp_kses_post($var)`).
- **Inline CSS/JS:** variables used in `wp_add_inline_style` must be validated or sanitized to prevent injection.

## 3. REST API Security
**Rule:** strict permission callbacks.
- **Permission Callback:** Every `register_rest_route()` must strictly define a `permission_callback`.
- **Sensitive Data:** Never use `'permission_callback' => '__return_true'` for endpoints returning private or user-specific data (like chat history). Implement proper capability checks (e.g., `current_user_can()`) or nonce validation.

## 4. Source Code & Build Process
**Rule:** Code must be human-readable and modifiable.
- **Source Inclusion:** Always include unminified source files (e.g., `src/js/`, `src/css/`) alongside minified distribution files.
- **Documentation:** clearly document build steps (e.g., npm commands) in `README.md` or `readme.txt` so others can rebuild the project.

## 5. Plugin Metadata
**Rule:** Accurate attribution.
- **Contributors:** The `readme.txt` "Contributors" list must include the WordPress.org username of the plugin owner/uploader (e.g., `mouhcine1st`).

## 6. WordPress Coding Standards (PHPCS/WPCS)
**Rule:** All edits must pass `phpcs` using `phpcs.xml.dist`.
- **Run PHPCS:** Use `phpcs` for validation; fix issues before finalizing edits.
- **Exclude Backups:** Never edit or lint the backup directory (e.g., `Pro/Quorlyx/backup`).
- **File Docblocks:** PHP files must have a proper file-level docblock with `@package`.
- **Line Endings:** Use LF line endings and ensure a trailing newline at EOF.
- **Encoding:** Save files as UTF-8 without BOM; avoid garbled (mojibake) text in UI strings.
- **Escaping:** Keep output escaping consistent (`esc_html`, `esc_attr`, `wp_kses_post`) and avoid mixed escaping styles.
