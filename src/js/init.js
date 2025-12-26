async function loadSettingSchema() {
    try {
        const response = await fetch(chrome.runtime.getURL('setting-schema.json'));
        if (!response.ok) throw new Error(`Failed to load: ${response.status}`);
        const schema = await response.json();

        defaultsSchema = schema['defaults'];
        if (!defaultsSchema) throw new Error('No defaults found in schema');

        chrome.storage.sync.get(null, (result) => {
            const settings = {};
            
            for (const key in defaultsSchema) {
                if (!(key in result)) {
                    settings[key] = defaultsSchema[key];
                }
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