// Service worker for leaderboard proxying

const LeaderboardService = {
    API_URL: 'https://shtw.pishkisoriz.com/leaderboard',

    async fetchWithTimeout(url, options = {}, timeout = 8000) {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                reject(new Error('timeout'));
            }, timeout);

            fetch(url, options).then((res) => {
                clearTimeout(timer);
                resolve(res);
            }).catch((err) => {
                clearTimeout(timer);
                reject(err);
            });
        });
    },

    async fetchLeaderboard() {
        // offline check
        if (typeof self !== 'undefined' && typeof navigator !== 'undefined' && !navigator.onLine) {
            return { error: 'offline', message: 'Network offline' };
        }
        try {
            const response = await this.fetchWithTimeout(this.API_URL + '/get', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                mode: 'cors',
                credentials: 'omit'
            }, 8000);

            if (!response.ok) {
                const msg = `HTTP ${response.status} ${response.statusText}`;
                console.warn('LeaderboardService.fetchLeaderboard: non-ok response', response.status, response.statusText);
                return { error: 'http', status: response.status, message: msg };
            }

            const json = await response.json();
            return json;
        } catch (error) {
            console.error('LeaderboardService.fetchLeaderboard error:', error);
            if (error && error.message && error.message.toLowerCase().includes('timeout')) {
                return { error: 'timeout', message: 'Request timed out' };
            }
            return { error: 'fetch', message: error && error.message ? error.message : 'Failed to fetch' };
        }
    }
};

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (!msg || !msg.type) return;
    // handle leaderboard fetch
    if (msg.type === 'leaderboardFetch') {
        (async () => {
            const res = await LeaderboardService.fetchLeaderboard();
            sendResponse(res);
        })();
        return true;
    }

    // handle leaderboard submit
    if (msg.type === 'leaderboardSubmit') {
        (async () => {
            try {
                // accept payload as object or a JSON string
                let payload = msg.payload || {};
                if (typeof payload === 'string') {
                    try { payload = JSON.parse(payload); } catch (e) { /* leave as string */ }
                }

                // normalize grades into an array shape expected by the server
                const rawGrades = payload && payload.grades !== undefined ? payload.grades : {};
                let normalizedGrades = rawGrades;
                try {
                    // if grades arrived as JSON string, parse it
                    if (typeof normalizedGrades === 'string') {
                        try { normalizedGrades = JSON.parse(normalizedGrades); } catch (e) { /* keep string */ }
                    }

                    // if it's an object keyed by id, convert to array of {courseId, target_id, name, grades}
                    if (normalizedGrades && !Array.isArray(normalizedGrades) && typeof normalizedGrades === 'object') {
                        normalizedGrades = Object.keys(normalizedGrades).map(k => {
                            const v = normalizedGrades[k] || {};
                            return {
                                courseId: k,
                                target_id: v.target_id || v.targetId || v.data_target_id || v.dataTarget || '',
                                name: v.name || '',
                                grades: Array.isArray(v.grades) ? v.grades : []
                            };
                        });
                    }
                } catch (normErr) {
                    console.warn('LeaderboardService: failed to normalize grades', normErr);
                    normalizedGrades = rawGrades;
                }

                // ensure expected fields exist; we'll convert normalizedGrades into the server-expected shape
                function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
                function avgOfArray(arr) {
                    if (!Array.isArray(arr) || arr.length === 0) return 0;
                    const nums = arr.map(x => typeof x === 'number' ? x : parseFloat(String(x).replace(',', '.'))).filter(n => !Number.isNaN(n));
                    if (nums.length === 0) return 0;
                    const s = nums.reduce((a, b) => a + b, 0) / nums.length;
                    return Math.round(s * 10) / 10; // one decimal
                }

                // Build grades mapping as expected by server: { "Subject Name": { id: "ID", value: 5.5 }, ... }
                let serverGrades = normalizedGrades;
                try {
                    // If the original payload provided a numeric grades average, keep it
                    if (typeof payload.grades === 'number') {
                        serverGrades = payload.grades;
                    } else if (typeof normalizedGrades === 'string') {
                        // attempt to parse stringified JSON mapping
                        try { serverGrades = JSON.parse(normalizedGrades); } catch (e) { /* keep */ }
                    }

                    // If normalizedGrades is an array of items [{courseId, name, grades, target_id}, ...]
                    // Preserve full per-course grades arrays instead of averaging them.
                    if (Array.isArray(normalizedGrades)) {
                        const map = {};
                        normalizedGrades.forEach(item => {
                            try {
                                const name = (item && item.name) ? String(item.name).trim() : (item && item.courseId ? String(item.courseId) : '');
                                if (!name) return;
                                const id = item && (item.courseId || item.target_id) ? String(item.courseId || item.target_id) : '';
                                let gradesArr = [];
                                if (Array.isArray(item.grades)) {
                                    gradesArr = item.grades.map(x => typeof x === 'number' ? x : parseFloat(String(x).replace(',', '.'))).filter(n => !Number.isNaN(n));
                                } else if (typeof item.grades === 'number') {
                                    gradesArr = [item.grades];
                                }
                                // clamp individual grades to valid range
                                gradesArr = gradesArr.map(v => clamp(Number(v) || 0, 0, 6));
                                map[name] = { id: id, grades: gradesArr };
                            } catch (inner) { /* ignore per-row */ }
                        });
                        serverGrades = map;
                    } else if (normalizedGrades && typeof normalizedGrades === 'object' && !Array.isArray(normalizedGrades)) {
                        // If it's already an object mapping, check if values are {id,value} - if not, try to convert
                        const sampleKey = Object.keys(normalizedGrades)[0];
                        const sampleVal = sampleKey ? normalizedGrades[sampleKey] : null;
                        if (sampleVal && (sampleVal.id !== undefined || sampleVal.value !== undefined || sampleVal.grades !== undefined)) {
                            // already in a shape that contains id/value or id/grades — normalize to ensure grades arrays are used
                            const map = {};
                            Object.keys(normalizedGrades).forEach(k => {
                                try {
                                    const v = normalizedGrades[k];
                                    const id = (v && (v.id || v.courseId || v.target_id)) ? String(v.id || v.courseId || v.target_id) : '';
                                    if (v && Array.isArray(v.grades)) {
                                        const arr = v.grades.map(x => typeof x === 'number' ? x : parseFloat(String(x).replace(',', '.'))).filter(n => !Number.isNaN(n)).map(n => clamp(n, 0, 6));
                                        map[k] = { id: id, grades: arr };
                                    } else if (v && v.value !== undefined) {
                                        const num = Number(v.value);
                                        map[k] = { id: id, grades: [isNaN(num) ? 0 : clamp(num, 0, 6)] };
                                    } else if (typeof v === 'number') {
                                        map[k] = { id: id, grades: [clamp(v, 0, 6)] };
                                    } else {
                                        map[k] = { id: id, grades: [] };
                                    }
                                } catch (inner) { /* ignore per-entry */ }
                            });
                            serverGrades = map;
                        } else {
                            // try to transform each entry
                            const map = {};
                            Object.keys(normalizedGrades).forEach(k => {
                                try {
                                    const v = normalizedGrades[k];
                                    let id = '';
                                    let gradesArr = [];
                                    if (v && typeof v === 'object') {
                                        id = v.id || v.courseId || v.target_id || '';
                                        if (Array.isArray(v.grades)) {
                                            gradesArr = v.grades.map(x => typeof x === 'number' ? x : parseFloat(String(x).replace(',', '.'))).filter(n => !Number.isNaN(n));
                                        } else if (v.value !== undefined) {
                                            const n = Number(v.value);
                                            if (!Number.isNaN(n)) gradesArr = [n];
                                        } else if (typeof v === 'number') {
                                            gradesArr = [v];
                                        }
                                    } else if (Array.isArray(v)) {
                                        gradesArr = v.map(x => typeof x === 'number' ? x : parseFloat(String(x).replace(',', '.'))).filter(n => !Number.isNaN(n));
                                    } else if (typeof v === 'number') {
                                        gradesArr = [v];
                                    }
                                    gradesArr = gradesArr.map(n => clamp(Number(n) || 0, 0, 6));
                                    const name = String(k || (v && v.name) || '').trim();
                                    if (name) map[name] = { id: String(id || ''), grades: gradesArr };
                                } catch (inner) { /* ignore */ }
                            });
                            serverGrades = map;
                        }
                    }
                } catch (transformErr) {
                    console.warn('LeaderboardService: failed to transform grades to server shape', transformErr);
                    serverGrades = normalizedGrades;
                }

                const body = {
                    username: payload && payload.username ? payload.username : "",
                    passphrase: payload && payload.passphrase ? payload.passphrase : "",
                    pupil_id: payload && (payload.pupil_id || payload.pupilId) ? (payload.pupil_id || payload.pupilId) : "",
                    school: payload && payload.school ? payload.school : "",
                    grades: serverGrades,
                    N_positive_notes: payload && payload.N_positive_notes ? payload.N_positive_notes : 0,
                    N_negative_notes: payload && payload.N_negative_notes ? payload.N_negative_notes : 0
                };

                // hash the passphrase before sending to remote server
                async function hashStringSHA256(input) {
                    try {
                        const enc = new TextEncoder();
                        const data = enc.encode(String(input || ''));
                        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
                        const hashArray = Array.from(new Uint8Array(hashBuffer));
                        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
                        return hashHex;
                    } catch (e) {
                        console.warn('LeaderboardService: passphrase hashing failed', e);
                        return String(input || '');
                    }
                }

                try {
                    if (body.passphrase) {
                        // replace plain passphrase with its SHA-256 hex digest
                        body.passphrase = await hashStringSHA256(body.passphrase);
                    }
                } catch (hashErr) {
                    console.warn('LeaderboardService: failed to hash passphrase', hashErr);
                }

                try {
                    const masked = Object.assign({}, body, { passphrase: body.passphrase ? '<hidden>' : '' });
                    console.debug('LeaderboardService: received leaderboardSubmit message from content script. sender:', sender && sender.id ? sender.id : sender);
                    console.debug('LeaderboardService: payload to be sent (masked):', masked);
                    // preview normalized grades shape for debugging
                    try {
                        if (Array.isArray(normalizedGrades)) console.debug('LeaderboardService: normalized grades array length', normalizedGrades.length, 'preview', normalizedGrades.slice(0, 3));
                        else if (typeof normalizedGrades === 'object') console.debug('LeaderboardService: normalized grades object keys', Object.keys(normalizedGrades).slice(0, 5));
                    } catch (glog) { /* ignore */ }
                } catch (logErr) {
                    console.warn('LeaderboardService: failed to log submission payload', logErr);
                }

                const resp = await (async () => {
                    try {
                        async function doPost(postBody) {
                            const response = await fetch(LeaderboardService.API_URL + '/submit', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(postBody),
                                mode: 'cors',
                                credentials: 'omit'
                            });
                            return response;
                        }

                        // attempt initial post
                        let response = await doPost(body);

                        // If server rejects grades shape, try fallback: send numeric average instead
                        if (!response.ok) {
                            let textBody = '';
                            try { textBody = await response.text(); } catch (e) { textBody = ''; }
                            const msg = `HTTP ${response.status} ${response.statusText}`;
                            console.error('LeaderboardService: server returned non-OK response', response.status, response.statusText, 'body:', textBody);

                            // check for explicit invalid grades message and whether we can compute a numeric average
                            if (response.status === 400 && textBody && textBody.toLowerCase().includes("invalid 'grades'")) {
                                try {
                                    // compute average value from serverGrades (object) or normalizedGrades (array)
                                    let avg = null;
                                    if (typeof body.grades === 'number') {
                                        avg = body.grades;
                                    } else if (body.grades && typeof body.grades === 'object' && !Array.isArray(body.grades)) {
                                        const vals = [];
                                        Object.keys(body.grades).forEach(k => {
                                            try {
                                                const v = body.grades[k];
                                                if (v && typeof v === 'object' && v.value !== undefined) vals.push(Number(v.value));
                                                else if (typeof v === 'number') vals.push(v);
                                            } catch (ie) { /* ignore */ }
                                        });
                                        if (vals.length) avg = Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
                                    } else if (Array.isArray(normalizedGrades)) {
                                        // normalizedGrades is available in outer scope
                                        const vals = normalizedGrades.map(it => {
                                            if (!it) return null;
                                            if (Array.isArray(it.grades)) return avgOfArray(it.grades);
                                            if (it && typeof it.grades === 'number') return it.grades;
                                            return null;
                                        }).filter(n => n !== null && !Number.isNaN(n));
                                        if (vals.length) avg = Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
                                    }

                                    if (avg !== null) {
                                        const retryBody = Object.assign({}, body, { grades: avg });
                                        try {
                                            const maskedRetry = Object.assign({}, retryBody, { passphrase: retryBody.passphrase ? '<hidden>' : '' });
                                            console.debug('LeaderboardService: retrying submit with numeric grades average (masked):', maskedRetry);
                                            console.debug('LeaderboardService: retry JSON:', JSON.stringify(retryBody));
                                        } catch (rlog) { /* ignore */ }

                                        response = await doPost(retryBody);
                                        if (!response.ok) {
                                            let retryBodyText = '';
                                            try { retryBodyText = await response.text(); } catch (e) { retryBodyText = ''; }
                                            const rmsg = `HTTP ${response.status} ${response.statusText}`;
                                            console.error('LeaderboardService: retry also failed', response.status, response.statusText, 'body:', retryBodyText);
                                            sendResponse({ error: 'http', status: response.status, message: rmsg, body: retryBodyText });
                                            return;
                                        }
                                        const json = await response.json();
                                        sendResponse(json);
                                        return;
                                    }
                                } catch (retryErr) {
                                    console.warn('LeaderboardService: retry on invalid grades failed to compute average', retryErr);
                                }
                            }

                            // no fallback or fallback failed: return original error info
                            sendResponse({ error: 'http', status: response.status, message: msg, body: textBody });
                            return;
                        }

                        const json = await response.json();
                        sendResponse(json);
                        return;
                    } catch (e) {
                        console.error('LeaderboardService submit error:', e);
                        sendResponse({ error: 'fetch', message: String(e) });
                        return;
                    }
                })();
            } catch (err) {
                console.error('leaderboardSubmit handler error:', err);
                sendResponse({ error: 'internal', message: String(err) });
            }
        })();
        // indicate async response
        return true;
    }
});
