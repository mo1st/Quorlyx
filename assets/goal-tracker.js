(function () {
	'use strict';

	document.addEventListener('DOMContentLoaded', function () {
		var goalData = window.quorlyxGoalTrackerData || {};
		var goals = Array.isArray(goalData.goals) ? goalData.goals : [];

		if (!goals.length) {
			return;
		}

		var hasGlobalConversionGoal = goals.some(function (goal) {
			return goal && goal.method === 'global_conversion';
		});
		var hasUrlConversionGoal = goals.some(function (goal) {
			return goal && goal.method === 'url';
		});

		var urlParams = new URLSearchParams(window.location.search);
		var hasUrlRef = urlParams.has('quorlyx_ref');
		var sessionKey = 'quorlyx_referred_session';

		if (hasUrlRef) {
			try {
				sessionStorage.setItem(sessionKey, 'true');
			} catch (e) {}
		} else {
			var referrer = document.referrer;
			var siteDomain = String(goalData.siteDomain || '');
			var isInternalReferrer = false;

			try {
				isInternalReferrer = !!referrer && new URL(referrer).hostname === siteDomain;
			} catch (e) {
				isInternalReferrer = false;
			}

			if (!isInternalReferrer) {
				try {
					sessionStorage.removeItem(sessionKey);
				} catch (e) {}
			}
		}

		var isReferredSession = false;
		try {
			isReferredSession = sessionStorage.getItem(sessionKey) === 'true';
		} catch (e) {}

		if (!isReferredSession && !hasGlobalConversionGoal && !hasUrlConversionGoal) {
			return;
		}

		var trackedGoalNames = new Set();

		function getCookie(name) {
			var value = '; ' + document.cookie;
			var parts = value.split('; ' + name + '=');
			if (parts.length === 2) {
				return parts.pop().split(';').shift();
			}
			return null;
		}

		var variation = getCookie('quorlyx_ab_variation') === 'b' ? 'b' : 'a';

		var commonGoalPresets = {
			wp_button_click: {
				event: 'click',
				selector: '.wp-block-button__link, .elementor-button, .et_pb_button, .vc_btn3, .fl-button, .fusion-button, a.button, button.button, input.button, [role="button"].wp-block-button__link'
			},
			contact_form_7_submit: {
				event: 'submit',
				selector: 'form.wpcf7-form',
				customEvents: ['wpcf7mailsent']
			},
			wpforms_submit: {
				event: 'submit',
				selector: 'form.wpforms-form'
			},
			gravity_forms_submit: {
				event: 'submit',
				selector: 'form[id^="gform_"], .gform_wrapper form'
			},
			elementor_form_submit: {
				event: 'submit',
				selector: 'form.elementor-form'
			},
			fluent_forms_submit: {
				event: 'submit',
				selector: 'form.frm-fluent-form, form.fluent_form, form[data-form_instance]'
			},
			ninja_forms_submit: {
				event: 'submit',
				selector: '.nf-form-cont form'
			},
			formidable_forms_submit: {
				event: 'submit',
				selector: 'form.frm-show-form'
			},
			woocommerce_add_to_cart: {
				event: 'click',
				selector: 'button.single_add_to_cart_button, a.add_to_cart_button, form.cart button[type="submit"], form.cart input[type="submit"]'
			},
			woocommerce_checkout_action: {
				event: 'click',
				selector: 'a.checkout-button, a.wc-forward[href*="checkout"], button#place_order, #place_order, button[name="woocommerce_checkout_place_order"]'
			},
			phone_link_click: {
				event: 'click',
				selector: 'a[href^="tel:"]'
			},
			email_link_click: {
				event: 'click',
				selector: 'a[href^="mailto:"]'
			},
			download_link_click: {
				event: 'click',
				selector: 'a[href], a[download]',
				filter: function (element) {
					if (element.hasAttribute('download')) {
						return true;
					}
					return /\.(pdf|zip|rar|7z|doc|docx|xls|xlsx|ppt|pptx|csv|mp3|mp4|mov|webm)([#?].*)?$/i.test(element.getAttribute('href') || '');
				}
			}
		};

		function trackConversion(goal) {
			if (!goal || !goal.name || trackedGoalNames.has(goal.name) || !goalData.restUrl) {
				return;
			}
			trackedGoalNames.add(goal.name);

			fetch(goalData.restUrl + 'track-conversion', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'X-WP-Nonce': goalData.nonce || ''
				},
				body: JSON.stringify({
					variation: variation,
					goal_name: goal.name,
					is_ab_goal: !!goal.is_ab_goal,
					ab_attributed: !!isReferredSession
				})
			}).catch(function () {});
		}

		function dispatchQuorlyxEvent(name, detail) {
			try {
				document.dispatchEvent(new CustomEvent(name, { detail: detail || {} }));
				return;
			} catch (e) {}

			try {
				var event = document.createEvent('CustomEvent');
				event.initCustomEvent(name, false, false, detail || {});
				document.dispatchEvent(event);
			} catch (e) {}
		}

		function markThankyouReached(detail) {
			detail = detail && typeof detail === 'object' ? detail : {};
			if (!detail.source) {
				detail.source = 'goal_tracker';
			}
			if (!detail.url) {
				detail.url = window.location.href;
			}

			if (window.Quorlyx && typeof window.Quorlyx.markConversion === 'function') {
				window.Quorlyx.markConversion(detail);
				return;
			}

			try {
				sessionStorage.setItem('quorlyx_session_thankyou_reached', 'true');
				sessionStorage.setItem('quorlyx_converted_v1', '1');
				sessionStorage.setItem('quorlyx_customer_status', 'converted');
			} catch (e) {}
			try {
				localStorage.setItem('quorlyx_customer_status', 'converted');
				localStorage.setItem('quorlyx_customer_converted_at', String(Date.now()));
			} catch (e) {}
			try {
				document.cookie = 'quorlyx_thankyou_reached=1; Max-Age=31536000; path=/; SameSite=Lax';
				document.cookie = 'quorlyx_customer_status=converted; Max-Age=31536000; path=/; SameSite=Lax';
			} catch (e) {}

			dispatchQuorlyxEvent('quorlyx:conversion', detail);
			dispatchQuorlyxEvent('quorlyx:thankyou-reached', detail);
		}

		function markConfiguredGoalReached(goal) {
			var detail = {
				source: 'configured_conversion_goal',
				goal_name: goal && goal.name ? String(goal.name) : '',
				goal_method: goal && goal.method ? String(goal.method) : '',
				quorlyxConfiguredGoal: true,
				url: window.location.href
			};

			try {
				sessionStorage.setItem('quorlyx_session_thankyou_reached', 'true');
				sessionStorage.setItem('quorlyx_converted_v1', '1');
				sessionStorage.setItem('quorlyx_customer_status', 'converted');
			} catch (e) {}
			try {
				localStorage.setItem('quorlyx_customer_status', 'converted');
				localStorage.setItem('quorlyx_customer_converted_at', String(Date.now()));
			} catch (e) {}
			try {
				document.cookie = 'quorlyx_thankyou_reached=1; Max-Age=31536000; path=/; SameSite=Lax';
				document.cookie = 'quorlyx_customer_status=converted; Max-Age=31536000; path=/; SameSite=Lax';
			} catch (e) {}

			dispatchQuorlyxEvent('quorlyx:configured-conversion-goal', detail);
			dispatchQuorlyxEvent('quorlyx:thankyou-reached', detail);
		}

		function safeMatches(element, selector) {
			if (!element || element.nodeType !== 1 || !selector) {
				return false;
			}

			try {
				return element.matches(selector);
			} catch (e) {
				return false;
			}
		}

		function closestMatch(target, selector) {
			var element = target;
			while (element && element !== document) {
				if (safeMatches(element, selector)) {
					return element;
				}
				element = element.parentElement;
			}
			return null;
		}

		function attachClickGoal(goal, selector, filter) {
			if (!selector) {
				return;
			}

			document.addEventListener('click', function (event) {
				var matched = closestMatch(event.target, selector);
				if (!matched) {
					return;
				}
				if (typeof filter === 'function' && !filter(matched, event)) {
					return;
				}
				trackConversion(goal);
			}, true);
		}

		function attachSubmitGoal(goal, selector, filter) {
			if (!selector) {
				return;
			}

			document.addEventListener('submit', function (event) {
				var matched = closestMatch(event.target, selector);
				if (!matched) {
					return;
				}
				if (typeof filter === 'function' && !filter(matched, event)) {
					return;
				}
				trackConversion(goal);
			}, true);
		}

		function attachCustomEventGoals(goal, eventNames) {
			if (!Array.isArray(eventNames)) {
				return;
			}

			eventNames.forEach(function (eventName) {
				if (!eventName) {
					return;
				}
				document.addEventListener(eventName, function () {
					trackConversion(goal);
				}, false);
			});
		}

		function bindCommonGoal(goal) {
			var preset = commonGoalPresets[goal.wp_action || 'wp_button_click'];
			if (!preset) {
				return;
			}

			if (preset.event === 'submit') {
				attachSubmitGoal(goal, preset.selector, preset.filter);
			} else {
				attachClickGoal(goal, preset.selector, preset.filter);
			}

			attachCustomEventGoals(goal, preset.customEvents);
		}

		function bindGlobalConversionGoal(goal) {
			var handler = function (event) {
				var detail = event && event.detail && typeof event.detail === 'object' ? event.detail : {};
				if (detail.quorlyxConfiguredGoal === true || detail.source === 'configured_conversion_goal') {
					return;
				}
				trackConversion(goal);
			};

			document.addEventListener('quorlyx:conversion', handler, true);
			window.addEventListener('quorlyx:conversion', handler, true);
		}

		function isWooOrderReceivedPage() {
			if (goalData.has_woo && goalData.woo && goalData.woo.is_order_received_page) {
				return true;
			}

			var href = window.location.href || '';
			var path = window.location.pathname || '';
			return /order-received/i.test(href) || /\/order-received(\/?|\b)/i.test(path);
		}

		goals.forEach(function (goal) {
			if (goal && goal.method === 'global_conversion') {
				bindGlobalConversionGoal(goal);
			}
		});

		if (hasGlobalConversionGoal && isWooOrderReceivedPage()) {
			markThankyouReached({
				source: 'woocommerce_order_received',
				provider: 'woocommerce',
				event: 'order_received_page',
				url: window.location.href
			});
		}

		goals.forEach(function (goal) {
			var match = false;
			var shouldMarkConversionState = false;

			if (!isReferredSession && goal.method !== 'url' && goal.method !== 'global_conversion') {
				return;
			}

			switch (goal.method) {
				case 'global_conversion':
					return;
				case 'url':
					var goalUrl = String(goal.url || '');
					if (!goalUrl) {
						match = true;
						shouldMarkConversionState = true;
					} else if (window.location.href.indexOf(goalUrl) !== -1) {
						match = true;
						shouldMarkConversionState = true;
					}
					break;
				case 'woo_product_visit':
					if (goalData.has_woo && goalData.woo && goalData.woo.is_product_page) {
						match = goal.woo_product_scope === 'any' ||
							(goal.woo_product_scope === 'specific' &&
								Array.isArray(goal.woo_products) &&
								goal.woo_products.indexOf(goalData.woo.product_id) !== -1);
					}
					break;
				case 'selector_click':
					attachClickGoal(goal, goal.selector || '');
					return;
				case 'selector_submit':
					attachSubmitGoal(goal, goal.selector || '');
					return;
				case 'wp_common':
					bindCommonGoal(goal);
					return;
			}

			if (!match) {
				return;
			}

			if (shouldMarkConversionState) {
				markConfiguredGoalReached(goal);
			}

			trackConversion(goal);
		});

		if (hasUrlRef) {
			urlParams.delete('quorlyx_ref');
			var newUrl = window.location.pathname + (urlParams.toString() ? '?' + urlParams.toString() : '') + window.location.hash;
			window.history.replaceState({}, document.title, newUrl);
		}
	});
})();
