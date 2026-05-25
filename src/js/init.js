async function loadSettingSchema() {
    try {
        const response = await fetch(chrome.runtime.getURL('setting-schema.json'));
        if (!response.ok) throw new Error(`Failed to load: ${response.status}`);
        const schema = await response.json();

        defaultsSchema = schema['defaults'];
        if (!defaultsSchema) throw new Error('No defaults found in schema');

        const defaultPinned = Array.isArray(schema.default_pinned_options) ? schema.default_pinned_options : [];
        const items = Array.isArray(schema.schema) ? schema.schema : [];
        const PINNED_SETTINGS_KEY = 'pinned_settings';

        chrome.storage.sync.get(null, (result) => {
            const settings = {};

            for (const key in defaultsSchema) {
                if (!(key in result)) {
                    settings[key] = defaultsSchema[key];
                }
            }

            if (defaultPinned.length && !(PINNED_SETTINGS_KEY in result)) {
                const devTools = Object.prototype.hasOwnProperty.call(result, 'dev_tools')
                    ? result.dev_tools
                    : defaultsSchema.dev_tools;

                const allowed = new Set(
                    items
                        .filter((item) => {
                            if (!item || item.type !== 'boolean' || item.hidden === true) return false;
                            if (item.tags && Array.isArray(item.tags) && item.tags.includes('dev') && !devTools) return false;
                            return true;
                        })
                        .map((item) => String(item.id))
                );

                const next = defaultPinned.map(String).filter((id) => allowed.has(id));
                settings[PINNED_SETTINGS_KEY] = next;
            }
            
            if (Object.keys(settings).length > 0) {
                chrome.storage.sync.set(settings);
            }
        });
    } catch (e) {
        console.error('Error loading setting schema:', e);
    }
}

loadSettingSchema();