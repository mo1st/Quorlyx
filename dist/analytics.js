jQuery(document).ready(function ($) {
	if (typeof quorlyxAnalytics === 'undefined') {
		return;
	}

	var postId = Number(quorlyxAnalytics.post_id || 0);
	if (!isFinite(postId) || postId < 0) {
		postId = 0;
	}
	postId = Math.floor(postId);

	var contentKey = String(quorlyxAnalytics.content_key || '').trim();
	if (postId <= 0 && !contentKey) {
		return;
	}

	var attributionSource = contentKey || (postId > 0 ? String(postId) : '');
	if (!attributionSource) {
		return;
	}

	var analyticsId = contentKey || ('post_' + postId);
	var nonce = quorlyxAnalytics.nonce;
	var ajaxUrl = quorlyxAnalytics.ajax_url;
	var conversionTrackingMode = String(quorlyxAnalytics.conversion_tracking_mode || 'any');
	var shouldTrackGenericConversions = conversionTrackingMode !== 'conversion_goals';
	var startTime = Date.now();
	var maxScroll = 0;
	var lastScrollSent = 0;
	var eventQueue = [];
	var flushTimer = null;

	function withContext(payload) {
		payload = payload || {};
		if (postId > 0) {
			payload.post_id = postId;
		}
		if (contentKey) {
			payload.content_key = contentKey;
		}
		payload.nonce = nonce;
		return payload;
	}

	function flushEvents(isBeacon) {
		if (!eventQueue.length) {
			return;
		}

		var events = eventQueue.splice(0, 25);
		var data = new FormData();
		data.append('action', 'quorlyx_track_analytics_batch');
		data.append('nonce', nonce);
		data.append('events', JSON.stringify(events));

		if (isBeacon && navigator.sendBeacon) {
			navigator.sendBeacon(ajaxUrl, data);
			return;
		}

		if (window.fetch) {
			fetch(ajaxUrl, { method: 'POST', body: data, keepalive: !!isBeacon });
			return;
		}

		$.ajax({ url: ajaxUrl, method: 'POST', data: data, processData: false, contentType: false });
	}

	function queueEvent(type, payload, immediate, isBeacon) {
		payload = withContext(payload || {});
		payload.type = type;
		eventQueue.push(payload);

		if (immediate || eventQueue.length >= 10) {
			flushEvents(!!isBeacon);
			return;
		}

		if (!flushTimer) {
			flushTimer = setTimeout(function () {
				flushTimer = null;
				flushEvents(false);
			}, 5000);
		}
	}

	function postAction(payload, immediate, isBeacon) {
		var actionMap = {
			quorlyx_track_view: 'view',
			quorlyx_track_time: 'time',
			quorlyx_track_scroll: 'scroll',
			quorlyx_track_atc: 'atc',
			quorlyx_track_conversion: 'conversion'
		};
		var type = payload.type || actionMap[payload.action];
		if (!type) {
			return;
		}
		delete payload.action;
		queueEvent(type, payload, !!immediate, !!isBeacon);
	}

	if (!sessionStorage.getItem('quorlyx_viewed_' + analyticsId)) {
		postAction({ action: 'quorlyx_track_view' }, true, false);
		sessionStorage.setItem('quorlyx_viewed_' + analyticsId, '1');
	}

	function sendTime(isBeacon) {
		var now = Date.now();
		var additionalTime = Math.floor((now - startTime) / 1000);
		if (additionalTime <= 0) {
			return;
		}

		postAction({ action: 'quorlyx_track_time', seconds: additionalTime }, !!isBeacon, !!isBeacon);

		startTime = now;
	}

	function sendScroll(isBeacon) {
		if (maxScroll <= 0 || maxScroll === lastScrollSent) {
			return;
		}

		lastScrollSent = maxScroll;
		postAction({ action: 'quorlyx_track_scroll', depth: maxScroll }, !!isBeacon, !!isBeacon);
	}

	setInterval(function () {
		sendTime(false);
		flushEvents(false);
	}, 30000);

	$(window).on('scroll', function () {
		var docHeight = Math.max($(document).height(), 1);
		var winHeight = $(window).height();
		var scrollTop = $(window).scrollTop();
		var scrollPercent = Math.round(((scrollTop + winHeight) / docHeight) * 100);

		if (scrollPercent > 100) {
			scrollPercent = 100;
		}

		if (scrollPercent > maxScroll) {
			maxScroll = scrollPercent;
		}
	});

	document.addEventListener('visibilitychange', function () {
		if (document.visibilityState === 'hidden') {
			sendTime(true);
			sendScroll(true);
		}
	});

	window.addEventListener('beforeunload', function () {
		sendTime(true);
		sendScroll(true);
	});

	$(document.body).on('added_to_cart', function () {
		postAction({ action: 'quorlyx_track_atc' }, true, false);
	});

	function sendConversionEvent() {
		if (!shouldTrackGenericConversions) {
			return;
		}

		if (sessionStorage.getItem('quorlyx_converted_' + analyticsId)) {
			return;
		}

		postAction({ action: 'quorlyx_track_conversion' }, true, true);

		sessionStorage.setItem('quorlyx_converted_' + analyticsId, '1');
	}

	function appendQuorlyxParamToLink(el) {
		try {
			var href = el.getAttribute('href');
			if (!href || href.indexOf('mailto:') === 0 || href.indexOf('tel:') === 0) {
				return;
			}

			var tmp = document.createElement('a');
			tmp.href = href;
			if (tmp.origin !== location.origin) {
				return;
			}

			try {
				var u = new URL(tmp.href, location.href);
				u.searchParams.set('quorlyx_src', attributionSource);
				el.setAttribute('href', u.toString());
			} catch (e) {
				if (href.indexOf('#') === 0) {
					return;
				}
				el.setAttribute('href', href + (href.indexOf('?') === -1 ? '?' : '&') + 'quorlyx_src=' + encodeURIComponent(attributionSource));
			}
		} catch (e) {}
	}

	var contentAnchors = document.querySelectorAll('article a, .entry-content a, .post-content a');
	if (contentAnchors && contentAnchors.length) {
		contentAnchors.forEach(function (a) {
			appendQuorlyxParamToLink(a);
			a.addEventListener('click', function () {
				sendConversionEvent();
			}, { passive: true });
		});
	} else {
		document.querySelectorAll('a').forEach(function (a) {
			a.addEventListener('click', function () {
				sendConversionEvent();
			}, { passive: true });
		});
	}

	var date = new Date();
	date.setTime(date.getTime() + (30 * 24 * 60 * 60 * 1000));

	if (postId > 0) {
		document.cookie = 'quorlyx_attribution_post_id=' + postId + '; expires=' + date.toUTCString() + '; path=/';
	} else {
		document.cookie = 'quorlyx_attribution_post_id=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
	}

	if (contentKey) {
		document.cookie = 'quorlyx_attribution_content_key=' + contentKey + '; expires=' + date.toUTCString() + '; path=/';
	} else {
		document.cookie = 'quorlyx_attribution_content_key=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
	}
});
