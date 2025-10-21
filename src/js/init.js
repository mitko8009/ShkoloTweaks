// Load initial settings
chrome.storage.sync.get(null, (result) => {
    if (!result.initialized) {
        chrome.storage.sync.set({
            initialized: true,
            
            // General settings
            theme: 'dark',
            blur_data: true,
            no_avatars: false,
            rounded: true,
            autoRefresh: true,
            schedule: true,
            control_tests: true,
            reorder_sidebar: true,
            colored_icons: false,
            // QoL settings
            remove_ads: true,
            load_qol_css: true,
            email_and_tel: false,
            messages_background_fix: true,
            details_date: true,
            inapp_ext_settings: true,
            move_logout_button: true,
            trusted_devices_logins: false,
            // Experimental settings
            year_countdown: false,
            stats_panel: false,
            // Developer settings
            dev_tools: false
        })
    }
});
