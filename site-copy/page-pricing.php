<?php
/**
 * Standalone pricing page template.
 *
 * @package QuorlyxTheme
 */

$pricing_title_line      = 'Quorlyx is Free and Open Source';
$pricing_title_highlight = 'Download the plugin, inspect the code, and build smarter WordPress automation.';
$pricing_intro           = 'Start from GitHub for the full open-source project, install the basic plugin from the WordPress Marketplace, or use public help through GitHub issues and Discord.';
$pricing_popular_badge   = 'PRIMARY DOWNLOAD';
$pricing_image           = quorlyx_theme_get_option( 'quorlyx_pricing_image', '' );
$pricing_image_alt       = quorlyx_theme_get_option( 'quorlyx_pricing_image_alt', 'Pricing plans preview' );

$free_plan_features = array(
	'Open-source WordPress/WooCommerce automation plugin',
	'Behavior-based triggers for smarter visitor engagement',
	'AI workflow, webhooks, analytics, and integration notes in the docs',
	'Use it, fork it, and adapt it for your own site, store, agency, or client work',
);

$pricing_plans = array(
	array(
		'level'       => 'Primary CTA',
		'name'        => 'Download on GitHub',
		'subtitle'    => 'Full open-source project for developers, store owners, and agencies',
		'price'       => 'Free',
		'price_style' => 'text',
		'period'      => '/open source',
		'button'      => 'Download on GitHub',
		'url'         => 'https://github.com/mo1st/Quorlyx/',
		'features'    => $free_plan_features,
		'caption'     => 'Source code, releases, issues, roadmap, and contribution docs live on GitHub.',
		'is_featured' => true,
		'is_external' => true,
	),
	array(
		'level'       => 'Secondary CTA',
		'name'        => 'WordPress Marketplace',
		'subtitle'    => 'Basic plugin install path for WordPress users',
		'price'       => 'Free',
		'price_style' => 'text',
		'period'      => '/basic plugin',
		'button'      => 'Download the basic plugin from WordPress Marketplace',
		'url'         => 'https://wordpress.org/plugins/quorlyx/',
		'features'    => array(
			'Install through the familiar WordPress plugin workflow',
			'Good starting point for site owners who prefer marketplace discovery',
			'Use your own AI provider key and WordPress settings',
			'Move to GitHub when you want source, releases, issues, and docs',
		),
		'caption'     => 'Best for quick discovery and basic installation from WordPress.',
		'is_external' => true,
	),
	array(
		'level'       => 'Public Help',
		'name'        => 'Community Support',
		'subtitle'    => 'GitHub issues and Discord for shared questions and fixes',
		'price'       => 'Free',
		'price_style' => 'text',
		'period'      => '/community',
		'button'      => 'Community Support',
		'url'         => 'https://discord.gg/ZTu6XFUZD',
		'features'    => array(
			'Ask setup and usage questions in public channels',
			'Report bugs and request improvements through GitHub issues',
			'Learn from answers that stay visible for other users',
			'Share ideas, examples, fixes, and implementation notes',
		),
		'caption'     => 'Public help keeps the project useful through shared answers.',
		'is_external' => true,
	),
);

$feature_groups = array(
	array(
		'title' => 'What the Free Plugin Gives You',
		'items' => array(
			'Open-source AI behavior automation for WordPress and WooCommerce',
			'Smart triggers based on visitor behavior, pages, campaigns, and store activity',
			'AI-assisted messages and workflows that developers can inspect and customize',
			'Webhook and integration-ready structure for agencies and advanced store owners',
		),
	),
	array(
		'title' => 'Download Paths',
		'items' => array(
			'GitHub is the primary download for source code, releases, docs, and contributions',
			'WordPress Marketplace is the secondary download for the basic plugin install path',
			'Both paths keep Quorlyx free to install and test on your own WordPress site',
			'No upgrade gate, no required account, and no locked support channel',
		),
	),
	array(
		'title' => 'Community Support',
		'items' => array(
			'Use GitHub issues for bugs, feature requests, and reproducible setup problems',
			'Use Discord for community discussion and quick questions',
			'Public answers help future users instead of disappearing into one-to-one threads',
			'Contributions, suggestions, and implementation ideas are welcome',
		),
	),
	array(
		'title' => 'Project Direction',
		'items' => array(
			'Improve GitHub releases and WordPress update discovery',
			'Keep behavior triggers, WooCommerce context, and Knowledge Base features transparent',
			'Document architecture, security expectations, and contribution flow',
			'Build public trust by avoiding hidden tracking and private feature gates',
		),
	),
);
?>
<?php
$pricing_page_css = '
	.qlx-pricing-page .qlx-fire-grid--plans {
		grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
	}

	.qlx-pricing-page .qlx-fire-card__price--text strong {
		font-size: clamp(1.35rem, 2vw, 1.95rem);
		line-height: 1.08;
	}

	@media (max-width: 1200px) {
		.qlx-pricing-page .qlx-fire-grid--plans {
			grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
		}
	}

	@media (max-width: 640px) {
		.qlx-pricing-page .qlx-fire-grid--plans {
			grid-template-columns: 1fr !important;
		}
	}
