class Leaderboard {
    static API_URL = 'https://shtw.pishkisoriz.com/leaderboard';

    static async fetchWithTimeout(url, options = {}, timeout = 8000) {
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
    }

    // safe sendMessage wrapper (used by fetchLeaderboard/submit)
    static sendMessageWithTimeout(message, timeout = 8000) {
        return new Promise((resolve, reject) => {
            // quick checks
            if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.sendMessage) {
                reject(new Error('runtime: Runtime messaging not available'));
                return;
            }

            let finished = false;
            const timer = setTimeout(() => {
                if (finished) return;
                finished = true;
                reject(new Error('timeout: No response from extension (timeout)'));
            }, timeout);

            try {
                chrome.runtime.sendMessage(message, (resp) => {
                    if (finished) return;
                    finished = true;
                    clearTimeout(timer);

                    // runtime lastError may be set when extension SW restarted/terminated
                    if (chrome.runtime && chrome.runtime.lastError) {
                        const msg = String(chrome.runtime.lastError.message || '');
                        // normalize the specific context invalidated case
                        if (msg.toLowerCase().includes('context invalidated') || msg.toLowerCase().includes('extension context invalidated')) {
                            reject(new Error('context_invalidated: ' + msg));
                        } else {
                            reject(new Error('runtime: ' + msg));
                        }
                        return;
                    }

                    // explicit undefined/null handling
                    if (typeof resp === 'undefined' || resp === null) {
                        reject(new Error('empty: Background returned no data'));
                        return;
                    }

                    resolve(resp);
                });
            } catch (err) {
                if (finished) return;
                finished = true;
                clearTimeout(timer);
                const m = String(err && err.message ? err.message : err);
                if (m.toLowerCase().includes('context invalidated') || m.toLowerCase().includes('extension context invalidated')) {
                    reject(new Error('context_invalidated: ' + m));
                } else {
                    reject(err);
                }
            }
        });
    }

    /**
     * fetchLeaderboard: delegate to background via sendMessageWithTimeout and return structured results.
     */
    static async fetchLeaderboard() {
        try {
            const resp = await this.sendMessageWithTimeout({ type: 'leaderboardFetch' }, 8000);
            return resp;
        } catch (err) {
            // err.message may contain a prefix we set (e.g. 'context_invalidated: ...')
            const msg = String(err && err.message ? err.message : err);
            if (msg.indexOf('context_invalidated') === 0 || msg.toLowerCase().includes('context_invalidated')) {
                return { error: 'context_invalidated', message: msg };
            }
            // preserve previous error codes where possible
            if (msg.indexOf('timeout') === 0 || msg.toLowerCase().includes('timeout')) return { error: 'timeout', message: msg };
            if (msg.indexOf('runtime') === 0) return { error: 'runtime', message: msg };
            if (msg.indexOf('empty') === 0) return { error: 'empty', message: msg };
            return { error: 'fetch', message: msg };
        }
    }

    // Try fetching leaderboard directly from the server (content-script -> server).
    // Returns parsed JSON or an error-shaped object similar to the service worker.
    static async fetchLeaderboardFromServer(timeout = 8000) {
        try {
            const response = await this.fetchWithTimeout(this.API_URL + '/get', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                mode: 'cors',
                credentials: 'omit'
            }, timeout);

            if (!response.ok) {
                let text = '';
                try { text = await response.text(); } catch (e) { /* ignore */ }
                return { error: 'http', status: response.status, message: `HTTP ${response.status} ${response.statusText}`, body: text };
            }

            const json = await response.json();
            return json;
        } catch (err) {
            const msg = String(err && err.message ? err.message : err);
            if (msg.toLowerCase().includes('timeout')) return { error: 'timeout', message: msg };
            return { error: 'fetch', message: msg };
        }
    }

    // Submit grades directly to server and return parsed JSON or an error object.
    static async submitGradesToServer(payload, timeout = 10000) {
        try {
            const response = await this.fetchWithTimeout(this.API_URL + '/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                mode: 'cors',
                credentials: 'omit'
            }, timeout);

            if (!response.ok) {
                let text = '';
                try { text = await response.text(); } catch (e) { /* ignore */ }
                return { error: 'http', status: response.status, message: `HTTP ${response.status} ${response.statusText}`, body: text };
            }

            const json = await response.json();
            return json;
        } catch (err) {
            const msg = String(err && err.message ? err.message : err);
            if (msg.toLowerCase().includes('timeout')) return { error: 'timeout', message: msg };
            return { error: 'fetch', message: msg };
        }
    }

    // Helper: try direct server submit+fetch; if direct fails due to CORS/network, fall back to messaging background.
    static async submitAndRefresh(payload) {
        // Prefer using the extension background/service worker proxy first
        // because direct requests from the page may be blocked by CORS.
        try {
            if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
                try {
                    const bgResp = await this.sendMessageWithTimeout({ type: 'leaderboardSubmit', payload }, 10000);
                    // after successful background submit, try to fetch via background
                    try {
                        const fetchBg = await this.sendMessageWithTimeout({ type: 'leaderboardFetch' }, 8000);
                        return { submit: bgResp, leaderboard: fetchBg };
                    } catch (e) {
                        return { submit: bgResp, leaderboard: { error: 'fetch_fallback_failed', message: String(e && e.message ? e.message : e) } };
                    }
                } catch (msgErr) {
                    // background messaging failed; fall through to try direct submit
                    console.warn('Background messaging for submit failed, will try direct submit:', msgErr);
                }
            }

            // As a last resort, try direct submit from the page (may be blocked by CORS)
            const submitResp = await this.submitGradesToServer(payload);
            if (submitResp && submitResp.error) {
                return { submit: submitResp };
            }

            const leaderboardResp = await this.fetchLeaderboardFromServer();
            if (leaderboardResp && leaderboardResp.error) {
                return { submit: submitResp, leaderboard: leaderboardResp };
            }
            return { submit: submitResp, leaderboard: leaderboardResp };
        } catch (err) {
            return { error: 'submit_and_refresh_failed', message: String(err && err.message ? err.message : err) };
        }
    }
}

