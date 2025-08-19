// server.js
/**
 * This file contains a complete Node.js Express server to replicate the
 * Python Flask application for the Lark external options API.
 * It includes routes for:
 * - /get_third_level_subjects
 * - /budget_num
 * - /get_loan_note
 * - /get_loan_currency
 * - /get_loan_amount
 * - /get_loan_title
 *
 * NOTE: This code uses in-memory data to simulate a database. You will need
 * to replace the data arrays with your actual database queries.
 */

// --- Dependencies & Setup ---
const express = require('express');
const bodyParser = require('body-parser');
const moment = require('moment'); // Using moment.js for date handling, a common practice
require('dotenv').config(); // Loads environment variables from a .env file

const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse JSON body from incoming requests
app.use(bodyParser.json());

// --- Simulated Database Data (for demonstration) ---
// This is a placeholder for your database.
// You should replace these with actual database queries.

const accountingSubjects = [
    { id: 1, third_level_subjects: '科目A', third_level_subjects_en: 'Subject A' },
    { id: 2, third_level_subjects: '科目B', third_level_subjects_en: 'Subject B' },
    { id: 3, third_level_subjects: '科目C', third_level_subjects_en: 'Subject C' },
    { id: 4, third_level_subjects: '科目D', third_level_subjects_en: 'Subject D' },
];

const budgetData = [
    { third_level_subjects: '科目A', budget_month: '2024-05-01', budget_num: 'BUDGET-001' },
    { third_level_subjects: '科目B', budget_month: '2024-05-01', budget_num: 'BUDGET-002' },
    { third_level_subjects: '科目C', budget_month: '2024-05-01', budget_num: 'BUDGET-003' },
    { third_level_subjects: '科目A', budget_month: '2024-04-01', budget_num: 'BUDGET-004' },
];

const loanNotes = [
    { lark_num: 'LN-001', status: '已通过', verify: '', currency: 'CNY', amount: 1000, lark_title: '借款单主题一' },
    { lark_num: 'LN-002', status: '已通过', verify: '', currency: 'USD', amount: 2500, lark_title: '借款单主题二' },
    { lark_num: 'LN-003', status: '已通过', verify: '', currency: 'EUR', amount: 500, lark_title: null },
    { lark_num: 'LN-004', status: '待审批', verify: '', currency: 'CNY', amount: 1200, lark_title: '借款单主题四' },
];

// --- Helper Functions ---

/**
 * Checks if a string contains any Chinese characters.
 * @param {string} text The string to check.
 * @returns {boolean} True if the string contains Chinese characters, false otherwise.
 */
function containsChinese(text) {
    if (!text) return false;
    return /[\u4e00-\u9fff]/.test(text);
}

// --- API Endpoints ---

/**
 * GET route for Vercel health checks and basic browser access.
 * Returns a simple success message.
 */
app.get('/', (req, res) => {
    res.status(200).send('Lark API server is running!');
});

/**
 * POST /get_third_level_subjects
 * Replicates the Python function to get third-level subjects from the database.
 */
app.post('/get_third_level_subjects', (req, res) => {
    try {
        // Simulated database query
        // In a real application, you would use a database client here.
        // Example with a hypothetical DB client:
        // const subjectsList = await db.query('SELECT third_level_subjects, third_level_subjects_en FROM AccountingSubject WHERE id BETWEEN 1 AND 140');
        const subjectsList = accountingSubjects.filter(sub => sub.id >= 1 && sub.id <= 140);
        
        let optionsList = [];
        let textDict = {};
        let enTextDict = {};
        let n = 1;

        for (const subject of subjectsList) {
            const value = `@i18n@options_1_name_${n}`;
            const optionsId = `options_1_id_${n}`;
            textDict[value] = subject.third_level_subjects;
            enTextDict[value] = subject.third_level_subjects_en;

            optionsList.push({
                id: optionsId,
                value: value,
                isDefault: false
            });
            n++;
        }

        const result = {
            code: 0,
            msg: "success!",
            data: {
                result: {
                    options: optionsList,
                    i18nResources: [
                        {
                            locale: "zh_cn",
                            isDefault: false,
                            texts: textDict
                        },
                        {
                            locale: "en_us",
                            isDefault: false,
                            texts: enTextDict
                        }
                    ],
                    hasMore: false,
                    nextPageToken: "xxxx"
                }
            }
        };

        return res.json(result);
    } catch (e) {
        console.error('Error in /get_third_level_subjects:', e);
        return res.status(500).json({ code: 1, msg: "failed", data: {} });
    }
});

