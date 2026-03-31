/* ===================================================================
   Shared SKU detail renderers — available to all plugins.
   Namespace: window.azScout.components

   Provides accordion-panel renderers for the SKU detail modal:
   VM Profile, Zone Availability, Quota, Confidence breakdown, Pricing.

   Requires: escapeHtml, formatNum (from app.js)
             azScout.components.scoreLabel, renderSpotBadge (from sku-badges.js)
   =================================================================== */
window.azScout = window.azScout || {};
window.azScout.components = window.azScout.components || {};

(function (C) {
    // --- shared inner helpers ---
    function _row(label, value) {
        return '<div class="vm-profile-row"><span class="vm-profile-label">' + escapeHtml(label) + '</span><span>' + value + '</span></div>';
    }
    function _val(v, suffix) {
        if (v == null) return '<span class="vm-badge vm-badge-unknown">\u2014</span>';
        return escapeHtml(String(v) + (suffix || ""));
    }
    function _badge(val, trueLabel, falseLabel) {
        if (val === true) return '<span class="vm-badge vm-badge-yes">' + escapeHtml(trueLabel || "Yes") + '</span>';
        if (val === false) return '<span class="vm-badge vm-badge-no">' + escapeHtml(falseLabel || "No") + '</span>';
        return '<span class="vm-badge vm-badge-unknown">\u2014</span>';
    }
    function _bytesToMBs(v) {
        if (v == null) return '<span class="vm-badge vm-badge-unknown">\u2014</span>';
        return escapeHtml((Number(v) / (1024 * 1024)).toFixed(0) + " MB/s");
    }
    function _bytesToGB(v) {
        if (v == null) return '<span class="vm-badge vm-badge-unknown">\u2014</span>';
        return escapeHtml((Number(v) / (1024 * 1024 * 1024)).toFixed(0) + " GB");
    }
    function _mbpsToGbps(v) {
        if (v == null) return '<span class="vm-badge vm-badge-unknown">\u2014</span>';
        const gbps = Number(v) / 1000;
        return escapeHtml(gbps >= 1 ? gbps.toFixed(1) + " Gbps" : v + " Mbps");
    }
    function _accordion(id, icon, title, body) {
        return '<div class="accordion mt-3" id="' + id + 'Accordion">' +
            '<div class="accordion-item">' +
            '<h2 class="accordion-header">' +
            '<button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#' + id + 'Panel" aria-expanded="false">' +
            '<i class="bi ' + icon + ' me-2"></i>' + escapeHtml(title) +
            '</button></h2>' +
            '<div id="' + id + 'Panel" class="accordion-collapse collapse">' +
            '<div class="accordion-body p-2">' + body + '</div></div></div></div>';
    }

    /**
     * Render VM Profile accordion panel.
     * @param {object} profile - SKU profile with capabilities dict.
     * @returns {string} HTML string.
     */
    C.renderVmProfile = function (profile) {
        const caps = profile.capabilities || {};
        let html = '<div class="vm-profile-section">';
        html += '<h4 class="vm-profile-title">VM Profile</h4>';
        html += '<div class="vm-profile-grid">';

        html += '<div class="vm-profile-card"><div class="vm-profile-card-title">Compute</div>';
        html += _row("vCPUs", _val(caps.vCPUs));
        html += _row("Memory", _val(caps.MemoryGB, " GB"));
        html += _row("Architecture", _val(caps.CpuArchitectureType));
        html += _row("GPUs", _val(caps.GPUs || caps.GpuCount));
        html += _row("HyperV Gen.", _val(caps.HyperVGenerations));
        html += _row("Encryption at Host", _badge(caps.EncryptionAtHostSupported));
        html += _row("Confidential", _val(caps.ConfidentialComputingType || null));
        html += '</div>';

        html += '<div class="vm-profile-card"><div class="vm-profile-card-title">Storage</div>';
        html += _row("Premium IO", _badge(caps.PremiumIO));
        html += _row("Ultra SSD", _badge(caps.UltraSSDAvailable));
        html += _row("Ephemeral OS Disk", _badge(caps.EphemeralOSDiskSupported));
        html += _row("Max Data Disks", _val(caps.MaxDataDiskCount));
        html += _row("Uncached Disk IOPS", _val(caps.UncachedDiskIOPS));
        html += _row("Uncached Disk BW", _bytesToMBs(caps.UncachedDiskBytesPerSecond));
        html += _row("Cached Disk Size", _bytesToGB(caps.CachedDiskBytes));
        html += _row("Write Accelerator", _val(caps.MaxWriteAcceleratorDisksAllowed));
        html += _row("Temp Disk", _val(caps.TempDiskSizeInGiB, " GiB"));
        html += '</div>';

        html += '<div class="vm-profile-card"><div class="vm-profile-card-title">Network</div>';
        html += _row("Accelerated Net.", _badge(caps.AcceleratedNetworkingEnabled));
        html += _row("Max NICs", _val(caps.MaxNetworkInterfaces || caps.MaximumNetworkInterfaces));
        html += _row("Max Bandwidth", _mbpsToGbps(caps.MaxBandwidthMbps));
        html += _row("RDMA", _badge(caps.RdmaEnabled));
        html += '</div>';

        html += '</div></div>';
        return html;
    };

    /**
     * Render Zone Availability accordion panel.
     * @param {object} profile - SKU profile with zones and restrictions.
     * @param {object} [confidence] - Confidence object with breakdown.
     * @param {object} [opts] - Optional settings.
     * @param {object} [opts.physicalZoneMap] - {logicalZone: physicalName} map.
     * @param {object} [opts.spotZoneScores] - {zone: scoreLabel} map.
     * @returns {string} HTML accordion string.
     */
    C.renderZoneAvailability = function (profile, confidence, opts) {
        const o = opts || {};
        const zones = profile.zones || [];
        const restrictions = profile.restrictions || [];
        const components = confidence?.breakdown?.components || [];
        const zoneSignal = components.find(function (b) { return b.name === "zones"; });
        const zoneScore = zoneSignal?.score100;
        const spotSignal = components.find(function (b) { return b.name === "spot"; });
        const spotScore = spotSignal?.score100;
        const physicalZoneMap = o.physicalZoneMap || {};
        const spotZoneScores = o.spotZoneScores || {};

        const reasonLabels = {
            NotAvailableForSubscription: "Not available for this subscription",
            QuotaId: "Subscription offer type not eligible",
        };

        const hasLocationRestriction = restrictions.some(function (r) { return r.type === "Location"; });
        const zoneRestrictionZones = new Set(restrictions.filter(function (r) { return r.type === "Zone"; }).flatMap(function (r) { return r.zones || []; }));
        const allZoneIds = [...new Set(["1", "2", "3", ...zones])].sort();
        const availableCount = zones.filter(function (z) { return !zoneRestrictionZones.has(z) && !hasLocationRestriction; }).length;

        let body = '<div class="vm-profile-grid">';

        // Zone status card
        body += '<div class="vm-profile-card"><div class="vm-profile-card-title">Zones</div>';
        if (hasLocationRestriction) body += _row("Region", '<span class="vm-badge vm-badge-no">Restricted</span>');
        body += _row("Available", _val(availableCount + " / 3"));
        allZoneIds.forEach(function (z) {
            const pz = physicalZoneMap[z];
            const pzTip = pz ? ' data-bs-toggle="tooltip" data-bs-title="' + escapeHtml(pz) + '"' : "";
            const offered = zones.includes(z);
            const restricted = zoneRestrictionZones.has(z) || hasLocationRestriction;
            if (!offered && !restricted) body += '<div class="vm-profile-row"><span class="vm-profile-label"' + pzTip + '>' + escapeHtml("Zone " + z) + '</span><span class="vm-badge vm-badge-unknown">Not offered</span></div>';
            else if (restricted) body += '<div class="vm-profile-row"><span class="vm-profile-label"' + pzTip + '>' + escapeHtml("Zone " + z) + '</span><span class="vm-badge vm-badge-no">Restricted</span></div>';
            else body += '<div class="vm-profile-row"><span class="vm-profile-label"' + pzTip + '>' + escapeHtml("Zone " + z) + '</span><span class="vm-badge vm-badge-yes">Available</span></div>';
        });
        if (zoneScore != null) {
            const lbl = C.scoreLabel(zoneScore).toLowerCase().replace(/\s+/g, "-");
            body += '<div class="vm-profile-row"><span class="vm-profile-label">Breadth Score</span><span class="confidence-badge confidence-' + lbl + '" data-bs-toggle="tooltip" data-bs-title="Zone Breadth signal: ' + availableCount + '/3 zones available.">' + zoneScore + '/100</span></div>';
        }
        body += '</div>';

        // Spot placement card
        const hasSpotData = Object.keys(spotZoneScores).length > 0;
        body += '<div class="vm-profile-card"><div class="vm-profile-card-title">Spot Placement</div>';
        if (!hasSpotData) {
            body += _row("Status", '<span class="vm-badge vm-badge-unknown">No data</span>');
        } else {
            allZoneIds.forEach(function (z) {
                const pz = physicalZoneMap[z];
                const pzTip = pz ? ' data-bs-toggle="tooltip" data-bs-title="' + escapeHtml(pz) + '"' : "";
                const s = spotZoneScores[z];
                if (s) body += '<div class="vm-profile-row"><span class="vm-profile-label"' + pzTip + '>' + escapeHtml("Zone " + z) + '</span><span>' + C.renderSpotBadge(s) + '</span></div>';
                else body += '<div class="vm-profile-row"><span class="vm-profile-label"' + pzTip + '>' + escapeHtml("Zone " + z) + '</span><span class="vm-badge vm-badge-unknown">\u2014</span></div>';
            });
            if (spotScore != null) {
                const lbl = C.scoreLabel(spotScore).toLowerCase().replace(/\s+/g, "-");
                body += '<div class="vm-profile-row"><span class="vm-profile-label">Spot Score</span><span class="confidence-badge confidence-' + lbl + '">' + spotScore + '/100</span></div>';
            }
        }
        body += '</div>';

        // Restrictions card
        body += '<div class="vm-profile-card"><div class="vm-profile-card-title">Restrictions</div>';
        if (restrictions.length === 0) {
            body += _row("Status", '<span class="vm-badge vm-badge-yes">None</span>');
        } else {
            restrictions.forEach(function (r) {
                const reason = reasonLabels[r.reasonCode] || r.reasonCode || "Unknown reason";
                const scope = r.type === "Location" ? "Entire region" : r.type === "Zone" && r.zones?.length ? "Zone" + (r.zones.length > 1 ? "s" : "") + " " + r.zones.join(", ") : r.type || "Unknown";
                body += '<div class="vm-profile-row vm-profile-row-stacked"><span class="vm-profile-label">' + escapeHtml(scope) + '</span><span class="vm-badge vm-badge-limited vm-badge-block">' + escapeHtml(reason) + '</span></div>';
            });
        }
        body += '</div></div>';

        return _accordion("zone", "bi-pin-map", "Zone Availability", body);
    };

    /**
     * Render Quota accordion panel.
     * @param {object} quota - {limit, used, remaining}.
     * @param {number} vcpus - vCPUs per instance.
     * @param {object} [confidence] - Confidence object with breakdown.
     * @returns {string} HTML accordion string.
     */
    C.renderQuotaPanel = function (quota, vcpus, confidence) {
        const limit = quota.limit;
        const used = quota.used;
        const remaining = quota.remaining;
        const pct = (limit != null && limit > 0) ? Math.round((used / limit) * 100) : null;
        const deployable = (remaining != null && vcpus > 0) ? Math.floor(remaining / vcpus) : null;

        const components = confidence?.breakdown?.components || [];
        const quotaSignal = components.find(function (b) { return b.name === "quota"; });
        const quotaScore = quotaSignal?.score100;

        let barClass = "bg-success";
        if (pct != null) { if (pct >= 90) barClass = "bg-danger"; else if (pct >= 70) barClass = "bg-warning"; }

        let body = '<div class="vm-profile-grid">';
        body += '<div class="vm-profile-card"><div class="vm-profile-card-title">vCPU Family Quota</div>';
        body += _row("Limit", _val(limit != null ? formatNum(limit, 0) : null));
        body += _row("Used", _val(used != null ? formatNum(used, 0) : null));
        body += _row("Remaining", _val(remaining != null ? formatNum(remaining, 0) : null));
        if (pct != null) {
            body += '<div class="vm-profile-row"><span class="vm-profile-label">Usage</span><span>' + pct + '%</span></div>';
            body += '<div class="progress mt-1" style="height:6px;" role="progressbar" aria-valuenow="' + pct + '" aria-valuemin="0" aria-valuemax="100">';
            body += '<div class="progress-bar ' + barClass + '" style="width:' + pct + '%"></div></div>';
        }
        body += '</div>';

        body += '<div class="vm-profile-card"><div class="vm-profile-card-title">Deployment Headroom</div>';
        body += _row("vCPUs per Instance", vcpus > 0 ? escapeHtml(String(vcpus)) : "\u2014");
        if (deployable != null) {
            const dbadge = deployable === 0 ? '<span class="vm-badge vm-badge-no">' + formatNum(deployable, 0) + '</span>' : deployable <= 5 ? '<span class="vm-badge vm-badge-limited">' + formatNum(deployable, 0) + '</span>' : '<span class="vm-badge vm-badge-yes">' + formatNum(deployable, 0) + '</span>';
            body += '<div class="vm-profile-row"><span class="vm-profile-label">Deployable Instances</span>' + dbadge + '</div>';
        } else {
            body += _row("Deployable Instances", "\u2014");
        }
        if (quotaScore != null) {
            const lbl = C.scoreLabel(quotaScore).toLowerCase().replace(/\s+/g, "-");
            body += '<div class="vm-profile-row"><span class="vm-profile-label">Headroom Score</span><span class="confidence-badge confidence-' + lbl + '" data-bs-toggle="tooltip" data-bs-title="Quota signal score.">' + quotaScore + '/100</span></div>';
        }
        body += '</div></div>';

        return _accordion("quota", "bi-speedometer", "Quota", body);
    };

    /**
     * Render Confidence breakdown accordion panel.
     * @param {object} conf - Confidence object with breakdown, knockout reasons, etc.
     * @returns {string} HTML string (NOT wrapped in accordion — rendered as top-level section).
     */
    C.renderConfidenceBreakdown = function (conf) {
        const lbl = (conf.label || "").toLowerCase().replace(/\s+/g, "-");
        const isBlocked = conf.scoreType === "blocked";
        const isBasicWithSpot = conf.scoreType === "basic+spot";
        const titleText = isBlocked ? "Deployment Confidence (Blocked)" : isBasicWithSpot ? "Deployment Confidence (with Spot)" : "Basic Deployment Confidence";

        let html = '<div class="confidence-section">';
        html += '<h4 class="confidence-title">' + escapeHtml(titleText) + ' <span class="confidence-badge confidence-' + lbl + '">' + conf.score + ' ' + escapeHtml(conf.label || '') + '</span></h4>';

        const knockoutReasons = conf.knockoutReasons || [];
        if (knockoutReasons.length) {
            html += '<div class="alert alert-danger py-1 px-2 mb-2 small"><i class="bi bi-x-octagon me-1"></i><strong>Blocked:</strong><ul class="mb-0 ps-3">';
            knockoutReasons.forEach(function (r) { html += '<li>' + escapeHtml(r) + '</li>'; });
            html += '</ul></div>';
        }

        const components = conf.breakdown?.components || conf.breakdown || [];
        const usedComponents = components.filter(function (c) { return c.status === "used"; });
        if (usedComponents.length) {
            const signalLabels = { quotaPressure: "Quota Pressure", spot: "Spot Placement", zones: "Zone Breadth", restrictionDensity: "Restriction Density", pricePressure: "Price Pressure" };
            html += '<table class="table table-sm confidence-breakdown-table"><thead><tr><th>Signal</th><th>Score</th><th>Weight</th><th>Contribution</th></tr></thead><tbody>';
            usedComponents.forEach(function (b) {
                const name = b.name || b.signal || "";
                const score = b.score100 != null ? b.score100 : b.score;
                const contribution = b.contribution != null ? (b.contribution * 100).toFixed(1) : "0.0";
                html += '<tr><td>' + escapeHtml(signalLabels[name] || name) + '</td><td>' + score + '</td><td>' + (b.weight * 100).toFixed(1) + '%</td><td>' + contribution + '</td></tr>';
            });
            html += '</tbody></table>';
        }

        const allMissing = conf.missingSignals || conf.missing || [];
        const otherMissing = allMissing.filter(function (m) { return m !== "spot"; });
        if (otherMissing.length) {
            const signalLabels = { quotaPressure: "Quota Pressure", zones: "Zone Breadth", restrictionDensity: "Restriction Density", pricePressure: "Price Pressure" };
            const names = otherMissing.map(function (m) { return signalLabels[m] || m; }).join(", ");
            html += '<p class="confidence-missing"><i class="bi bi-exclamation-circle"></i> Missing signals: ' + escapeHtml(names) + '</p>';
        }

        html += '</div>';
        return html;
    };

    /**
     * Render pricing accordion panel.
     * @param {object} data - Pricing data {paygo, spot, ri_1y, ri_3y, sp_1y, sp_3y, currency}.
     * @param {object} [opts] - Optional settings.
     * @param {function} [opts.onCurrencyChange] - Callback when currency selector changes.
     * @returns {string} HTML accordion string.
     */
    C.renderPricingPanel = function (data, opts) {
        const o = opts || {};
        const currency = data.currency || "USD";
        const HOURS_PER_MONTH = 730;

        const spotDiscount = (data.paygo != null && data.spot != null && data.paygo > 0) ? Math.round((1 - data.spot / data.paygo) * 100) : null;
        const spotLabel = spotDiscount != null ? 'Spot <span class="badge bg-success-subtle text-success-emphasis ms-1">\u2212' + spotDiscount + '%</span>' : "Spot";

        const rows = [
            { label: "Pay-As-You-Go", hourly: data.paygo },
            { label: spotLabel, raw: true, hourly: data.spot },
            { label: "Reserved Instance 1Y", hourly: data.ri_1y },
            { label: "Reserved Instance 3Y", hourly: data.ri_3y },
            { label: "Savings Plan 1Y", hourly: data.sp_1y },
            { label: "Savings Plan 3Y", hourly: data.sp_3y },
        ];

        let table = '<table class="table table-sm pricing-detail-table mb-0">';
        table += '<thead><tr><th>Type</th><th>' + escapeHtml(currency) + '/hour</th><th>' + escapeHtml(currency) + '/month</th></tr></thead><tbody>';
        rows.forEach(function (r) {
            const hourStr = r.hourly != null ? formatNum(r.hourly, 4) : "\u2014";
            const monthStr = r.hourly != null ? formatNum(r.hourly * HOURS_PER_MONTH, 2) : "\u2014";
            const labelHtml = r.raw ? r.label : escapeHtml(r.label);
            table += '<tr><td>' + labelHtml + '</td><td class="price-cell">' + hourStr + '</td><td class="price-cell">' + monthStr + '</td></tr>';
        });
        table += "</tbody></table>";

        // Currency selector
        const currencies = ["USD", "EUR", "GBP", "JPY", "AUD", "CAD", "CHF", "SEK", "BRL", "INR"];
        const currencyOpts = currencies.map(function (c) { return '<option value="' + c + '"' + (c === currency ? " selected" : "") + '>' + c + '</option>'; }).join("");
        const changeAttr = o.onCurrencyChange ? ' onchange="' + o.onCurrencyChange + '"' : "";

        let body = '<div class="d-flex align-items-center gap-2 mb-2">';
        body += '<label class="form-label small mb-0">Currency:</label>';
        body += '<select class="form-select form-select-sm" id="pricing-modal-currency-select"' + changeAttr + ' style="width:100px;">' + currencyOpts + '</select>';
        body += '</div>';
        body += table;

        return _accordion("pricing", "bi-currency-exchange", "Pricing", body);
    };
})(window.azScout.components);