let lbWidgetTitle;
let lbWidgetContent;

const lb_Widget = (typeof WIDGETSROW !== 'undefined' && WIDGETSROW.children && WIDGETSROW.children[0]) ? WIDGETSROW.children[0].cloneNode(true) : null;
let lb_Data = [];

async function lb_fetchAndRender() {
    if (!lb_Widget) return;
    try {
        lbWidgetContent.innerHTML = (chrome.i18n && chrome.i18n.getMessage) ? chrome.i18n.getMessage("Loading") : "Loading...";
        const data = await Leaderboard.fetchLeaderboard();

        // handle structured error responses (including context_invalidated)
        if (data && data.error) {
            let friendly = 'Failed to fetch leaderboard data.';
            if (data.error === 'offline') friendly = 'You appear to be offline.';
            else if (data.error === 'timeout') friendly = 'Request timed out. Background did not respond.';
            else if (data.error === 'http') friendly = `Server returned ${data.status}: ${data.message || ''}`;
            else if (data.error === 'fetch' || data.error === 'send') friendly = `Network/messaging error: ${data.message || ''}`;
            else if (data.error === 'runtime') friendly = `Extension runtime error: ${data.message || ''}`;
            else if (data.error === 'empty') friendly = 'No data returned from background.';
            else if (data.error === 'context_invalidated') friendly = 'Extension background was restarted (context invalidated). Please reload the extension (chrome://extensions) or refresh the page and try again.';
            else friendly = data.message || friendly;

            lbWidgetContent.innerHTML = `<div style="padding:8px;color:#b91c1c;">${friendly}</div>`;

            // add retry button
            const retryBtn = document.createElement('button');
            retryBtn.textContent = (chrome.i18n && chrome.i18n.getMessage) ? chrome.i18n.getMessage("Refresh") || "Refresh" : "Refresh";
            retryBtn.className = "widget_buttons rounded";
            retryBtn.style.marginTop = "8px";
            retryBtn.onclick = () => {
                lb_fetchAndRender();
            };
            lbWidgetContent.appendChild(retryBtn);
            return;
        }

        lb_Data = Array.isArray(data) ? data : [];
        lb_renderData(lb_Data);
    } catch (err) {
        console.error("lb_fetchAndRender error:", err);
        lbWidgetContent.innerHTML = `<div style="padding:8px;color:#b91c1c;">Error loading leaderboard.</div>`;
    }
}