/**
 * POST /budget_num
 * Replicates the Python function to get budget numbers based on a linked subject.
 */
app.post('/budget_num', (req, res) => {
    try {
        const linkageParams = req.body.linkage_params;
        if (!linkageParams || !linkageParams.subject) {
            return res.json({ code: 1, msg: "参数错误!", data: { result: { options: [] } } });
        }
        
        let thirdSubject = linkageParams.subject;

        // Check if the subject is English and find its Chinese equivalent
        if (!containsChinese(thirdSubject)) {
            const subject = accountingSubjects.find(s => s.third_level_subjects_en === thirdSubject);
            if (subject) {
                thirdSubject = subject.third_level_subjects;
            } else {
                return res.json({ code: 1, msg: "参数错误!", data: { result: { options: [] } } });
            }
        }

        // Get the first day of the current month in "YYYY-MM-DD" format
        const budgetMonth = moment().startOf('month').format("YYYY-MM-DD");

        // Simulated database query for budget numbers
        const subjectsList = budgetData.filter(item => 
            item.third_level_subjects === thirdSubject && moment(item.budget_month).format("YYYY-MM-DD") === budgetMonth
        ).map(item => ({ budget_num: item.budget_num }));

        subjectsList.push({ budget_num: "N/A" });

        let optionsList = [];
        let textDict = {};
        let enTextDict = {};
        let n = 1;

        for (const subject of subjectsList) {
            const value = `@i18n@options_1_name_b_${n}`;
            const optionsId = `options_1_id_b_${n}`;
            const budget = subject.budget_num;
            textDict[value] = budget;
            enTextDict[value] = budget;

            optionsList.push({
                id: optionsId,
                value: value,
                isDefault: false
            });
            n++;
        }

        const result = {
            code: 0,
            msg: "success!",
            data: {
                result: {
                    options: optionsList,
                    i18nResources: [
                        {
                            locale: "zh_cn",
                            isDefault: false,
                            texts: textDict
                        },
                        {
                            locale: "en_us",
                            isDefault: false,
                            texts: enTextDict
                        }
                    ],
                    hasMore: false,
                    nextPageToken: "xxxx"
                }
            }
        };

        return res.json(result);
    } catch (e) {
        console.error('Error in /budget_num:', e);
        return res.status(500).json({ code: 1, msg: "failed", data: {} });
    }
});

/**
 * POST /get_loan_note
 * Replicates the Python function to get loan note numbers.
 */
app.post('/get_loan_note', (req, res) => {
    try {
        // Simulated database query
        const subjectsList = loanNotes.filter(note => note.status === '已通过' && note.verify === '').map(note => ({ lark_num: note.lark_num }));

        let optionsList = [];
        let textDict = {};
        let n = 1;

        for (const subject of subjectsList) {
            const value = `@i18n@options_1_name_n_${n}`;
            const optionsId = `options_1_id_n_${n}`;
            textDict[value] = subject.lark_num;

            optionsList.push({
                id: optionsId,
                value: value,
                isDefault: false
            });
            n++;
        }

        const result = {
            code: 0,
            msg: "success!",
            data: {
                result: {
                    options: optionsList,
                    i18nResources: [
                        {
                            locale: "zh_cn",
                            isDefault: true,
                            texts: textDict
                        },
                        {
                            locale: "en_us",
                            isDefault: true,
                            texts: textDict
                        }
                    ],
                    hasMore: false,
                    nextPageToken: "xxxx"
                }
            }
        };

        return res.json(result);
    } catch (e) {
        console.error('Error in /get_loan_note:', e);
        return res.status(500).json({ code: 1, msg: "failed", data: {} });
    }
});

/**
 * POST /get_loan_currency
 * Replicates the Python function to get the currency for a specific loan number.
 */