';

$pricing_page_js = "
document.addEventListener('DOMContentLoaded', function () {
	const pricingPage = document.querySelector('.qlx-pricing-page');
	const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	const revealTargets = pricingPage ? Array.from(pricingPage.querySelectorAll('.qlx-fire-heading, .qlx-fire-coupon, .qlx-fire-choice-heading, .qlx-fire-card, .qlx-fire-guarantee, .qlx-pricing-includes__heading, .qlx-feature-group')) : [];

	if (pricingPage) {
		document.body.classList.add('qlx-pricing-anim-ready');

		if (reduceMotion || !window.IntersectionObserver) {
			revealTargets.forEach(function (item) {
				item.classList.add('is-visible');
			});
		} else {
			const revealObserver = new IntersectionObserver(function (entries, observer) {
				entries.forEach(function (entry) {
					if (!entry.isIntersecting) {
						return;
					}

					entry.target.classList.add('is-visible');
					observer.unobserve(entry.target);
				});
			}, {
				threshold: 0.12,
				rootMargin: '0px 0px -8% 0px'
			});

			revealTargets.forEach(function (item) {
				revealObserver.observe(item);
			});
		}
	}
});
";

wp_register_style( 'qlx-pricing-page', false, array(), null );
wp_enqueue_style( 'qlx-pricing-page' );
wp_add_inline_style( 'qlx-pricing-page', $pricing_page_css );
wp_register_script( 'qlx-pricing-page', false, array(), null, true );
wp_enqueue_script( 'qlx-pricing-page' );
wp_add_inline_script( 'qlx-pricing-page', $pricing_page_js );

