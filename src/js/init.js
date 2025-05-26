// Load initial settings
chrome.storage.sync.get(null, (result) => {
    if (!result.initialized) {
        chrome.storage.sync.set({
            initialized: true,
            theme: 'dark',
            blur_data: true,
            rounded: true,
            autoRefresh: true,
            schedule: true,
            control_tests: true,
            reorder_sidebar: true,
            colored_icons: false,
            year_countdown: false,
            stats_panel: false,
            dev_tools: false
        })
    }
});
