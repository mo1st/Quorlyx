(function ($) {
	'use strict';

	if (typeof window.quorlyxBehaviorTracker === 'undefined') {
		return;
	}

	var cfg = window.quorlyxBehaviorTracker || {};
	var settings = cfg.settings || {};
	var postId = Number(cfg.post_id || 0);
	var contentKey = String(cfg.content_key || '');

	function normalizeContentKeySegment(rawValue) {
		var value = String(rawValue || '').toLowerCase();
		value = value.replace(/[^a-z0-9_]+/g, '_').replace(/^_+|_+$/g, '');
		if (!value) {
			return '';
		}

		if (value.length > 48) {
			value = value.slice(0, 48);
		}

		return value;
	}

	function deriveFallbackContentKey() {
		if (postId || contentKey) {
			return '';
		}

		var pathName = String(window.location.pathname || '/').toLowerCase();
		if ('/' === pathName || '' === pathName) {
			return 'homepage';
		}

		var normalizedPath = normalizeContentKeySegment(pathName);
		if (!normalizedPath) {
			return '';
		}

		return 'route_' + normalizedPath;
	}

	var effectiveContentKey = contentKey || deriveFallbackContentKey();
	var contentType = String(cfg.content_type || 'unknown');
	var analyticsId = effectiveContentKey || ('post_' + String(postId));
	var ajaxUrl = String(cfg.ajax_url || '');
	var nonce = String(cfg.nonce || '');
	var productId = Number(cfg.product_id || 0);

	if (!settings.enabled || !ajaxUrl || !nonce || (!postId && !effectiveContentKey)) {
		return;
	}

	var storageKey = 'quorlyx_behavior_profile_v1';
	var sessionVisitKey = 'quorlyx_behavior_visit_' + analyticsId;
	var sessionGlobalVisitKey = 'quorlyx_behavior_session_v1';
	var sessionIdKey = 'quorlyx_behavior_session_id_v1';
	var conversionSessionKey = 'quorlyx_converted_v1';
	var customConversionSessionPrefix = 'quorlyx_custom_conversion_v1_';
	var sessionPagesKey = 'quorlyx_behavior_session_pages_v2';
	var sessionScrollDepthKey = 'quorlyx_behavior_session_scroll_depth_v1';
	var entrySourceKey = 'quorlyx_behavior_entry_source_v1';
	var trafficSourceKey = 'quorlyx_behavior_traffic_source_v1';
	var abandonmentKey = 'quorlyx_behavior_abandonment_v1';
	var chatKey = 'quorlyx_behavior_chat_v1';
	var snapshotMetaKey = 'quorlyx_behavior_snapshot_meta_v1';
	var syncIntervalMinutes = Math.max(1, parseInt(settings.sync_interval_minutes, 10) || 15);
	var syncIntervalMs = syncIntervalMinutes * 60 * 1000;
	var syncBatchDelayMs = Math.max(500, Math.min(10000, parseInt(settings.batch_delay_ms, 10) || 2000));
	var minSnapshotGapMs = Math.max(2000, Math.min(60000, parseInt(settings.min_snapshot_gap_seconds, 10) || 8) * 1000);
	var trackWooPurchase = false !== settings.track_woocommerce_purchase;
	var customConversions = normalizeCustomConversions(settings.custom_conversions || []);
	var includeCheckoutFlow = !!settings.include_checkout_flow;
	var startTime = Date.now();
	var maxScroll = 0;
	var currentPageRegistered = false;
	var chatStartedFallback = false;
	var pendingSyncTimer = null;
	var pendingSyncReason = '';

	function readSessionValue(key) {
		try {
			return window.sessionStorage.getItem(key);
		} catch (e) {
			return null;
		}
	}

	function writeSessionValue(key, value) {
		try {
			window.sessionStorage.setItem(key, value);
			return true;
		} catch (e) {
			return false;
		}
	}

	function removeSessionValue(key) {
		try {
			window.sessionStorage.removeItem(key);
		} catch (e) {
			// No-op when storage is unavailable.
		}
	}

	var randomFallbackCounter = 0;

	function generateRandomSuffix() {
		var cryptoObj = window.crypto || window.msCrypto;
		if (cryptoObj && typeof cryptoObj.randomUUID === 'function') {
			return cryptoObj.randomUUID().replace(/-/g, '');
		}

		if (cryptoObj && typeof cryptoObj.getRandomValues === 'function' && typeof Uint32Array !== 'undefined') {
			var values = cryptoObj.getRandomValues(new Uint32Array(4));
			var parts = [];
			for (var i = 0; i < values.length; i++) {
				parts.push(values[i].toString(36));
			}
			return parts.join('');
		}

		randomFallbackCounter += 1;
		return String(Date.now()) + '_' + String(randomFallbackCounter);
	}

	function generateProfileId() {
		return 'qbx_' + String(Date.now()) + '_' + generateRandomSuffix();
	}

	function getSessionId() {
		var sid = readSessionValue(sessionIdKey);
		if (!sid) {
			sid = 'sess_' + String(Date.now()) + '_' + generateRandomSuffix();
			writeSessionValue(sessionIdKey, sid);
		}
		return sid;
	}

	function loadProfile() {
		var profile = null;
		try {
			profile = JSON.parse(window.localStorage.getItem(storageKey) || '{}');
		} catch (e) {
			profile = {};
		}

		if (!profile || typeof profile !== 'object') {
			profile = {};
		}

		if (!profile.profile_id) {
			profile.profile_id = generateProfileId();
		}

		if (!profile.content || typeof profile.content !== 'object') {
			profile.content = {};
		}

		return profile;
	}

	function saveProfile(profile) {
		try {
			window.localStorage.setItem(storageKey, JSON.stringify(profile));
		} catch (e) {
			// No-op when storage is unavailable.
		}
	}

	function ensureGlobalMetric(profile) {
		if (!profile.behavior_global || typeof profile.behavior_global !== 'object') {
			profile.behavior_global = {
				visit_frequency: 0,
				pages_viewed: 0,
				scroll_depth_avg: 0
			};
		}

		return profile.behavior_global;
	}

	function normalizePageType(value) {
		var type = String(value || '').toLowerCase();
		if ('product' === type || 'post' === type || 'page' === type || 'homepage' === type || 'cart' === type || 'checkout' === type) {
			return type;
		}
		return 'unknown';
	}

	function detectCurrentPageType() {
		var type = normalizePageType(contentType);
		if ('unknown' !== type) {
			return type;
		}

		var path = String(window.location.pathname || '').toLowerCase();
		var bodyClass = '';
		if (document.body && typeof document.body.className === 'string') {
			bodyClass = document.body.className.toLowerCase();
		}

		if (path.indexOf('/checkout') === 0 || bodyClass.indexOf('woocommerce-checkout') !== -1) {
			return 'checkout';
		}
		if (path.indexOf('/cart') === 0 || bodyClass.indexOf('woocommerce-cart') !== -1) {
			return 'cart';
		}
		if ('homepage' === effectiveContentKey || bodyClass.indexOf('home') !== -1 || bodyClass.indexOf('blog') !== -1) {
			return 'homepage';
		}
		if (bodyClass.indexOf('single-product') !== -1) {
			return 'product';
		}
		if (bodyClass.indexOf('single-post') !== -1) {
			return 'post';
		}
		if (bodyClass.indexOf('page') !== -1) {
			return 'page';
		}

		return 'unknown';
	}

	function readSessionPages() {
		var pages = [];
		try {
			pages = JSON.parse(window.sessionStorage.getItem(sessionPagesKey) || '[]');
		} catch (e) {
			pages = [];
		}

		if (!Array.isArray(pages)) {
			pages = [];
		}

		return pages.map(function (item) {
			if (typeof item === 'string') {
				return {
					id: String(item),
					type: 'unknown',
					post_id: 0,
					content_key: '',
					url: '',
					views: 1
				};
			}

			if (!item || typeof item !== 'object') {
				return null;
			}

			var id = String(item.id || '');
			if (!id) {
				return null;
			}

			return {
				id: id,
				type: normalizePageType(item.type),
				post_id: Math.max(0, Number(item.post_id || 0)),
				content_key: String(item.content_key || ''),
				url: String(item.url || ''),
				views: Math.max(1, Number(item.views || 1))
			};
		}).filter(function (item) {
			return !!item;
		});
	}

	function writeSessionPages(pages) {
		try {
			window.sessionStorage.setItem(sessionPagesKey, JSON.stringify(pages));
		} catch (e) {
			// No-op when storage is unavailable.
		}
	}

	function removeSessionScrollDepthEntry(pageId) {
		if (!pageId) {
			return;
		}

		var map = readSessionScrollDepthMap();
		if (!map || typeof map !== 'object' || Array.isArray(map)) {
			return;
		}

		if (Object.prototype.hasOwnProperty.call(map, pageId)) {
			delete map[pageId];
			writeSessionScrollDepthMap(map);
		}
	}

	function shouldResetSessionJourney() {
		return false;
	}

	function registerSessionPage() {
		var pages = readSessionPages();
		if (currentPageRegistered) {
			return pages;
		}

		var pageEntry = {
			id: analyticsId,
			type: detectCurrentPageType(),
			post_id: Math.max(0, postId),
			content_key: effectiveContentKey,
			url: String(window.location.pathname || ''),
			views: 1
		};

		if (shouldResetSessionJourney(pages, pageEntry)) {
			removeSessionScrollDepthEntry((pages[0] || {}).id);
			pages = [];
		}

		var index = -1;
		for (var i = 0; i < pages.length; i += 1) {
			if (pages[i].id === pageEntry.id) {
				index = i;
				break;
			}
		}

		if (index === -1) {
			pages.push(pageEntry);
		} else {
			var existing = pages[index];
			existing.type = ('unknown' === existing.type && 'unknown' !== pageEntry.type) ? pageEntry.type : existing.type;
			existing.post_id = pageEntry.post_id || existing.post_id;
			existing.content_key = pageEntry.content_key || existing.content_key;
			existing.url = existing.url || pageEntry.url;
			existing.views = Math.max(1, Number(existing.views || 1)) + 1;

			pages.splice(index, 1);
			pages.push(existing);
		}

		writeSessionPages(pages);
		currentPageRegistered = true;

		return pages;
	}

	function readSessionScrollDepthMap() {
		var map = {};
		try {
			map = JSON.parse(window.sessionStorage.getItem(sessionScrollDepthKey) || '{}');
		} catch (e) {
			map = {};
		}

		if (!map || typeof map !== 'object' || Array.isArray(map)) {
			map = {};
		}

		return map;
	}

	function writeSessionScrollDepthMap(map) {
		try {
			window.sessionStorage.setItem(sessionScrollDepthKey, JSON.stringify(map));
		} catch (e) {
			// No-op when storage is unavailable.
		}
	}

	function isScrollExcludedPage() {
		var pageType = detectCurrentPageType();
		return ('cart' === pageType || 'checkout' === pageType);
	}

	function getSessionAverageScrollDepth() {
		if (isScrollExcludedPage()) {
			return 0;
		}

		var map = readSessionScrollDepthMap();
		var keys = Object.keys(map);
		if (!keys.length) {
			return 0;
		}

		var total = 0;
		var count = 0;
		keys.forEach(function (key) {
			var depth = Math.max(0, Math.min(100, Number(map[key] || 0)));
			if (depth > 0) {
				total += depth;
				count += 1;
			}
		});

		if (!count) {
			return 0;
		}

		return Math.round(total / count);
	}

	function updateSessionAverageScrollDepth(metric, globalMetric) {
		if (isScrollExcludedPage()) {
			return;
		}

		var map = readSessionScrollDepthMap();
		var depth = Math.max(0, Math.min(100, Number(metric.scroll_depth_max || 0)));
		var previousDepth = Math.max(0, Math.min(100, Number(map[analyticsId] || 0)));

		if (depth > previousDepth) {
			map[analyticsId] = depth;
			writeSessionScrollDepthMap(map);
		}

		globalMetric.scroll_depth_avg = getSessionAverageScrollDepth();
	}

	function resolveEntrySource() {
		var source = null;

		try {
			source = JSON.parse(window.sessionStorage.getItem(entrySourceKey) || 'null');
		} catch (e) {
			source = null;
		}

		if (!source || typeof source !== 'object') {
			source = {
				post_id: postId,
				content_key: effectiveContentKey,
				product_id: productId
			};

			try {
				window.sessionStorage.setItem(entrySourceKey, JSON.stringify(source));
			} catch (e) {
				// No-op when storage is unavailable.
			}
		}

		if (!source.post_id && !source.content_key) {
			source.post_id = postId;
			source.content_key = effectiveContentKey;
		}

		return {
			post_id: Number(source.post_id || 0),
			content_key: String(source.content_key || effectiveContentKey || ''),
			product_id: Number(source.product_id || 0)
		};
	}

	function getCurrentTrafficSourceSegment() {
		var url;
		try {
			url = new URL(window.location.href);
		} catch (e) {
			return 'direct';
		}

		var source = String(url.searchParams.get('utm_source') || '').toLowerCase();
		var medium = String(url.searchParams.get('utm_medium') || '').toLowerCase();
		var hasPaidClickId = !!(url.searchParams.get('gclid') || url.searchParams.get('fbclid') || url.searchParams.get('msclkid'));

		if (hasPaidClickId || /(cpc|ppc|paid|display|retargeting)/.test(medium)) {
			return 'paid';
		}
		if (/(email|newsletter)/.test(medium) || /(email|mail|newsletter)/.test(source)) {
			return 'email';
		}
		if (/(social|social-media)/.test(medium) || /(facebook|instagram|twitter|x\.com|linkedin|tiktok|pinterest|youtube)/.test(source)) {
			return 'social';
		}

		var ref = String(document.referrer || '');
		if (!ref) {
			return 'direct';
		}

		try {
			var refHost = String(new URL(ref).hostname || '').toLowerCase();
			var currentHost = String(window.location.hostname || '').toLowerCase();
			if (refHost && currentHost && refHost !== currentHost) {
				if (/(google\.|bing\.|yahoo\.|duckduckgo\.|baidu\.|yandex\.)/.test(refHost)) {
					return 'search';
				}
				return 'referral';
			}
		} catch (e) {
			return 'direct';
		}

		return 'direct';
	}

	function resolveTrafficSourceSegment() {
		var stored = '';
		try {
			stored = String(window.sessionStorage.getItem(trafficSourceKey) || '');
		} catch (e) {
			stored = '';
		}

		if (stored) {
			return stored;
		}

		var current = getCurrentTrafficSourceSegment();
		try {
			window.sessionStorage.setItem(trafficSourceKey, current);
		} catch (e) {
			// No-op when storage is unavailable.
		}

		return current;
	}

	function resolveAbandonmentStage() {
		if (!includeCheckoutFlow) {
			return '';
		}

		if (getHasCloserConversion()) {
			clearAbandonmentStage();
			return '';
		}

		var path = String(window.location.pathname || '').toLowerCase();
		var className = '';
		if (document.body && typeof document.body.className === 'string') {
			className = document.body.className.toLowerCase();
		}

		var existingStage = String(readSessionValue(abandonmentKey) || '');
		var currentStage = '';

		if (path.indexOf('/checkout') === 0 || className.indexOf('woocommerce-checkout') !== -1) {
			currentStage = 'abandoned_checkout';
		} else if (path.indexOf('/cart') === 0 || className.indexOf('woocommerce-cart') !== -1) {
			currentStage = 'viewed_cart';
		}

		if ('abandoned_checkout' === existingStage) {
			currentStage = 'abandoned_checkout';
		} else if (!currentStage) {
			currentStage = existingStage;
		}

		if (currentStage) {
			writeSessionValue(abandonmentKey, currentStage);
		}

		return currentStage;
	}

	function ensureMetric(profile) {
		if (!profile.content[analyticsId] || typeof profile.content[analyticsId] !== 'object') {
			profile.content[analyticsId] = {
				visit_frequency: 0,
				pages_viewed: 0,
				dwell_time_total: 0,
				dwell_samples: 0,
				scroll_depth_max: 0,
				cart_activity: 0,
				last_sync_at: 0,
				last_updated: 0
			};
		}

		return profile.content[analyticsId];
	}

	function finalizeDwell(metric) {
		var now = Date.now();
		var additionalSeconds = Math.floor((now - startTime) / 1000);
		if (additionalSeconds > 0) {
			metric.dwell_time_total = Number(metric.dwell_time_total || 0) + additionalSeconds;
			metric.dwell_samples = Number(metric.dwell_samples || 0) + 1;
			startTime = now;
		}

		if (maxScroll > Number(metric.scroll_depth_max || 0)) {
			metric.scroll_depth_max = maxScroll;
		}

		metric.last_updated = Math.floor(now / 1000);
	}

	function normalizeCustomConversions(conversions) {
		var allowedTypes = {
			form_submit: true,
			click: true,
			event: true
		};
		var dedupe = {};
		var normalized = {
			form_submit: [],
			click: [],
			event: []
		};

		if (!Array.isArray(conversions)) {
			return normalized;
		}

		conversions.forEach(function (conversion) {
			if (!conversion || typeof conversion !== 'object') {
				return;
			}

			var type = String(conversion.type || '').toLowerCase().trim();
			var target = String(conversion.target || '').trim();
			if (!allowedTypes[type] || !target) {
				return;
			}

			var key = type + '::' + target;
			if (dedupe[key]) {
				return;
			}

			dedupe[key] = true;
			normalized[type].push({
				type: type,
				target: target
			});
		});

		return normalized;
	}

	function getCustomConversionSessionKey(type, target) {
		return customConversionSessionPrefix + String(type) + '_' + encodeURIComponent(String(target));
	}

	function markCustomConversion(type, target) {
		if (!type || !target) {
			return false;
		}

		var key = getCustomConversionSessionKey(type, target);
		try {
			if (window.sessionStorage.getItem(key)) {
				return false;
			}
			window.sessionStorage.setItem(key, '1');
			return true;
		} catch (e) {
			return false;
		}
	}

	function isCustomConversionMatched(type, target) {
		if (!type || !target) {
			return false;
		}

		return !!readSessionValue(getCustomConversionSessionKey(type, target));
	}

	function hasMatchedCustomConversions() {
		var hasMatch = false;
		Object.keys(customConversions).forEach(function (type) {
			if (hasMatch) {
				return;
			}
			customConversions[type].forEach(function (rule) {
				if (hasMatch) {
					return;
				}
				if (isCustomConversionMatched(type, rule.target)) {
					hasMatch = true;
				}
			});
		});
		return hasMatch;
	}

	function markMatchingCustomEventConversion(eventName) {
		if (!eventName) {
			return false;
		}

		var matched = false;
		customConversions.event.forEach(function (rule) {
			if (rule.target !== eventName) {
				return;
			}
			if (markCustomConversion('event', rule.target)) {
				matched = true;
			}
		});

		return matched;
	}

	function notifyGlobalConversion(detail) {
		var payload = detail && typeof detail === 'object' ? detail : {};

		if (window.Quorlyx && typeof window.Quorlyx.markConversion === 'function') {
			window.Quorlyx.markConversion(payload);
			return;
		}

		markConfirmedConversion(payload);
	}

	function registerCustomEventConversionListeners() {
		var boundEvents = {};
		customConversions.event.forEach(function (rule) {
			if (!rule.target || boundEvents[rule.target]) {
				return;
			}
			boundEvents[rule.target] = true;

			var onCustomEvent = function () {
				if (markMatchingCustomEventConversion(rule.target)) {
					notifyGlobalConversion({
						provider: 'custom',
						source: 'behavior_custom_conversion',
						type: 'event',
						target: rule.target
					});
				}
			};

			document.addEventListener(rule.target, onCustomEvent, true);
			window.addEventListener(rule.target, onCustomEvent, true);
		});
	}

	function hasFormSubmitCustomConversions() {
		return Array.isArray(customConversions.form_submit) && customConversions.form_submit.length > 0;
	}

	function hasClickCustomConversions() {
		return Array.isArray(customConversions.click) && customConversions.click.length > 0;
	}

	function shouldTrackFormSubmit(form) {
		if (!form || !form.tagName || 'FORM' !== String(form.tagName).toUpperCase()) {
			return false;
		}

		var action = String(form.getAttribute('action') || '').toLowerCase();
		if (action.indexOf('/checkout') !== -1 || action.indexOf('/cart') !== -1) {
			return false;
		}

		var formClass = String(form.className || '').toLowerCase();
		if (formClass.indexOf('woocommerce-cart-form') !== -1 || formClass.indexOf('checkout') !== -1) {
			return false;
		}

		return true;
	}

	function getCookie(name) {
		var value = '; ' + document.cookie;
		var parts = value.split('; ' + name + '=');
		if (parts.length === 2) {
			return parts.pop().split(';').shift();
		}
		return null;
	}

	function clearAbandonmentStage() {
		removeSessionValue(abandonmentKey);
	}

	function hasGlobalConfirmedConversion() {
		try {
			if (window.sessionStorage.getItem(conversionSessionKey) === '1' || window.sessionStorage.getItem('quorlyx_customer_status') === 'converted') {
				return true;
			}
		} catch (e) {}

		try {
			if (window.localStorage.getItem('quorlyx_customer_status') === 'converted' || window.localStorage.getItem('quorlyx_customer_converted_at')) {
				return true;
			}
		} catch (e) {}

		return getCookie('quorlyx_thankyou_reached') === '1' || getCookie('quorlyx_customer_status') === 'converted';
	}

	function getHasCloserConversion() {
		if (hasGlobalConfirmedConversion()) {
			return true;
		}

		if (trackWooPurchase) {
			try {
				if (window.sessionStorage.getItem(conversionSessionKey) === '1') {
					return true;
				}
			} catch (e) {}
		}

		return hasMatchedCustomConversions();
	}

	function getConversionStatus() {
		return getHasCloserConversion() ? 'closer' : 'non_converter';
	}

	function markConfirmedConversion(detail) {
		try {
			window.sessionStorage.setItem(conversionSessionKey, '1');
			window.sessionStorage.setItem('quorlyx_session_thankyou_reached', 'true');
			window.sessionStorage.setItem('quorlyx_customer_status', 'converted');
		} catch (e) {}

		try {
			window.localStorage.setItem('quorlyx_customer_status', 'converted');
			window.localStorage.setItem('quorlyx_customer_converted_at', String(Date.now()));
		} catch (e) {}

		clearAbandonmentStage();

		markMatchingCustomEventConversion('conversion');
		markMatchingCustomEventConversion('purchase');
		markMatchingCustomEventConversion('quorlyx:conversion');
		markMatchingCustomEventConversion('quorlyx_conversion');

		scheduleSnapshotSync('conversion');
	}

	function registerConfirmedConversionListener() {
		var handler = function (event) {
			markConfirmedConversion((event && event.detail) || {});
		};

		document.addEventListener('quorlyx:conversion', handler, true);
		window.addEventListener('quorlyx:conversion', handler, true);
	}

	function hasStartedChat() {
		try {
			return !!window.sessionStorage.getItem(chatKey);
		} catch (e) {
			return !!chatStartedFallback;
		}
	}

	function markChatStarted() {
		var wasStarted = hasStartedChat();

		if (!wasStarted) {
			try {
				window.sessionStorage.setItem(chatKey, '1');
			} catch (e) {
				chatStartedFallback = true;
			}
		}

		markMatchingCustomEventConversion('chat_started');
		markMatchingCustomEventConversion('quorlyx_chat_started');
		markMatchingCustomEventConversion('quorlyx:chat-started');

		if (!wasStarted) {
			scheduleSnapshotSync('milestone');
		}
	}

	function registerNativeChatStartListeners() {
		var detectOpenAfterClick = function () {
			window.setTimeout(function () {
				var panel = document.querySelector('.quorlyx-chat-panel');
				if (panel && panel.classList && panel.classList.contains('quorlyx-open')) {
					markChatStarted();
				}
			}, 0);
		};

		document.addEventListener('click', function (event) {
			var target = event && event.target ? event.target : null;
			if (!target || typeof target.closest !== 'function') {
				return;
			}

			if (target.closest('.quorlyx-fab') || target.closest('.quorlyx-chat-panel .quorlyx-send-btn')) {
				detectOpenAfterClick();
			}
		}, true);

		document.addEventListener('submit', function (event) {
			var form = event && event.target ? event.target : null;
			if (!form || typeof form.matches !== 'function') {
				return;
			}

			if (form.matches('.quorlyx-chat-form') || form.matches('.quorlyx-chat-panel .quorlyx-chat-form')) {
				markChatStarted();
			}
		}, true);

		document.addEventListener('keydown', function (event) {
			var key = String((event && event.key) || '').toLowerCase();
			if ('enter' !== key) {
				return;
			}

			var target = event && event.target ? event.target : null;
			if (!target || typeof target.matches !== 'function') {
				return;
			}

			if (target.matches('#quorlyx_chat_input') || target.matches('.quorlyx-chat-panel #quorlyx_chat_input')) {
				markChatStarted();
			}
		}, true);

		if (typeof window.MutationObserver === 'function') {
			var observerRoot = document.body || document.documentElement;
			if (!observerRoot) {
				return;
			}

			var observer = new window.MutationObserver(function (mutationList) {
				for (var i = 0; i < mutationList.length; i += 1) {
					var mutation = mutationList[i];
					if (!mutation || 'attributes' !== mutation.type || !mutation.target || !mutation.target.classList) {
						continue;
					}

					if (!mutation.target.classList.contains('quorlyx-chat-panel')) {
						continue;
					}

					if (mutation.target.classList.contains('quorlyx-open')) {
						markChatStarted();
						break;
					}
				}
			});

			observer.observe(observerRoot, {
				attributes: true,
				attributeFilter: ['class'],
				subtree: true
			});
		}
	}

	function getAverageDwell(metric) {
		var samples = Number(metric.dwell_samples || 0);
		if (samples <= 0) {
			return 0;
		}
		return Math.round(Number(metric.dwell_time_total || 0) / samples);
	}

	function getSessionAverageDwell() {
		var pages = readSessionPages();
		if (!pages.length) {
			return 0;
		}

		var totalSeconds = 0;
		var totalSamples = 0;
		var content = profile.content || {};

		pages.forEach(function (page) {
			var m = content[page.id];
			if (m) {
				totalSeconds += Number(m.dwell_time_total || 0);
				totalSamples += Number(m.dwell_samples || 0);
			}
		});

		if (!totalSamples) {
			return 0;
		}
		return Math.round(totalSeconds / totalSamples);
	}

	function getSessionTotalDwellSamples() {
		var pages = readSessionPages();
		var total = 0;
		var content = profile.content || {};
		pages.forEach(function (page) {
			var m = content[page.id];
			if (m) {
				total += Number(m.dwell_samples || 0);
			}
		});
		return Math.max(1, total);
	}

	function getSessionCumulativeCartActivity() {
		var pages = readSessionPages();
		var total = 0;
		var content = profile.content || {};
		pages.forEach(function (page) {
			var m = content[page.id];
			if (m) {
				total += Number(m.cart_activity || 0);
			}
		});
		return total;
	}

	function getLastEligiblePage(pages) {
		for (var i = pages.length - 1; i >= 0; i -= 1) {
			var page = pages[i] || {};
			var pageType = normalizePageType(page.type);
			if ('cart' === pageType || 'checkout' === pageType) {
				continue;
			}

			return {
				post_id: Math.max(0, Number(page.post_id || 0)),
				content_key: String(page.content_key || '')
			};
		}

		return {
			post_id: 0,
			content_key: ''
		};
	}

	function calculateCategoryBreakdown(pages) {
		var counts = {};
		var total = 0;

		pages.forEach(function (page) {
			var pageType = normalizePageType(page.type);
			if ('cart' === pageType || 'checkout' === pageType || 'unknown' === pageType) {
				return;
			}

			var weight = Math.max(1, Number(page.views || 1));
			counts[pageType] = (counts[pageType] || 0) + weight;
			total += weight;
		});

		if (!total) {
			return '{}';
		}

		var keys = Object.keys(counts);
		var percentages = {};
		var running = 0;
		var topKey = '';

		keys.forEach(function (key) {
			if (!topKey || counts[key] > counts[topKey]) {
				topKey = key;
			}
			percentages[key] = Math.round((counts[key] / total) * 100);
			running += percentages[key];
		});

		if (topKey && running !== 100) {
			percentages[topKey] = Math.max(0, Math.min(100, percentages[topKey] + (100 - running)));
		}

		return JSON.stringify(percentages);
	}

	function buildPayload(metric, globalMetric, entrySource, reason) {
		var pages = readSessionPages();
		var lastPage = getLastEligiblePage(pages);
		var abandonmentStage = resolveAbandonmentStage();
		var conversionStatus = getConversionStatus();
		var trafficSource = resolveTrafficSourceSegment();

		if ('closer' === conversionStatus) {
			abandonmentStage = '';
			clearAbandonmentStage();
		}

		var visitedPath = pages.map(function(p) { return p.url || ''; }).filter(function(url, index, self) {
			return url !== '' && self.indexOf(url) === index;
		});

		return {
			action: 'quorlyx_track_behavior_snapshot',
			nonce: nonce,
			sync_reason: String(reason || 'interval'),
			post_id: postId,
			content_key: effectiveContentKey,
			current_post_id: postId,
			current_content_key: effectiveContentKey,
			entry_post_id: Math.max(0, Number(entrySource.post_id || 0)),
			entry_content_key: String(entrySource.content_key || ''),
			last_post_id: Math.max(0, Number(lastPage.post_id || 0)),
			last_content_key: String(lastPage.content_key || ''),
			category_breakdown: calculateCategoryBreakdown(pages),
			abandonment_stage: abandonmentStage,
			traffic_source: trafficSource,
			started_chat: hasStartedChat() ? 1 : 0,
			product_id: Math.max(0, Number(entrySource.product_id || 0)),
			profile_id: String(profile.profile_id || ''),
			session_id: getSessionId(),
			visited_path: JSON.stringify(visitedPath),
			visit_frequency: Math.max(0, Number(globalMetric.visit_frequency || 0)),
			pages_viewed: Math.max(0, Number(globalMetric.pages_viewed || 0)),
			dwell_time_avg: Math.max(0, getSessionAverageDwell()),
			cart_activity: Math.max(0, getSessionCumulativeCartActivity()),
			scroll_depth: Math.max(0, Math.min(100, Number(globalMetric.scroll_depth_avg || 0))),
			conversion_status: conversionStatus,
			dwell_samples: getSessionTotalDwellSamples()
		};
	}

	function getSnapshotSignature(payload) {
		if (!payload || typeof payload !== 'object') {
			return '';
		}

		var signaturePayload = {
			post_id: payload.post_id,
			content_key: payload.content_key,
			entry_post_id: payload.entry_post_id,
			entry_content_key: payload.entry_content_key,
			last_post_id: payload.last_post_id,
			last_content_key: payload.last_content_key,
			category_breakdown: payload.category_breakdown,
			abandonment_stage: payload.abandonment_stage,
			traffic_source: payload.traffic_source,
			started_chat: payload.started_chat,
			product_id: payload.product_id,
			visited_path: payload.visited_path,
			visit_frequency: payload.visit_frequency,
			pages_viewed: payload.pages_viewed,
			dwell_time_avg: payload.dwell_time_avg,
			cart_activity: payload.cart_activity,
			scroll_depth: payload.scroll_depth,
			conversion_status: payload.conversion_status,
			dwell_samples: payload.dwell_samples
		};

		try {
			return JSON.stringify(signaturePayload);
		} catch (e) {
			return '';
		}
	}

	function readSnapshotMeta() {
		var meta = null;
		try {
			meta = JSON.parse(window.sessionStorage.getItem(snapshotMetaKey) || 'null');
		} catch (e) {
			meta = null;
		}

		if (!meta || typeof meta !== 'object') {
			meta = {};
		}

		return {
			signature: String(meta.signature || ''),
			sent_at: Math.max(0, Number(meta.sent_at || 0))
		};
	}

	function writeSnapshotMeta(signature) {
		try {
			window.sessionStorage.setItem(snapshotMetaKey, JSON.stringify({
				signature: String(signature || ''),
				sent_at: Date.now()
			}));
		} catch (e) {
			// No-op when storage is unavailable.
		}
	}

	function isImmediateSyncReason(reason) {
		return 'beforeunload' === reason || 'visibility_hidden' === reason || 'initial_live_prediction' === reason || 'conversion' === reason;
	}

	function hasHighIntentSignal(payload) {
		if (!payload || typeof payload !== 'object') {
			return false;
		}

		return 'closer' === String(payload.conversion_status || '') ||
			Number(payload.started_chat || 0) > 0 ||
			Number(payload.cart_activity || 0) > 0 ||
			'viewed_cart' === String(payload.abandonment_stage || '') ||
			'abandoned_checkout' === String(payload.abandonment_stage || '');
	}

	function isDuplicateOrTooSoon(payload, reason) {
		var signature = getSnapshotSignature(payload);
		var meta = readSnapshotMeta();
		var now = Date.now();

		if (signature && signature === meta.signature) {
			return true;
		}

		if (!isImmediateSyncReason(reason) && !hasHighIntentSignal(payload) && meta.sent_at > 0 && (now - meta.sent_at) < minSnapshotGapMs) {
			return true;
		}

		return false;
	}

	function asFormData(payload) {
		var data = new window.FormData();
		Object.keys(payload).forEach(function (key) {
			data.append(key, String(payload[key]));
		});
		return data;
	}

	function emitPredictionEvent(responseData) {
		if (!responseData || typeof responseData !== 'object') {
			return;
		}

		if (!responseData.next_step_prediction || typeof responseData.next_step_prediction !== 'object') {
			return;
		}

		var detail = {
			pattern_tag: String(responseData.pattern_tag || ''),
			pattern_label: String(responseData.pattern_label || ''),
			next_step_prediction: responseData.next_step_prediction,
			data_version: String(responseData.data_version || '')
		};

		try {
			window.dispatchEvent(new window.CustomEvent('quorlyx_behavior_prediction', {
				detail: detail
			}));
		} catch (e) {
			// No-op when CustomEvent is not available.
		}

		if (document.body) {
			$(document.body).trigger('quorlyx_behavior_prediction', [detail]);
		}
	}

	function handleTrackerResponse(response) {
		if (!response || typeof response !== 'object') {
			return;
		}

		if (response.data && response.data.skipped) {
			return;
		}

		if (!response.success || !response.data) {
			return;
		}

		emitPredictionEvent(response.data);
	}

	function postPayload(payload, useBeacon, signature) {
		if (useBeacon && navigator.sendBeacon) {
			if (navigator.sendBeacon(ajaxUrl, asFormData(payload))) {
				writeSnapshotMeta(signature);
			}
			return;
		}

		if (window.fetch) {
			window.fetch(ajaxUrl, {
				method: 'POST',
				body: asFormData(payload),
				credentials: 'same-origin',
				keepalive: !!useBeacon
			}).then(function (fetchResponse) {
				if (!fetchResponse || typeof fetchResponse.json !== 'function') {
					return null;
				}
				return fetchResponse.json();
			}).then(function (jsonResponse) {
				handleTrackerResponse(jsonResponse);
				if (jsonResponse && jsonResponse.success) {
					writeSnapshotMeta(signature);
				}
			}).catch(function () {
				// No-op when response cannot be parsed.
			});
			return;
		}

		$.post(ajaxUrl, payload).done(function (response) {
			handleTrackerResponse(response);
			if (response && response.success) {
				writeSnapshotMeta(signature);
			}
		});
	}

	function shouldSync(metric, reason) {
		if ('milestone' === reason || 'initial_live_prediction' === reason || 'beforeunload' === reason || 'visibility_hidden' === reason || 'conversion' === reason) {
			return true;
		}

		var nowTs = Math.floor(Date.now() / 1000);
		var lastSync = Number(metric.last_sync_at || 0);
		return (nowTs - lastSync) >= (syncIntervalMinutes * 60);
	}

	function syncSnapshot(reason) {
		var metric = ensureMetric(profile);
		var globalMetric = ensureGlobalMetric(profile);
		var sessionPages = registerSessionPage();
		globalMetric.pages_viewed = Math.max(Number(globalMetric.pages_viewed || 0), sessionPages.length);

		// Correctly update per-page view count for the current analytics context.
		var currentPageData = sessionPages.find(function(p) { return p.id === analyticsId; });
		if (currentPageData) {
			metric.pages_viewed = Math.max(Number(metric.pages_viewed || 0), currentPageData.views || 0);
		}
		finalizeDwell(metric);
		updateSessionAverageScrollDepth(metric, globalMetric);
		resolveAbandonmentStage();

		if (!shouldSync(metric, reason)) {
			saveProfile(profile);
			return;
		}

		var payload = buildPayload(metric, globalMetric, entrySource, reason);
		if (isDuplicateOrTooSoon(payload, reason)) {
			saveProfile(profile);
			return;
		}

		var useBeacon = ('beforeunload' === reason || 'visibility_hidden' === reason);
		postPayload(payload, useBeacon, getSnapshotSignature(payload));

		metric.last_sync_at = Math.floor(Date.now() / 1000);
		saveProfile(profile);
	}

	function scheduleSnapshotSync(reason) {
		var syncReason = String(reason || 'milestone');

		if (isImmediateSyncReason(syncReason)) {
			if (pendingSyncTimer) {
				window.clearTimeout(pendingSyncTimer);
				pendingSyncTimer = null;
				pendingSyncReason = '';
			}
			syncSnapshot(syncReason);
			return;
		}

		pendingSyncReason = syncReason;
		if (pendingSyncTimer) {
			return;
		}

		pendingSyncTimer = window.setTimeout(function () {
			var reasonToSend = pendingSyncReason || 'milestone';
			pendingSyncTimer = null;
			pendingSyncReason = '';
			syncSnapshot(reasonToSend);
		}, syncBatchDelayMs);
	}

	function updateMaxScroll() {
		var docHeight = Math.max($(document).height(), 1);
		var winHeight = $(window).height();
		var scrollTop = $(window).scrollTop();
		var percent = Math.round(((scrollTop + winHeight) / docHeight) * 100);
		if (percent > 100) {
			percent = 100;
		}
		if (percent > maxScroll) {
			maxScroll = percent;
		}
	}

	var profile = loadProfile();
	var metric = ensureMetric(profile);
	var globalMetric = ensureGlobalMetric(profile);
	var sessionPages = registerSessionPage();
	var entrySource = resolveEntrySource();
	var isFirstVisitInSession = false;

	// Increment global visit_frequency only once per browser session (not per page type).
	if (!readSessionValue(sessionGlobalVisitKey)) {
		globalMetric.visit_frequency = Number(globalMetric.visit_frequency || 0) + 1;
		writeSessionValue(sessionGlobalVisitKey, '1');
	}

	// Track per-page visits within session to trigger milestone sync on each new page.
	if (!readSessionValue(sessionVisitKey)) {
		metric.visit_frequency = Number(metric.visit_frequency || 0) + 1;
		writeSessionValue(sessionVisitKey, '1');
		isFirstVisitInSession = true;
	}

	globalMetric.pages_viewed = Math.max(Number(globalMetric.pages_viewed || 0), sessionPages.length);

	// Per-page view count: track how many times this specific page was viewed, not session total.
	var initPageData = sessionPages.find(function(p) { return p.id === analyticsId; });
	if (initPageData) {
		metric.pages_viewed = Math.max(Number(metric.pages_viewed || 0), initPageData.views || 0);
	}
	updateSessionAverageScrollDepth(metric, globalMetric);
	resolveAbandonmentStage();
	saveProfile(profile);

	if (Number(metric.scroll_depth_max || 0) > maxScroll) {
		maxScroll = Number(metric.scroll_depth_max || 0);
	}

	if (isFirstVisitInSession) {
		window.setTimeout(function () {
			scheduleSnapshotSync('initial_live_prediction');
		}, 5000);
	}

	$(window).on('scroll', updateMaxScroll);

	$(document.body).on('added_to_cart', function () {
		metric.cart_activity = Number(metric.cart_activity || 0) + 1;
		markMatchingCustomEventConversion('added_to_cart');
		scheduleSnapshotSync('milestone');
	});

	$(document.body).on('quorlyx_chat_started quorlyx:chat-started', function () {
		markChatStarted();
	});

	registerNativeChatStartListeners();

	registerCustomEventConversionListeners();

	registerConfirmedConversionListener();

	if (getHasCloserConversion()) {
		window.setTimeout(function () {
			scheduleSnapshotSync('conversion');
		}, 1200);
	}

	document.addEventListener('submit', function (event) {
		if (!hasFormSubmitCustomConversions()) {
			return;
		}

		var form = event && event.target ? event.target : null;
		if (!form || !shouldTrackFormSubmit(form) || typeof form.matches !== 'function') {
			return;
		}

		var matched = false;
		customConversions.form_submit.forEach(function (rule) {
			var selectorMatch = false;
			try {
				selectorMatch = form.matches(rule.target);
			} catch (e) {
				selectorMatch = false;
			}

			if (selectorMatch && markCustomConversion('form_submit', rule.target)) {
				matched = true;
				notifyGlobalConversion({
					provider: 'custom',
					source: 'behavior_custom_conversion',
					type: 'form_submit',
					target: rule.target
				});
			}
		});

		if (matched) {
			scheduleSnapshotSync('milestone');
		}
	}, true);

	document.addEventListener('click', function (event) {
		if (!hasClickCustomConversions()) {
			return;
		}

		var target = event && event.target ? event.target : null;
		if (!target || typeof target.closest !== 'function') {
			return;
		}

		var matched = false;
		customConversions.click.forEach(function (rule) {
			var selectorMatch = false;
			try {
				selectorMatch = !!target.closest(rule.target);
			} catch (e) {
				selectorMatch = false;
			}

			if (selectorMatch && markCustomConversion('click', rule.target)) {
				matched = true;
				notifyGlobalConversion({
					provider: 'custom',
					source: 'behavior_custom_conversion',
					type: 'click',
					target: rule.target
				});
			}
		});

		if (matched) {
			scheduleSnapshotSync('milestone');
		}
	}, true);

	document.addEventListener('visibilitychange', function () {
		if (document.visibilityState === 'hidden') {
			syncSnapshot('visibility_hidden');
		}
	});

	window.addEventListener('beforeunload', function () {
		syncSnapshot('beforeunload');
	});

	window.setInterval(function () {
		syncSnapshot('interval');
	}, syncIntervalMs);
})(jQuery);
