// Example plugin tab logic
// This script runs after app.js and can use its globals:
//   - apiFetch(url)           – GET helper with error handling
//   - apiPost(url, body)      – POST helper
//   - aiComplete(prompt, opts) – non-streaming AI completion (returns {content, tool_calls})
//   - aiEnabled              – true if AI is configured
//   - renderMarkdown(md)      – render Markdown to HTML via marked.js
//   - tenantQS(prefix)        – returns "?tenantId=…" or ""
//   - subscriptions           – array of {id, name} for the current tenant
//   - regions                 – array of {name, displayName}
// Static assets are served at /plugins/{name}/static/
(function () {
    const PLUGIN_NAME = "example";
    const container = document.getElementById("plugin-tab-" + PLUGIN_NAME);
    if (!container) return;

    // -----------------------------------------------------------------------
    // 1. Load HTML fragment
    // -----------------------------------------------------------------------
    fetch(`/plugins/${PLUGIN_NAME}/static/html/example-tab.html`)
        .then(resp => resp.text())
        .then(html => {
            // eslint-disable-next-line @microsoft/sdl/no-inner-html -- trusted HTML fragment from own server
            container.innerHTML = html;
            initExamplePlugin();
        })
        .catch(err => {
            container.replaceChildren();
            const div = document.createElement("div");
            div.className = "alert alert-danger";
            div.textContent = "Failed to load plugin UI: " + err.message;
            container.appendChild(div);
        });

    // -----------------------------------------------------------------------
    // 2. Plugin initialisation (called after HTML is injected)
    // -----------------------------------------------------------------------
    function initExamplePlugin() {
        const tenantEl  = document.getElementById("tenant-select");
        const regionEl  = document.getElementById("region-select");
        const subSelect = document.getElementById("example-sub-select");
        const btn       = document.getElementById("example-btn");
        const output    = document.getElementById("example-output");

        // --- helpers --------------------------------------------------------
        function getContext() {
            const tenantId  = tenantEl?.value || "";
            const region    = regionEl?.value || "";
            // Tenant display name
            const tenantOpt = tenantEl?.selectedOptions?.[0];
            const tenantName = tenantOpt?.text || tenantId || "—";
            // Region display name
            const regionObj = (typeof regions !== "undefined" ? regions : [])
                .find(r => r.name === region);
            const regionName = regionObj?.displayName || region || "—";
            return { tenantId, tenantName, region, regionName };
        }

        function updateBadges() {
            const ctx = getContext();
            const tBadge = document.getElementById("example-tenant-badge");
            const rBadge = document.getElementById("example-region-badge");
            if (tBadge) {
                tBadge.textContent = ctx.tenantId ? ctx.tenantName : "No tenant";
                tBadge.className = "badge " + (ctx.tenantId ? "bg-primary" : "bg-secondary");
            }
            if (rBadge) {
                rBadge.textContent = ctx.region ? ctx.regionName : "No region";
                rBadge.className = "badge " + (ctx.region ? "bg-success" : "bg-secondary");
            }
        }

        // --- subscription selector ------------------------------------------
        async function refreshSubscriptions() {
            // Wait until both tenant and region are selected
            const ctx = getContext();
            subSelect.replaceChildren();

            if (!ctx.tenantId || !ctx.region) {
                const opt = document.createElement("option");
                opt.value = "";
                opt.textContent = "Select tenant & region first";
                subSelect.appendChild(opt);
                subSelect.disabled = true;
                btn.disabled = true;
                output.textContent = "";
                return;
            }

            subSelect.replaceChildren();
            const loadOpt = document.createElement("option");
            loadOpt.value = "";
            loadOpt.textContent = "Loading…";
            subSelect.appendChild(loadOpt);
            subSelect.disabled = true;

            try {
                // Reuse the main app's subscriptions API
                const subs = await apiFetch("/api/subscriptions" + tenantQS("?"));
                subSelect.replaceChildren();
                const defOpt = document.createElement("option");
                defOpt.value = "";
                defOpt.textContent = "— choose —";
                subSelect.appendChild(defOpt);
                subs.forEach(s => {
                    const opt = document.createElement("option");
                    opt.value = s.id;
                    opt.textContent = s.name;
                    subSelect.appendChild(opt);
                });
                subSelect.disabled = false;
            } catch (e) {
                subSelect.replaceChildren();
                const errOpt = document.createElement("option");
                errOpt.value = "";
                errOpt.textContent = "Error: " + e.message;
                subSelect.appendChild(errOpt);
                subSelect.disabled = true;
            }
        }

        // --- react to main-app context events -------------------------------
        function onContextChanged() {
            updateBadges();
            refreshSubscriptions();
        }

        document.addEventListener("azscout:tenant-changed", onContextChanged);
        document.addEventListener("azscout:region-changed", onContextChanged);

        // Optional extension point for plugin authors
        document.addEventListener("azscout:subscriptions-loaded", () => {
            // no-op by default
        });

        // Enable button when a subscription is selected
        subSelect.addEventListener("change", () => {
            btn.disabled = !subSelect.value;
        });

        // --- call plugin API ------------------------------------------------
        btn.addEventListener("click", async () => {
            const ctx = getContext();
            const subOpt = subSelect.selectedOptions[0];
            const subName = subOpt?.textContent || "";
            const subId = subSelect.value;

            output.textContent = "Loading…";
            try {
                const qs = new URLSearchParams({
                    subscription_name: subName,
                    subscription_id: subId,
                    tenant: ctx.tenantName,
                    region: ctx.regionName,
                });
                const data = await apiFetch(`/plugins/${PLUGIN_NAME}/hello?${qs}`);
                output.textContent = data.message;
            } catch (e) {
                output.textContent = "Error: " + e.message;
            }
        });

        // --- initial state --------------------------------------------------
        updateBadges();
        // If tenant + region are already chosen (e.g. tab opened later), load subs
        if (getContext().tenantId && getContext().region) {
            refreshSubscriptions();
        }
    }
})();