app.post('/get_loan_currency', (req, res) => {
    try {
        const linkageParams = req.body.linkage_params;
        if (!linkageParams || !linkageParams.number) {
            return res.json({ code: 1, msg: "参数错误!", data: { result: { options: [] } } });
        }
        
        const number = linkageParams.number;
        
        // Simulated database query
        const subject = loanNotes.find(note => note.lark_num === number);
        const subjects = subject ? subject.currency : null;

        if (!subjects) {
            return res.json({ code: 1, msg: "未找到借款单号!", data: { result: { options: [] } } });
        }

        let optionsList = [];
        let textDict = {};
        const value = `@i18n@options_1_name_l_${1}`;
        const optionsId = `options_1_id_l_${1}`;
        textDict[value] = subjects;

        optionsList.push({
            id: optionsId,
            value: value,
            isDefault: false
        });

        const result = {
            code: 0,
            msg: "success!",
            data: {
                result: {
                    options: optionsList,
                    i18nResources: [
                        {
                            locale: "zh_cn",
                            isDefault: true,
                            texts: textDict
                        },
                        {
                            locale: "en_us",
                            isDefault: true,
                            texts: textDict
                        }
                    ],
                    hasMore: false,
                    nextPageToken: "xxxx"
                }
            }
        };

        return res.json(result);
    } catch (e) {
        console.error('Error in /get_loan_currency:', e);
        return res.status(500).json({ code: 1, msg: "failed", data: {} });
    }
});

/**
 * POST /get_loan_amount
 * Replicates the Python function to get the amount for a specific loan number.
 */
app.post('/get_loan_amount', (req, res) => {
    try {
        const linkageParams = req.body.linkage_params;
        if (!linkageParams || !linkageParams.number) {
            return res.json({ code: 1, msg: "参数错误!", data: { result: { options: [] } } });
        }
        
        const number = linkageParams.number;
        
        // Simulated database query
        const subject = loanNotes.find(note => note.lark_num === number);
        const subjects = subject ? subject.amount : null;

        if (!subjects) {
            return res.json({ code: 1, msg: "未找到借款单号!", data: { result: { options: [] } } });
        }

        let optionsList = [];
        let textDict = {};
        const value = `@i18n@options_1_name_a_1`;
        const optionsId = `options_1_id_a_1`;
        textDict[value] = subjects;

        optionsList.push({
            id: optionsId,
            value: value,
            isDefault: false
        });

        const result = {
            code: 0,
            msg: "success!",
            data: {
                result: {
                    options: optionsList,
                    i18nResources: [
                        {
                            locale: "zh_cn",
                            isDefault: true,
                            texts: textDict
                        },
                        {
                            locale: "en_us",
                            isDefault: true,
                            texts: textDict
                        }
                    ],
                    hasMore: false,
                    nextPageToken: "xxxx"
                }
            }
        };

        return res.json(result);
    } catch (e) {
        console.error('Error in /get_loan_amount:', e);
        return res.status(500).json({ code: 1, msg: "failed", data: {} });
    }
});

/**
 * POST /get_loan_title
 * Replicates the Python function to get the title for a specific loan number.
 */
app.post('/get_loan_title', (req, res) => {
    try {
        const linkageParams = req.body.linkage_params;
        if (!linkageParams || !linkageParams.number) {
            return res.json({ code: 1, msg: "参数错误!", data: { result: { options: [] } } });
        }
        
        const number = linkageParams.number;
        
        // Simulated database query
        const subject = loanNotes.find(note => note.lark_num === number);
        const subjects = subject ? subject.lark_title : null;

        let optionsList = [];
        let textDict = {};
        const value = `@i18n@options_1_name_t_1`;
        const optionsId = `options_1_id_t_1`;
        textDict[value] = subjects || "N/A";

        optionsList.push({
            id: optionsId,
            value: value,
            isDefault: false
        });

        const result = {
            code: 0,
            msg: "success!",
            data: {
                result: {
                    options: optionsList,
                    i18nResources: [
                        {
                            locale: "zh_cn",
                            isDefault: true,
                            texts: textDict
                        },
                        {
                            locale: "en_us",
                            isDefault: true,
                            texts: textDict
                        }
                    ],
                    hasMore: false,
                    nextPageToken: "xxxx"
                }
            }
        };

        return res.json(result);
    } catch (e) {
        console.error('Error in /get_loan_title:', e);
        return res.status(500).json({ code: 1, msg: "failed", data: {} });
    }
});

// --- Server Start ---
app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
