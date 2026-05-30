(function () {
    document.dispatchEvent(new CustomEvent('quorlyx:prevent-default-triggers'));

    const ACTIVITY_KEY = 'quorlyx_session_has_activity';
    const THANKYOU_KEY = 'quorlyx_session_thankyou_reached';
    const THANKYOU_COOKIE = 'quorlyx_thankyou_reached';
    const CONVERSION_STATUS_KEY = 'quorlyx_customer_status';
    const CONVERSION_TIME_KEY = 'quorlyx_customer_converted_at';
    const CONVERSION_SESSION_KEY = 'quorlyx_converted_v1';
    const CONVERSION_COOKIE_MAX_AGE = 31536000;

    const getQuorlyxCookie = (name) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return null;
    };

    const setQuorlyxCookie = (name, value, maxAge) => {
        try {
            let cookie = `${name}=${encodeURIComponent(value || '')}; path=/; SameSite=Lax`;
            const seconds = Number(maxAge || 0);
            if (Number.isFinite(seconds) && seconds > 0) {
                cookie += `; Max-Age=${Math.floor(seconds)}`;
            }
            document.cookie = cookie;
        } catch (e) {}
    };

    const emitQuorlyxEvent = (name, detail) => {
        try {
            document.dispatchEvent(new CustomEvent(name, { detail: detail || {} }));
            return;
        } catch (e) {}

        try {
            const event = document.createEvent('CustomEvent');
            event.initCustomEvent(name, false, false, detail || {});
            document.dispatchEvent(event);
        } catch (e) {}
    };

    window.Quorlyx = window.Quorlyx || {};
    window.Quorlyx.hasConverted = function () {
        try {
            if (sessionStorage.getItem(THANKYOU_KEY) === 'true' || sessionStorage.getItem(CONVERSION_SESSION_KEY) === '1' || sessionStorage.getItem(CONVERSION_STATUS_KEY) === 'converted') {
                return true;
            }
        } catch (e) {}
        try {
            if (localStorage.getItem(CONVERSION_STATUS_KEY) === 'converted' || localStorage.getItem(CONVERSION_TIME_KEY)) {
                return true;
            }
        } catch (e) {}
        return getQuorlyxCookie(THANKYOU_COOKIE) === '1' || getQuorlyxCookie(CONVERSION_STATUS_KEY) === 'converted';
    };
    window.Quorlyx.markConversion = function (detail) {
        const payload = detail && typeof detail === 'object' ? detail : {};
        const convertedAt = String(Date.now());
        try {
            sessionStorage.setItem(THANKYOU_KEY, 'true');
            sessionStorage.setItem(CONVERSION_SESSION_KEY, '1');
            sessionStorage.setItem(CONVERSION_STATUS_KEY, 'converted');
        } catch (e) {}
        try {
            localStorage.setItem(CONVERSION_STATUS_KEY, 'converted');
            localStorage.setItem(CONVERSION_TIME_KEY, convertedAt);
        } catch (e) {}
        setQuorlyxCookie(THANKYOU_COOKIE, '1', CONVERSION_COOKIE_MAX_AGE);
        setQuorlyxCookie(CONVERSION_STATUS_KEY, 'converted', CONVERSION_COOKIE_MAX_AGE);
        setQuorlyxCookie(CONVERSION_TIME_KEY, convertedAt, CONVERSION_COOKIE_MAX_AGE);
        emitQuorlyxEvent('quorlyx:conversion', payload);
        emitQuorlyxEvent('quorlyx:thankyou-reached', payload);
        return true;
    };
    window.Quorlyx.markAsPurchaser = window.Quorlyx.markConversion;
    window.Quorlyx.markPurchase = window.Quorlyx.markConversion;
    window.Quorlyx.markPaymentSuccess = window.Quorlyx.markConversion;
    window.Quorlyx.markCheckoutSuccess = window.Quorlyx.markConversion;
    window.Quorlyx.installGenericConversionBridge = function () {
        if (window.__quorlyxGenericConversionBridgeInstalled) {
            return true;
        }

        const bridgeEvents = [
            'quorlyx:payment-success',
            'quorlyx:purchase-success',
            'quorlyx:checkout-success',
            'quorlyx:order-completed',
            'quorlyx_payment_success',
            'payment_success',
            'purchase_success',
            'checkout_success',
        ];

        const getSameOrigin = (origin) => {
            if (!origin) {
                return '';
            }

            try {
                return new URL(origin).origin;
            } catch (e) {
                return '';
            }
        };

        const isSameOriginMessage = (origin) => {
            return getSameOrigin(origin) === window.location.origin;
        };

        const shouldAcceptGenericMessage = (data) => {
            if (!data || typeof data !== 'object') {
                return false;
            }

            const eventName = String(data.event || data.type || data.name || '');
            return data.quorlyxConversion === true || data.quorlyx_conversion === true || bridgeEvents.indexOf(eventName) !== -1;
        };

        const markFromBridge = (detail) => {
            if (!window.Quorlyx || typeof window.Quorlyx.markConversion !== 'function') {
                return false;
            }

            const payload = detail && typeof detail === 'object' ? detail : {};
            let signature = '';
            try {
                signature = JSON.stringify({
                    source: payload.source || '',
                    provider: payload.provider || '',
                    event: payload.event || '',
                });
            } catch (e) {
                signature = '';
            }

            const now = Date.now();
            if (signature && signature === window.__quorlyxGenericConversionLastSignature && now - Number(window.__quorlyxGenericConversionLastAt || 0) < 1000) {
                return false;
            }
            window.__quorlyxGenericConversionLastSignature = signature;
            window.__quorlyxGenericConversionLastAt = now;

            window.Quorlyx.markConversion(payload);
            return true;
        };

        window.__quorlyxGenericConversionBridgeInstalled = true;
        bridgeEvents.forEach((eventName) => {
            const handler = (event) => {
                markFromBridge({
                    provider: 'custom',
                    source: 'generic_conversion_event',
                    event: eventName,
                    detail: (event && event.detail) || {},
                });
            };
            document.addEventListener(eventName, handler, true);
            window.addEventListener(eventName, handler, true);
        });

        window.addEventListener('message', (messageEvent) => {
            const data = messageEvent && messageEvent.data;
            if (!isSameOriginMessage(messageEvent.origin) || !shouldAcceptGenericMessage(data)) {
                return;
            }

            markFromBridge({
                provider: String(data.provider || 'custom'),
                source: 'generic_same_origin_message',
                event: String(data.event || data.type || data.name || 'quorlyx_conversion_message'),
                data: data,
            });
        }, false);

        return true;
    };
    window.Quorlyx.installGenericConversionBridge();

    window.QuorlyxTriggerController = {
        init: function (triggers, fireCallback) {
            this.triggers = triggers || [];
            this.fireCallback = fireCallback;
            this.pageHasFired = false;
            this.sessionHasActivity = this.getActivityState();
            this.sessionThankyouReached = this.getThankyouState();
            this.listeners = [];
            this.pendingPanelTriggers = {};
            this.initialScrollY = window.scrollY;
            this.cartMonitorHandle = null;
            this.cartItemsLast = null;

            this.detectInitialActivity();
            this.startCartMonitor();
            this.setupActivityListeners();

            try {
                if (this.isOnThankyouNow()) {
                    this.setThankyouState();
                }
            } catch (e) {}

            try {
                (this.triggers || []).forEach((t) => this.markVisitedFromCurrentUrl(t));
            } catch (e) {}

            this.setupTriggers();
        },

        getCookie: function (name) {
            const value = `; ${document.cookie}`;
            const parts = value.split(`; ${name}=`);
            if (parts.length === 2) return parts.pop().split(';').shift();
            return null;
        },

        setCookie: function (name, value, maxAge) {
            try {
                let cookie = `${name}=${encodeURIComponent(value || '')}; path=/; SameSite=Lax`;
                const seconds = Number(maxAge || 0);
                if (Number.isFinite(seconds) && seconds > 0) {
                    cookie += `; Max-Age=${Math.floor(seconds)}`;
                }
                document.cookie = cookie;
            } catch (e) {}
        },

        detectInitialActivity: function () {
            try {
                const items = this.getCartCount();
                this.cartItemsLast = items;
                if (items > 0) {
                    this.setActivityState();
                }
            } catch (e) {}
        },

        startCartMonitor: function () {
            if (this.cartMonitorHandle) return;
            this.cartMonitorHandle = setInterval(() => {
                const count = this.getCartCount();
                if (count !== this.cartItemsLast) {
                    this.cartItemsLast = count;
                    if (count > 0) {
                        this.setActivityState();
                    }
                }
            }, 1500);
        },

        getCartCount: function () {
            try {
                const raw = this.getCookie('woocommerce_items_in_cart');
                const num = parseInt(raw || '0', 10);
                return isNaN(num) ? 0 : num;
            } catch (e) {
                return 0;
            }
        },

        getEnvWoo: function () {
            const env = window.quorlyxVars || {};
            return env.woo || { cart_count: 0, is_order_received_page: false };
        },

        isCartEmptyNow: function () {
            const envWoo = this.getEnvWoo();

            const cookieCount = this.getCartCount();
            return parseInt(envWoo.cart_count || 0, 10) <= 0 && cookieCount <= 0;
        },

        isOnThankyouNow: function () {
            const envWoo = this.getEnvWoo();
            if (envWoo.is_order_received_page) return true;
            const href = window.location.href;
            const path = window.location.pathname || '';
            if (/order-received/i.test(href)) return true;
            if (/\/order-received(\/?|\b)/i.test(path)) return true;
            if (/thank-?you/i.test(href)) return true;
            return false;
        },

        getTriggerNormalSessionKey: function (trigger) {
            const triggerId = (trigger && trigger.id) ? String(trigger.id) : 'unknown';
            return 'quorlyx_session_trigger_fired_' + triggerId;
        },

        hasNormalFiredForTrigger: function (trigger) {
            try {
                return sessionStorage.getItem(this.getTriggerNormalSessionKey(trigger)) === 'true';
            } catch (e) {
                return false;
            }
        },

        setSessionFiredState: function (trigger) {
            try {
                sessionStorage.setItem(this.getTriggerNormalSessionKey(trigger), 'true');
            } catch (e) {}
        },

        getTriggerOverrideSessionKey: function (trigger) {
            const triggerId = (trigger && trigger.id) ? String(trigger.id) : 'unknown';
            return 'quorlyx_session_override_fired_' + triggerId;
        },

        hasOverrideFiredForTrigger: function (trigger) {
            try {
                return sessionStorage.getItem(this.getTriggerOverrideSessionKey(trigger)) === 'true';
            } catch (e) {
                return false;
            }
        },

        setSessionOverrideFiredState: function (trigger) {
            try {
                sessionStorage.setItem(this.getTriggerOverrideSessionKey(trigger), 'true');
            } catch (e) {}
        },

        getActivityState: function () {
            try {
                return sessionStorage.getItem(ACTIVITY_KEY) === 'true';
            } catch (e) {
                return false;
            }
        },

        setActivityState: function () {
            this.sessionHasActivity = true;
            try {
                sessionStorage.setItem(ACTIVITY_KEY, 'true');
            } catch (e) {}
        },

        getThankyouState: function () {
            try {
                if (window.Quorlyx && typeof window.Quorlyx.hasConverted === 'function' && window.Quorlyx.hasConverted()) {
                    return true;
                }
            } catch (e) {}
            try {
                if (sessionStorage.getItem(THANKYOU_KEY) === 'true') return true;
                if (sessionStorage.getItem(CONVERSION_SESSION_KEY) === '1' || sessionStorage.getItem(CONVERSION_STATUS_KEY) === 'converted') return true;
                if (localStorage.getItem(CONVERSION_STATUS_KEY) === 'converted' || localStorage.getItem(CONVERSION_TIME_KEY)) return true;
            } catch (e) {}
            const c = this.getCookie(THANKYOU_COOKIE);
            return c === '1' || this.getCookie(CONVERSION_STATUS_KEY) === 'converted';
        },

        setThankyouState: function () {
            this.sessionThankyouReached = true;
            try {
                sessionStorage.setItem(THANKYOU_KEY, 'true');
                sessionStorage.setItem(CONVERSION_SESSION_KEY, '1');
                sessionStorage.setItem(CONVERSION_STATUS_KEY, 'converted');
                localStorage.setItem(CONVERSION_STATUS_KEY, 'converted');
                localStorage.setItem(CONVERSION_TIME_KEY, String(Date.now()));

                const c = this.getCookie('quorlyx_attribution_trigger_id') || this.activeTriggerId;
                if (c) {
                    const convKey = 'quorlyx_tc_' + c;
                    if (!sessionStorage.getItem(convKey)) {
                        this.trackTriggerEvent({ id: c }, 'trigger_converted');
                        sessionStorage.setItem(convKey, '1');
                    }
                }
            } catch (e) {}
            this.setCookie(THANKYOU_COOKIE, '1', CONVERSION_COOKIE_MAX_AGE);
            this.setCookie(CONVERSION_STATUS_KEY, 'converted', CONVERSION_COOKIE_MAX_AGE);
        },

        isConversionSuppressionEnabled: function (trigger) {
            return !trigger || false !== trigger.suppress_after_conversion;
        },

        shouldSuppressAfterConversion: function (trigger) {
            if (!this.isConversionSuppressionEnabled(trigger)) {
                return false;
            }
            return !!(this.sessionThankyouReached || this.isOnThankyouNow());
        },

        getVisitedHashesFromTrigger: function (trigger) {
            const raw = trigger && trigger.suppress_if_visited_url_contains ? String(trigger.suppress_if_visited_url_contains) : '';
            if (!raw.trim()) return [];
            const lines = raw
                .split(/\r?\n|,/)
                .map((s) => s.trim())
                .filter(Boolean);
            return lines.map((s) => this.hash12(s));
        },

        hash12: function (s) {
            let h = 5381;
            for (let i = 0; i < s.length; i++) {
                h = (h << 5) + h + s.charCodeAt(i);
                h &= 0xffffffff;
            }
            return (h >>> 0).toString(16).padStart(8, '0');
        },

        setVisitedHash: function (hash) {
            try {
                sessionStorage.setItem('qu_v_' + hash, '1');
            } catch (e) {}
            this.setCookie('qu_v_' + hash, '1');
        },

        hasVisitedHash: function (hash) {
            try {
                if (sessionStorage.getItem('qu_v_' + hash) === '1') return true;
            } catch (e) {}
            return this.getCookie('qu_v_' + hash) === '1';
        },

        markVisitedFromCurrentUrl: function (trigger) {
            if (!trigger) return;
            const raw = (trigger.suppress_if_visited_url_contains || '').toString();
            if (!raw.trim()) return;
            const href = window.location.href;
            raw
                .split(/\r?\n|,/)
                .map((s) => s.trim())
                .filter(Boolean)
                .forEach((part) => {
                    if (href.indexOf(part) !== -1) {
                        const hash = this.hash12(part);
                        this.setVisitedHash(hash);
                    }
                });
        },

        hasActivity: function () {
            if (this.sessionHasActivity) {
                return true;
            }
            const count = this.getCartCount();
            if (count > 0) {
                this.setActivityState();
                return true;
            }
            return false;
        },

        setupActivityListeners: function () {
            document.addEventListener('quorlyx:activity', () => this.setActivityState(), { passive: true });
            document.addEventListener('quorlyx:conversion', () => {
                this.setActivityState();
                this.setThankyouState();
                this.cleanupListeners(true);
                this.cleanupListeners(false);
                const c = this.getCookie('quorlyx_attribution_trigger_id') || this.activeTriggerId;
                if (c) {
                    const convKey = 'quorlyx_tc_' + c;
                    if (!sessionStorage.getItem(convKey)) {
                        this.trackTriggerEvent({ id: c }, 'trigger_converted');
                        sessionStorage.setItem(convKey, '1');
                    }
                }
            }, { passive: true });
            document.addEventListener('quorlyx:thankyou-reached', () => this.setThankyouState(), { passive: true });

            document.addEventListener(
                'click',
                (e) => {
                    const chatSel = '.quorlyx-quick-action, .quorlyx-quick-reply, .quorlyx-quick-btn, .quorlyx-gen-btn, .quorlyx-cta, .quorlyx-chat-send, .quorlyx-send-btn, .quorlyx-open-chat, .quorlyx-convert';
                    const wooSel = 'button.single_add_to_cart_button, a.add_to_cart_button, form.cart [type="submit"], a.checkout-button, button#place_order';
                    if (e.target && e.target.closest) {
                        if (e.target.closest(chatSel) || e.target.closest(wooSel)) {
                            this.setActivityState();
                        }
                        
                        if (e.target.closest('.quorlyx-convert') || e.target.closest(wooSel)) {
                            const c = this.getCookie('quorlyx_attribution_trigger_id') || this.activeTriggerId;
                            if (c) {
                                const convKey = 'quorlyx_tc_' + c;
                                if (!sessionStorage.getItem(convKey)) {
                                    this.trackTriggerEvent({ id: c }, 'trigger_converted');
                                    sessionStorage.setItem(convKey, '1');
                                }
                            }
                        }
                    }
                },
                { capture: true }
            );

            document.addEventListener(
                'submit',
                (e) => {
                    if (!e.target || !e.target.matches) return;
                    if (e.target.matches('form.cart, form.checkout, form.woocommerce-cart-form')) {
                        this.setActivityState();
                    }
                },
                true
            );

            if (window.jQuery && jQuery.fn && jQuery(document).on) {
                try {
                    jQuery(document.body).on(
                        'added_to_cart cart_page_refreshed updated_wc_div wc_cart_button_updated checkout_place_order wc_fragments_loaded wc_fragments_refreshed',
                        () => {
                            this.setActivityState();
                        }
                    );
                } catch (e) {}
            }
        },

        canFireNormal: function (trigger) {
            if (this.shouldSuppressAfterConversion(trigger)) return false;

            if (this.pageHasFired) return false;

            const freq = trigger.firing_frequency || 'once_per_session';
            if (freq === 'once_per_page') return true;

            return !this.hasNormalFiredForTrigger(trigger);
        },

        canFireOverride: function (trigger) {
            if (!trigger.override_priority) return false;

            if (this.shouldSuppressAfterConversion(trigger)) return false;

            const freq = trigger.firing_frequency || 'once_per_session';
            if (freq !== 'once_per_page' && freq !== 'unlimited' && this.hasOverrideFiredForTrigger(trigger)) return false;

            if (trigger.only_if_cart_empty && !this.isCartEmptyNow()) return false;

            const hashes = this.getVisitedHashesFromTrigger(trigger);
            if (hashes.some((h) => this.hasVisitedHash(h))) return false;
            return true;
        },

        isChatPanelOpen: function () {
            const panel = document.querySelector('.quorlyx-chat-panel');
            return !!(panel && panel.classList && panel.classList.contains('quorlyx-open'));
        },

        deferTriggerUntilPanelAvailable: function (trigger) {
            const triggerId = String((trigger && trigger.id) || '');
            if (!triggerId || this.pendingPanelTriggers[triggerId]) return;

            this.pendingPanelTriggers[triggerId] = true;
            const handle = setInterval(() => {
                if (this.isChatPanelOpen()) return;

                clearInterval(handle);
                delete this.pendingPanelTriggers[triggerId];
                this.executeTrigger(trigger);
            }, 500);
            this.listeners.push({ id: 'panel_wait_' + triggerId, type: 'interval', handle, isOverride: !!(trigger && trigger.override_priority) });
        },

        executeTrigger: function (trigger) {
            if (trigger.only_if_cart_empty && !this.isCartEmptyNow()) return;

            const hashes = this.getVisitedHashesFromTrigger(trigger);
            if (hashes.some((h) => this.hasVisitedHash(h))) return;

            if (this.isChatPanelOpen()) {
                this.deferTriggerUntilPanelAvailable(trigger);
                return;
            }

            if (trigger.override_priority) {
                if (!this.canFireOverride(trigger)) return;

                if (typeof this.fireCallback === 'function') {
                    this.fireCallback(trigger);
                }
                this.setSessionOverrideFiredState(trigger);

                this.cleanupTriggerListeners(trigger);
            } else {
                if (!this.canFireNormal(trigger)) return;
                this.pageHasFired = true;
                this.setSessionFiredState(trigger);
                if (typeof this.fireCallback === 'function') {
                    this.fireCallback(trigger);
                }

                this.cleanupListeners(false);
            }
        },

        setupTriggers: function () {
            this.triggers.forEach((trigger) => {
                if (!trigger.is_active) {
                    return;
                }

                if (!this.meetsStaticConditions(trigger)) {
                    return;
                }

                let listener;
                let listenerId = 'listener_' + trigger.id;
                const isOverride = !!trigger.override_priority;

                switch (trigger.type) {
                    case 'time_on_page':
                        listener = setTimeout(() => this.executeTrigger(trigger), trigger.time_delay * 1000);
                        this.listeners.push({ id: listenerId, type: 'timeout', handle: listener, isOverride });
                        break;

                    case 'scroll_depth':
                        listener = () => {
                            if (window.scrollY <= this.initialScrollY) return;

                            const scrollPercent = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
                            if (scrollPercent >= trigger.scroll_depth) {
                                this.executeTrigger(trigger);
                            }
                        };
                        window.addEventListener('scroll', listener, { passive: true });
                        this.listeners.push({ id: listenerId, type: 'event', name: 'scroll', func: listener, isOverride });
                        break;

                    case 'exit_intent': {
                        const fireOnce = () => {
                            this.executeTrigger(trigger);
                        };

                        const mouseOutListener = (e) => {
                            const rel = e.relatedTarget || e.toElement;
                            const leavingDocument = !rel || rel === document.documentElement || rel === document.body;
                            const nearTop = e.clientY <= 0 || e.screenY <= 0 || e.clientY < 10;

                            if (nearTop && leavingDocument) {
                                fireOnce();
                            }
                        };
                        document.documentElement.addEventListener('mouseout', mouseOutListener, { passive: true });
                        this.listeners.push({
                            id: listenerId + '_mo',
                            type: 'event',
                            name: 'mouseout',
                            func: mouseOutListener,
                            target: document.documentElement,
                            isOverride,
                        });
                        break;
                    }
                    case 'section_view': {
                        const selector = String((trigger && trigger.target_section_selector) || '').trim();
                        if (!selector) {
                            listener = setTimeout(() => this.executeTrigger(trigger), 150);
                            this.listeners.push({ id: listenerId + '_section_view_any', type: 'timeout', handle: listener, isOverride });
                        }
                        break;
                    }
                    case 'behavior_pattern':
                        listener = setTimeout(() => this.executeTrigger(trigger), 0);
                        this.listeners.push({ id: listenerId + '_behavior_pattern', type: 'timeout', handle: listener, isOverride });
                        break;
                }

                if (trigger.fake_exit_button_enabled) {
                    const wrap = document.createElement('div');
                    wrap.className = 'quorlyx-fake-exit-wrap pos-' + (trigger.fake_exit_button_position || 'bottom_right');
                    wrap.style.fontSize = (trigger.fake_exit_button_size || 32) + 'px';
                    wrap.style.zIndex = '999990';

                    const text = document.createElement('div');
                    text.className = 'quorlyx-fake-exit-text';
                    text.textContent = trigger.fake_exit_button_text || 'Exit';

                    const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                    icon.setAttribute('viewBox', '0 0 24 24');
                    icon.setAttribute('class', 'quorlyx-fake-exit-icon');
                    icon.innerHTML =
                        '<path fill="currentColor" d="M10.09 15.59L11.5 17l5-5-5-5-1.41 1.41L12.67 11H3v2h9.67l-2.58 2.59zM19 3H5c-1.11 0-2 .9-2 2v4h2V5h14v14H5v-4H3v4c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"></path>';

                    wrap.appendChild(text);
                    wrap.appendChild(icon);
                    document.body.appendChild(wrap);

                    this.listeners.push({ id: listenerId + '_fake', type: 'element', element: wrap, isOverride });

                    let clickCount = 0;
                    wrap.addEventListener('click', (e) => {
                        clickCount++;
                        if (clickCount === 1) {
                            e.preventDefault();
                            this.executeTrigger(trigger);
                        } else {
                            wrap.remove();
                            if (window.history.length > 1) {
                                try {
                                    window.history.go(-1);
                                } catch (e) {}
                            } else {
                                const fb = trigger.fake_exit_button_url || 'about:blank';
                                window.location.href = fb;
                            }
                        }
                    });
                }
            });
        },

        meetsStaticConditions: function (trigger) {
            if (this.shouldSuppressAfterConversion(trigger)) {
                return false;
            }

            if (trigger.exclude_page_urls) {
                const exclusions = trigger.exclude_page_urls
                    .split(/[\n,]+/)
                    .map((u) => u.trim())
                    .filter(Boolean);
                for (const urlPart of exclusions) {
                    if (urlPart && window.location.href.includes(urlPart)) {
                        return false;
                    }
                }
            }

            if (trigger.target_page_url && !window.location.href.includes(trigger.target_page_url)) {
                return false;
            }
            return true;
        },

        listenerBelongsToTrigger: function (listener, trigger) {
            const triggerId = String((trigger && trigger.id) || '');
            if (!triggerId || !listener || !listener.id) return false;
            return String(listener.id).indexOf(triggerId) !== -1;
        },

        disposeListener: function (listener) {
            if (!listener) return;
            if (listener.type === 'timeout' || listener.type === 'interval') {
                clearTimeout(listener.handle);
                clearInterval(listener.handle);
            } else if (listener.type === 'event') {
                const target = listener.target || window;
                target.removeEventListener(listener.name, listener.func);
            } else if (listener.type === 'element') {
                if (listener.element && listener.element.parentNode) {
                    listener.element.parentNode.removeChild(listener.element);
                }
            }
        },

        cleanupTriggerListeners: function (trigger) {
            this.listeners = this.listeners.filter((listener) => {
                if (this.listenerBelongsToTrigger(listener, trigger)) {
                    this.disposeListener(listener);
                    return false;
                }
                return true;
            });
        },

        cleanupListeners: function (overrideOnly) {
            this.listeners = this.listeners.filter((l) => {
                const isOverride = !!l.isOverride;
                if ((overrideOnly && isOverride) || (!overrideOnly && !isOverride)) {
                    this.disposeListener(l);
                    return false;
                }
                return true;
            });
        },
    };

    window.quorlyxInitTriggers = (triggers, fireCallback) => {
        const wrappedCallback = (trigger) => {
            const applyStyle = () => {
                const panel = document.querySelector('.quorlyx-chat-panel');
                const overlay = document.querySelector('.quorlyx-modal-overlay');
                if (panel && trigger) {
                    const style = trigger.open_style || 'normal';
                    if (style === 'center') {
                        panel.classList.add('quorlyx-exit-intent-modal');
                        if (overlay) overlay.classList.add('quorlyx-visible');
                    } else {
                        panel.classList.remove('quorlyx-exit-intent-modal');
                        if (overlay) overlay.classList.remove('quorlyx-visible');
                    }
                }
            };

            applyStyle();

            if (typeof fireCallback === 'function') {
                fireCallback(trigger);
            }

            applyStyle();

            setTimeout(applyStyle, 10);
            setTimeout(applyStyle, 50);
        };
        window.QuorlyxTriggerController.init(triggers, wrappedCallback);
    };
})();
