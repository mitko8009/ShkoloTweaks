(function () {
    const SELECTOR = '#twroot > sb-root > sb-snackbar-root > sb-student > sb-app-chrome > div > div > main > div > ng-component > sb-simple-page-skeleton-template > sb-book > sb-tabs > div > div > ng-component > sb-simple-tab-skeleton-template > sb-grades > div > table';
    const FALLBACK_SELECTOR = 'table.table-grades';

    function waitForGradesTable(retries = 20, interval = 500) {
        return new Promise((resolve, reject) => {
            const attempt = () => {
                const table = document.querySelector(SELECTOR) || document.querySelector(FALLBACK_SELECTOR);
                if (table) {
                    resolve(table);
                    gradesTable = table;
                    console.log('[ShkoloTweaks]: Grades table found.');
                } else if (retries > 0) {
                    retries--;
                    setTimeout(attempt, interval);
                    console.log('[ShkoloTweaks]: Waiting for grades table to load...');
                } else {
                    reject(new Error('Grades table not found'));
                    console.warn('[ShkoloTweaks]: Grades table not found after multiple attempts.');
                }
            };
            attempt();
        });
    }

    function parseGradesTable() {
        return waitForGradesTable().then(table => {
            const rows = table.querySelectorAll('tbody tr');

            const g1_values = [];
            const term1_values = [];
            const g2_values = [];
            const term2_values = [];
            const year_values = [];

            for (const row of rows) {
                const cells = row.querySelectorAll('td');
                if (cells.length < 6) continue;

                // Second cell: first term grades
                const g1Cell = cells[1];
                const g1Grades = [];
                if (g1Cell && g1Cell.classList.contains('first-term-only')) {
                    const gradeButtons = g1Cell.querySelectorAll('.grade .grade-text');
                    gradeButtons.forEach(btn => {
                        const gradeValue = btn.textContent.trim();
                        if (gradeValue) g1Grades.push(parseFloat(gradeValue));
                    });
                }
                g1_values.push(g1Grades);

                // Third cell: first term final grade
                const term1Cell = cells[2];
                const term1Grades = [];
                if (term1Cell) {
                    const gradeButtons = term1Cell.querySelectorAll('.grade .grade-text');
                    gradeButtons.forEach(btn => {
                        const gradeValue = btn.textContent.trim();
                        if (gradeValue) term1Grades.push(parseFloat(gradeValue));
                    });
                }
                term1_values.push(term1Grades);

                // Fourth cell: second term grades (class "second-term-only")
                const g2Cell = cells[3];
                const g2Grades = [];
                if (g2Cell && g2Cell.classList.contains('second-term-only')) {
                    const gradeButtons = g2Cell.querySelectorAll('.grade .grade-text');
                    gradeButtons.forEach(btn => {
                        const gradeValue = btn.textContent.trim();
                        if (gradeValue) g2Grades.push(parseFloat(gradeValue));
                    });
                }
                g2_values.push(g2Grades);

                // Fifth cell: second term final grade
                const term2Cell = cells[4];
                const term2Grades = [];
                if (term2Cell) {
                    const gradeButtons = term2Cell.querySelectorAll('.grade .grade-text');
                    gradeButtons.forEach(btn => {
                        const gradeValue = btn.textContent.trim();
                        if (gradeValue) term2Grades.push(parseFloat(gradeValue));
                    });
                }
                term2_values.push(term2Grades);

                // Sixth cell: year final grade
                const yearCell = cells[5];
                const yearGrades = [];
                if (yearCell) {
                    const gradeButtons = yearCell.querySelectorAll('.grade .grade-text');
                    gradeButtons.forEach(btn => {
                        const gradeValue = btn.textContent.trim();
                        if (gradeValue) yearGrades.push(parseFloat(gradeValue));
                    });
                }
                year_values.push(yearGrades);
            }

            const gradesData = {
                g1_values,
                term1_values,
                g2_values,
                term2_values,
                year_values
            };

            return gradesData;
        }).catch(error => {
            console.error('[ShkoloTweaks]: Error locating grades table:', error);
        });
    }

    function calculateAverage(gradesArray) {
        const allGrades = gradesArray.flat().filter(grade => !isNaN(grade) && grade > 0);
        if (allGrades.length === 0) return null;
        const sum = allGrades.reduce((acc, grade) => acc + grade, 0);
        return (sum / allGrades.length).toFixed(2);
    }

    function displayAverageValues() {
        chrome.storage.sync.get(null, (result) => {
            const enabled = result.mon_grades_average ?? false;
            if (!enabled) return;

            parseGradesTable().then(data => {
                // Calculate averages
                const g1Avg = calculateAverage(data.g1_values);
                const term1Avg = calculateAverage(data.term1_values);
                const g2Avg = calculateAverage(data.g2_values);
                const term2Avg = calculateAverage(data.term2_values);
                const yearAvg = calculateAverage(data.year_values);

                // Create average row
                const tbody = gradesTable.querySelector('tbody');
                const avgRow = document.createElement('tr');
                avgRow.className = 'shkolo-tweaks-average-row';
                avgRow.style.fontWeight = 'bold';
                avgRow.style.backgroundColor = 'rgba(0, 123, 255, 0.1)';
                avgRow.style.borderTop = '2px solid #fff';

                // Subject column
                const subjectCell = document.createElement('td');
                subjectCell.textContent = 'Среден успех';
                avgRow.appendChild(subjectCell);

                // G1 average
                const g1Cell = document.createElement('td');
                g1Cell.className = 'grade-cell first-term-only';
                g1Cell.textContent = g1Avg || '-';
                avgRow.appendChild(g1Cell);

                // Term 1 average
                const term1Cell = document.createElement('td');
                term1Cell.className = 'grade-cell';
                term1Cell.textContent = term1Avg || '-';
                avgRow.appendChild(term1Cell);

                // G2 average
                const g2Cell = document.createElement('td');
                g2Cell.className = 'grade-cell second-term-only';
                g2Cell.textContent = g2Avg || '-';
                avgRow.appendChild(g2Cell);

                // Term 2 average
                const term2Cell = document.createElement('td');
                term2Cell.className = 'grade-cell';
                term2Cell.textContent = term2Avg || '-';
                avgRow.appendChild(term2Cell);

                // Year average
                const yearCell = document.createElement('td');
                yearCell.className = 'grade-cell';
                yearCell.textContent = yearAvg || '-';
                avgRow.appendChild(yearCell);

                // Remove existing average row if present
                const existingAvgRow = tbody.querySelector('.shkolo-tweaks-average-row');
                if (existingAvgRow) {
                    existingAvgRow.remove();
                }

                avgRow.children[0].style.padding = '8px';
                avgRow.children[0].style.textAlign = 'left';
                avgRow.style.textAlign = 'center';

                gradesTable.appendChild(avgRow);
                console.log('[ShkoloTweaks]: Average row added to grades table.');
            });
        });
    }

    displayAverageValues();
})();