get_header();
?>
<main id="primary" class="qlx-site-main qlx-pricing-page">
	<section class="qlx-pricing-hero qlx-pricing-fire">
		<div class="mx-auto max-w-7xl px-6">
			<div class="qlx-fire-heading">
				<p class="qlx-fire-seal"><?php esc_html_e( 'Quorlyx Pricing', 'quorlyx-theme' ); ?></p>
				<h1 class="qlx-display text-center text-4xl font-black text-white md:text-6xl">
					<?php echo esc_html( $pricing_title_line ); ?>
					<?php if ( ! empty( $pricing_title_highlight ) ) : ?>
						<span class="gradient-text"><?php echo esc_html( $pricing_title_highlight ); ?></span>
					<?php endif; ?>
				</h1>
				<p class="mx-auto mt-5 max-w-3xl text-center text-base font-medium text-slate-200 md:text-lg"><?php echo esc_html( $pricing_intro ); ?></p>
			</div>

			<div id="community-support" class="qlx-fire-coupon">
				<div class="qlx-fire-coupon__copy">
					<p class="qlx-fire-coupon__eyebrow"><?php esc_html_e( 'Free Open Source + Public Help', 'quorlyx-theme' ); ?></p>
					<h2><?php esc_html_e( 'Quorlyx is free to download, inspect, fork, and improve.', 'quorlyx-theme' ); ?></h2>
					<p><?php esc_html_e( 'Use GitHub for releases, issues, and contributions. Use Discord for community discussion and shared setup questions.', 'quorlyx-theme' ); ?></p>
					<p><?php esc_html_e( 'If Quorlyx helps your WordPress or WooCommerce workflow, starring the GitHub repo helps more developers discover it.', 'quorlyx-theme' ); ?></p>
				</div>
				<a class="qlx-fire-coupon__action" href="https://github.com/mo1st/Quorlyx/" target="_blank" rel="noopener noreferrer">
					<?php esc_html_e( 'Star on GitHub', 'quorlyx-theme' ); ?>
				</a>
			</div>

			<?php if ( ! empty( $pricing_image ) ) : ?>
				<div class="mx-auto mb-10 max-w-4xl overflow-hidden rounded-2xl border border-white/10">
					<img src="<?php echo esc_url( $pricing_image ); ?>" alt="<?php echo esc_attr( $pricing_image_alt ); ?>" class="h-auto w-full object-cover" loading="lazy" />
				</div>
			<?php endif; ?>

			<h2 class="qlx-fire-choice-heading"><?php esc_html_e( 'Choose How You Want to Start', 'quorlyx-theme' ); ?></h2>
			<div class="qlx-fire-grid qlx-fire-grid--plans">
				<?php foreach ( $pricing_plans as $plan ) : ?>
					<?php
					$card_classes = 'qlx-fire-card';
					if ( ! empty( $plan['is_featured'] ) ) {
						$card_classes .= ' qlx-fire-card--featured';
					}
					if ( 'Free' === $plan['name'] ) {
						$card_classes .= ' qlx-fire-card--free';
					}
					?>
					<div class="<?php echo esc_attr( $card_classes ); ?>">
						<?php if ( ! empty( $plan['is_featured'] ) ) : ?>
							<p class="qlx-fire-card__badge"><?php echo esc_html( $pricing_popular_badge ); ?></p>
						<?php endif; ?>
						<p class="qlx-fire-card__level"><?php echo esc_html( $plan['level'] ); ?></p>
						<h2><?php echo esc_html( $plan['name'] ); ?></h2>
						<p class="qlx-fire-card__subtitle"><?php echo esc_html( $plan['subtitle'] ); ?></p>
						<p class="<?php echo esc_attr( 'qlx-fire-card__price' . ( ! empty( $plan['price_style'] ) && 'text' === $plan['price_style'] ? ' qlx-fire-card__price--text' : '' ) ); ?>">
							<?php if ( ! empty( $plan['deal'] ) ) : ?>
								<del><?php echo esc_html( $plan['price'] ); ?></del>
								<strong><?php echo esc_html( $plan['deal'] ); ?></strong>
							<?php else : ?>
								<strong><?php echo esc_html( $plan['price'] ); ?></strong>
							<?php endif; ?>
							<span><?php echo esc_html( $plan['period'] ); ?></span>
						</p>
						<?php
						$button_classes = ! empty( $plan['is_featured'] ) ? 'qlx-fire-cta qlx-fire-cta--primary' : ( ! empty( $plan['is_external'] ) ? 'qlx-fire-cta qlx-fire-cta--marketplace' : 'qlx-fire-cta' );
						?>
						<a class="<?php echo esc_attr( $button_classes ); ?>" href="<?php echo esc_url( $plan['url'] ); ?>" <?php echo ! empty( $plan['is_external'] ) ? 'target="_blank" rel="noopener noreferrer"' : ''; ?>>
							<?php echo esc_html( $plan['button'] ); ?>
						</a>
						<p class="qlx-fire-card__caption">
							<?php echo esc_html( $plan['caption'] ); ?>
						</p>
						<ul class="qlx-plan-feature-list">
							<?php foreach ( $plan['features'] as $feature_text ) : ?>
								<li><?php echo esc_html( $feature_text ); ?></li>
							<?php endforeach; ?>
						</ul>
					</div>
				<?php endforeach; ?>
			</div>

			<div class="qlx-fire-guarantee">
				<h2><?php esc_html_e( 'Simple and Clear', 'quorlyx-theme' ); ?></h2>
				<p><?php esc_html_e( 'Quorlyx is 100% free and open source. Download it, connect your own AI provider, and get help through public community channels.', 'quorlyx-theme' ); ?></p>
			</div>
		</div>
	</section>

	<section class="qlx-pricing-includes">
		<div class="mx-auto max-w-7xl px-6">
			<div class="qlx-pricing-includes__heading">
				<h2 class="qlx-display text-3xl font-black text-white md:text-5xl"><?php esc_html_e( 'How the Open-Source Project Works', 'quorlyx-theme' ); ?></h2>
				<p><?php esc_html_e( 'The project is public by default: code on GitHub, a basic WordPress Marketplace path, shared support, transparent docs, and community-driven improvements.', 'quorlyx-theme' ); ?></p>
			</div>
			<div class="qlx-feature-groups">
				<?php foreach ( $feature_groups as $feature_group ) : ?>
					<article class="qlx-feature-group">
						<h3><?php echo esc_html( $feature_group['title'] ); ?></h3>
						<ul>
							<?php foreach ( $feature_group['items'] as $feature_item ) : ?>
								<li><?php echo esc_html( $feature_item ); ?></li>
							<?php endforeach; ?>
						</ul>
					</article>
				<?php endforeach; ?>
			</div>
		</div>
	</section>
</main>
<?php
get_footer();