function lb_renderData(data) {
    lbWidgetContent.innerHTML = "";
    if (!data || data.length === 0) {
        lbWidgetContent.innerHTML = chrome.i18n && chrome.i18n.getMessage ? (chrome.i18n.getMessage("NoLeaderboardData") || "No leaderboard data available.") : "No leaderboard data available.";
        return;
    }

    // Limit items to 10 for display
    const maxItems = 10;
    let count = 0;

    data.slice(0, maxItems).forEach(item => {
        if (count >= maxItems) return;
        // create a widget item similar in style to other widgets
        const node = document.createElement("div");
        node.classList.add("rounded", "leaderboardItem");
        node.style = "margin-top: 8px; padding: 10px; font-size: 14px; border: 1px solid var(--primary-fg); display:flex; align-items:center; justify-content:space-between;";

        const left = document.createElement("div");
        left.style.flex = "1";

        const title = document.createElement("div");
        title.style.fontWeight = "600";
        title.textContent = `Pupil ID: ${item && item.pupilID ? item.pupilID : "N/A"}`;
        left.appendChild(title);

        const meta = document.createElement("div");
        meta.style.fontSize = "13px";
        meta.style.color = "#444";
        // safe grade/note handling
        let grades = "—";
        if (item && Array.isArray(item.grades)) grades = item.grades.join(', ');
        else if (item && item.grades !== undefined && item.grades !== null) grades = String(item.grades);

        let notes = "—";
        if (item && Array.isArray(item.notes)) notes = item.notes.join('; ');
        else if (item && item.notes !== undefined && item.notes !== null) notes = String(item.notes);

        meta.textContent = `Grades: ${grades}  •  Notes: ${notes}`;
        left.appendChild(meta);

        node.appendChild(left);

        // optional right-side small info (timestamp or rank if present)
        const right = document.createElement("div");
        right.style.marginLeft = "12px";
        right.style.fontSize = "12px";
        right.style.color = "#666";
        if (item && item.timestamp) {
            try {
                const dt = new Date(item.timestamp * 1000);
                right.textContent = dt.toLocaleString();
            } catch (e) {
                right.textContent = "";
            }
        } else if (item && item.rank) {
            right.textContent = `#${item.rank}`;
        }
        node.appendChild(right);

        lbWidgetContent.appendChild(node);
        count++;
    });
}

function lb_main() {
    try {
        if (!lb_Widget) return;
        lb_Widget.className = `col-sm-6`;
        lb_Widget.children[0].className = `portlet portlet-sortable light bordered`;

        lbWidgetTitle = lb_Widget.children[0].children[0].children[0].children[1];
        lbWidgetContent = lb_Widget.children[0].children[1];

        // cleanup cloned contents
        try { removeElements(lb_Widget.children[0].children[1].children); } catch (e) { /* ignore */ }
        try { removeElements(lb_Widget.children[0].children[0].children[0].children[0].children); } catch (e) { /* ignore */ }
        try { lb_Widget.children[0].children[0].children[0].children[0].remove(); } catch (e) { /* ignore */ }

        lbWidgetTitle.innerHTML = chrome.i18n.getMessage ? chrome.i18n.getMessage("LeaderboardTitle") || "Leaderboard" : "Leaderboard";
        lb_Widget.children[0].children[0].children[0].appendChild(getIcon ? getIcon("trophy") : document.createElement("span"));

        lbWidgetContent.style.fontSize = "14px";
        lbWidgetContent.style.fontWeight = "bold";
        lbWidgetContent.style.padding = "10px";
        lbWidgetContent.innerHTML = chrome.i18n.getMessage ? chrome.i18n.getMessage("Loading") : "Loading";

        let headerButtons = document.createElement("div");
        headerButtons.classList.add("pull-right", "widget_buttons_row", "rounded");

        let viewOnline = document.createElement("a");
        viewOnline.innerHTML = chrome.i18n && chrome.i18n.getMessage ? (chrome.i18n.getMessage("ViewMore") || "View") : "View";
        viewOnline.href = Leaderboard.API_URL;
        viewOnline.target = "_blank";
        viewOnline.classList.add("pull-right", "widget_buttons", "rounded");
        headerButtons.appendChild(viewOnline);

        // Refresh button
        let refreshBtn = document.createElement("a");
        refreshBtn.innerHTML = chrome.i18n && chrome.i18n.getMessage ? (chrome.i18n.getMessage("Refresh") || "Refresh") : "Refresh";
        refreshBtn.classList.add("pull-right", "widget_buttons", "rounded");
        refreshBtn.style.cursor = "pointer";
        refreshBtn.onclick = () => {
            lb_fetchAndRender();
        };
        headerButtons.appendChild(refreshBtn);

        let submitBtn = document.createElement("a");
        submitBtn.innerHTML = chrome.i18n && chrome.i18n.getMessage ? (chrome.i18n.getMessage("Submit") || "Submit") : "Submit";
        submitBtn.classList.add("pull-right", "widget_buttons", "rounded");
        submitBtn.style.cursor = "pointer";
        submitBtn.onclick = async () => {
            try {
                const username = prompt("Enter username for leaderboard (will be public):");
                if (username === null) return;
                const trimmedUser = (username || "").trim();
                if (!trimmedUser) { alert("Username required."); return; }

                const passphrase = prompt("Enter passphrase (used to protect your entry):");
                if (passphrase === null) return;
                const trimmedPass = (passphrase || "").trim();
                if (!trimmedPass) { alert("Passphrase required."); return; }

                const old = lbWidgetContent.innerHTML;
                lbWidgetContent.innerHTML = "Collecting grades and notes...";

                const pupilId = (typeof pupil_id !== 'undefined') ? pupil_id : null;
                if (!pupilId) {
                    alert("Pupil ID not found on page. Cannot submit.");
                    lbWidgetContent.innerHTML = old;
                    return;
                }

                function ajaxPromise(url) {
                    return new Promise((resolve) => {
                        try {
                            ajax(url, 'GET', '', function (response) { resolve(response); });
                        } catch (e) {
                            resolve(null);
                        }
                    });
                }

                const gradesHtml = await ajaxPromise(`https://app.shkolo.bg/ajax/diary/getGradesForPupil?pupil_id=${pupilId}`);
                const notesHtml = await ajaxPromise(`https://app.shkolo.bg/ajax/diary/getFeedbacksForPupil?pupil_id=${pupilId}`);

                // parse grades HTML into { courseId: { name: string, grades: [number...] } }
                function parseGrades(html) {
                    const out = {};
                    if (!html) return out;
                    try {
                        const doc = new DOMParser().parseFromString(html, 'text/html');
                        // Prefer the known table id if present
                        const table = doc.getElementById('tableGrades') || doc.querySelector('table.table');
                        if (!table) return out;

                        const rows = Array.from(table.querySelectorAll('tbody tr.compactTableRow'));
                        rows.forEach(row => {
                            try {
                                // course id is stored in data-course-id on the row
                                const courseId = row.getAttribute('data-course-id') || '';
                                // Subject cell is the second td
                                const subjectCell = row.querySelector('td:nth-child(2)');
                                if (!subjectCell) return;
                                // extract subject name (strip icon and excess whitespace)
                                let subject = (subjectCell.textContent || '').trim();
                                subject = subject.replace(/\s+/g, ' ');
                                if (!subject) return;

                                // Collect grades from buttons with class "grade" inside the row
                                const gradeButtons = Array.from(row.querySelectorAll('button.grade'));
                                const nums = [];
                                gradeButtons.forEach(btn => {
                                    const txt = (btn.textContent || '').trim();
                                    const v = parseFloat(txt.replace(',', '.'));
                                    if (!Number.isNaN(v)) nums.push(v);
                                });

                                if (nums.length) {
                                    const key = courseId || subject;
                                    out[key] = {
                                        name: subject,
                                        grades: nums
                                    };
                                }
                            } catch (inner) {
                                // ignore row parse errors
                            }
                        });
                    } catch (e) {
                        console.warn("parseGrades failed", e);
                    }
                    return out;
                }

                // parse notes HTML into positive/negative counts
                // Prefer reading the structured feedback table (#tableFeedbacks) and summing numeric buttons.
                function parseNotesCounts(html) {
                    let pos = 0, neg = 0;
                    if (!html) return { pos, neg };
                    try {
                        const doc = new DOMParser().parseFromString(html, 'text/html');
                        const table = doc.getElementById('tableFeedbacks') || doc.querySelector('table.table');
                        if (table) {
                            const rows = Array.from(table.querySelectorAll('tbody tr.compactTableRow'));
                            rows.forEach(row => {
                                try {
                                    const negCell = row.querySelector('td:nth-child(3)');
                                    const posCell = row.querySelector('td:nth-child(4)');
                                    const negBtn = negCell ? negCell.querySelector('button') : null;
                                    const posBtn = posCell ? posCell.querySelector('button') : null;
                                    const negVal = negBtn ? parseInt((negBtn.textContent || '').trim(), 10) : 0;
                                    const posVal = posBtn ? parseInt((posBtn.textContent || '').trim(), 10) : 0;
                                    if (!Number.isNaN(negVal)) neg += negVal;
                                    if (!Number.isNaN(posVal)) pos += posVal;
                                } catch (inner) { /* ignore row parse errors */ }
                            });
                            return { pos, neg };
                        }

                        // fallback: gather any visible feedback buttons and heuristically classify
                        const buttons = Array.from(doc.querySelectorAll('button.feedbacks, button.btn-mobile.feedbacks, .feedbackItem button'));
                        if (buttons.length) {
                            buttons.forEach(b => {
                                const txt = (b.textContent || '').trim();
                                const n = parseInt(txt, 10);
                                if (!Number.isNaN(n)) {
                                    const id = (b.id || '').toLowerCase();
                                    const cls = (b.className || '').toLowerCase();
                                    if (id.indexOf(':') >= 0 || cls.indexOf('green') >= 0 || cls.indexOf('praise') >= 0) pos += n;
                                    else neg += n;
                                }
                            });
                            return { pos, neg };
                        }

                        // last-resort: count plus/minus signs
                        const plus = (html.match(/\+/g) || []).length;
                        const minus = (html.match(/-/g) || []).length;
                        pos += plus;
                        neg += minus;
                    } catch (e) {
                        console.warn("parseNotesCounts failed", e);
                    }

                    return { pos, neg };
                }

                const gradesByClass = parseGrades(gradesHtml);
                const notesCounts = parseNotesCounts(notesHtml);

                // assemble payload (do NOT include rating)
                const payload = {
                    username: trimmedUser,
                    passphrase: trimmedPass,
                    grades: gradesByClass,
                    N_positive_notes: notesCounts.pos,
                    N_negative_notes: notesCounts.neg,
                    pupil_id: pupilId,
                    school: (typeof school_name !== 'undefined' && school_name) ? school_name : ''
                };

                try {
                    const masked = Object.assign({}, payload, { passphrase: payload.passphrase ? '<hidden>' : '' });
                    console.debug('Leaderboard (content): submitting payload (masked):', masked);
                } catch (logErr) {
                    console.warn('Leaderboard (content): failed to log submission payload', logErr);
                }

                // Try direct server submit + refresh, fallback to messaging if necessary
                try {
                    const result = await Leaderboard.submitAndRefresh(payload);

                    // if top-level error
                    if (result && result.error) {
                        console.error('Submission error (submitAndRefresh):', result);
                        alert('Submission failed: ' + (result.message || JSON.stringify(result)));
                        lbWidgetContent.innerHTML = old;
                        return;
                    }

                    // server-submission path (submit and leaderboard present)
                    if (result && result.submit) {
                        if (result.submit.error) {
                            // server reported an error; show details and fallback info if present
                            console.error('Server submit error:', result.submit);
                            let userMsg = 'Submission error: ' + (result.submit.message || JSON.stringify(result.submit));
                            if (result.submit.status) userMsg += ` (status ${result.submit.status})`;
                            if (result.submit.body) {
                                const short = result.submit.body.length > 200 ? result.submit.body.slice(0, 200) + '…' : result.submit.body;
                                userMsg += `\nServer response: ${short}`;
                            }
                            alert(userMsg);
                        } else {
                            // success
                            alert('Submission successful: ' + (result.submit.message || 'OK'));
                        }
                    }

                    // if leaderboard data is available from server, render it
                    if (result && result.leaderboard) {
                        if (Array.isArray(result.leaderboard) && result.leaderboard.length > 0) {
                            lb_Data = result.leaderboard;
                            try { lb_renderData(lb_Data); } catch (e) { console.warn('Render error after submit:', e); }
                        } else if (result.leaderboard.error) {
                            console.warn('Leaderboard fetch returned error after submit:', result.leaderboard);
                            // if fallback messaging was used earlier it may have provided more details
                        }
                    }

                    // If submit was performed by background fallback, result may contain both submit and leaderboard as separate objects
                } catch (msgErr) {
                    console.error('Submit flow error (submitAndRefresh):', msgErr);
                    alert('Submission failed: ' + (msgErr && msgErr.message ? msgErr.message : String(msgErr)) + '. Try reloading the extension or the page.');
                } finally {
                    lbWidgetContent.innerHTML = old;
                }
            } catch (e) {
                console.error("Submit flow error:", e);
                alert("Failed to submit rating data: " + e);
            }
        };
        headerButtons.appendChild(submitBtn);

        // append and fetch data
        lb_Widget.children[0].children[0].appendChild(headerButtons);

        try { lb_Widget.children[0].children[2].remove(); } catch (e) { /* ignore */ }
        WIDGETSROW.appendChild(lb_Widget);

        lb_fetchAndRender();
    } catch (e) {
        console.error("Leaderboard widget error:", e);
    }
}

var disablePupilIDFeatures = false;
chrome.storage.local.get(null, (result) => { // LOCAL storage contains this flag
    disablePupilIDFeatures = result.disablePupilIDFeatures;
});

try {
    chrome.storage.sync.get(['leaderboard'], (res) => {
        chrome.storage.local.get(null, (local) => {
            const localDisabled = !!(local && local.disablePupilIDFeatures);
            if (res && res.leaderboard === true && !localDisabled) {
                lb_main();
            } else {
                try { if (lb_Widget && lb_Widget.remove) lb_Widget.remove(); } catch (e) { /* ignore */ }
            }
        });
    });
} catch (e) {
    console.error("Failed to initialize Leaderboard widget:", e);
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Leaderboard;
} else if (typeof window !== 'undefined') {
    window.Leaderboard = Leaderboard;
}