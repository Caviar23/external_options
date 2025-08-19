// server.js
/**
 * This file contains a complete Node.js Express server that replicates the
 * Python Flask application's functionality, including the connection to Lark Base.
 *
 * NOTE: This code uses the 'axios' library for making API requests.
 * Please ensure you have it installed: 'npm install axios'.
 *
 * It uses a new CWLarkAPI class to handle all interactions with the
 * Lark Base API, including token management and data retrieval.
 *
 * You MUST set up a .env file with the following variables:
 * LARK_APP_ID=your_app_id
 * LARK_APP_SECRET=your_app_secret
 *
 * You also need to replace the placeholder IDs in the code (e.g., 'Gflaw9RBkiaHAokB4axlHLpygVb').
 */

// --- Dependencies & Setup ---
const express = require('express');
const bodyParser = require('body-parser');
const moment = require('moment');
const axios = require('axios');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse JSON body from incoming requests
app.use(bodyParser.json());

// --- Lark Base API Class ---

/**
 * A singleton class to handle all communication with the Lark Base API.
 * It manages token acquisition and provides helper methods for fetching data.
 */
class CWLarkAPI {
    constructor() {
        if (CWLarkAPI._instance) {
            return CWLarkAPI._instance;
        }

        this.appId = process.env.LARK_APP_ID;
        this.appSecret = process.env.LARK_APP_SECRET;
        this.token = null;
        this.tokenExpiry = 0;
        this.initialized = false;
        CWLarkAPI._instance = this;
    }

    /**
     * Retrieves the application access token from Lark.
     * @returns {Promise<string>} The access token.
     */
    async _getAppToken() {
        const url = "https://open.feishu.cn/open-apis/auth/v3/app_access_token/internal";
        const headers = {
            "Content-Type": "application/json; charset=utf-8"
        };
        const postData = {
            "app_id": this.appId,
            "app_secret": this.appSecret
        };

        try {
            const response = await axios.post(url, postData, { headers, timeout: 10000 });
            return response.data["app_access_token"];
        } catch (error) {
            console.error('Error fetching app token:', error.response ? error.response.data : error.message);
            throw new Error('Failed to get app token.');
        }
    }

    /**
     * Gets or refreshes the access token.
     * @returns {Promise<string>} The valid access token.
     */
    async getToken() {
        const currentTime = Math.floor(Date.now() / 1000);
        // Token expires after 1 hour, we refresh it a bit earlier (3000 seconds)
        if (currentTime - this.tokenExpiry > 3000) {
            this.token = await this._getAppToken();
            this.tokenExpiry = currentTime;
        }
        return this.token;
    }

    /**
     * A generic method to fetch records from a Lark Base table.
     * @param {string} baseId - The Base ID (appToken).
     * @param {string} tableId - The table ID.
     * @param {string} [filters=''] - The filter query.
     * @param {string} [fieldNames=''] - A JSON string of field names.
     * @param {string} [viewId=''] - The view ID.
     * @param {number} [pageSize=100] - The number of records per page.
     * @returns {Promise<Array>} An array of records.
     */
    async getRecords(baseId, tableId, filters = '', fieldNames = '', viewId = '', pageSize = 100) {
        const token = await this.getToken();
        const url = `https://open.larksuite.com/open-apis/bitable/v1/apps/${baseId}/tables/${tableId}/records`;
        const headers = { "Authorization": `Bearer ${token}` };
        const params = {
            page_size: pageSize,
            filter: filters,
            field_names: fieldNames,
            view_id: viewId
        };

        try {
            const response = await axios.get(url, { headers, params, timeout: 10000 });
            if (!response.data.data || !response.data.data.items) {
                console.warn('No items found in response:', response.data);
                return [];
            }
            return response.data.data.items;
        } catch (error) {
            console.error('Error fetching records:', error.response ? error.response.data : error.message);
            throw new Error('Failed to get records from Lark Base.');
        }
    }

    /**
     * Fetches Department/ProductLine data.
     * @returns {Promise<Array>} An array of records.
     */
    async getDepartmentProductLine() {
        const baseId = 'Gflaw9RBkiaHAokB4axlHLpygVb'; // Replace with your Base ID
        const tableId = 'tblLSW8oShBhPOZg'; // Replace with your Table ID
        const fieldNames = JSON.stringify(["Department/ProductLine"]);

        const records = await this.getRecords(baseId, tableId, '', fieldNames);

        return records.map(record => ({
            departmentProductLine: record.fields["Department/ProductLine"]
        }));
    }

    /**
     * Fetches HOD data based on a selected department.
     * @param {string} department - The selected department name.
     * @returns {Promise<Array>} An array of records.
     */
    async getHOD(department) {
        const baseId = 'Gflaw9RBkiaHAokB4axlHLpygVb'; // Replace with your Base ID
        const tableId = 'tblLSW8oShBhPOZg'; // Replace with your Table ID
        const filters = `CurrentValue.[Department/ProductLine] = "${department}"`;
        const fieldNames = JSON.stringify(["HOD"]);

        const records = await this.getRecords(baseId, tableId, filters, fieldNames);

        return records.map(record => ({
            hod: record.fields.HOD
        }));
    }

    /**
     * Fetches HODLimit data based on a selected department.
     * @param {string} department - The selected department name.
     * @returns {Promise<Array>} An array of records.
     */
    async getHODLimit(department) {
        const baseId = 'Gflaw9RBkiaHAokB4axlHLpygVb'; // Replace with your Base ID
        const tableId = 'tblLSW8oShBhPOZg'; // Replace with your Table ID
        const filters = `CurrentValue.[Department/ProductLine] = "${department}"`;
        const fieldNames = JSON.stringify(["HODLimit"]);

        const records = await this.getRecords(baseId, tableId, filters, fieldNames);

        return records.map(record => ({
            hodLimit: record.fields.HODLimit
        }));
    }

    /**
     * Fetches 2ndTier data based on a selected department.
     * @param {string} department - The selected department name.
     * @returns {Promise<Array>} An array of records.
     */
    async get2ndTier(department) {
        const baseId = 'Gflaw9RBkiaHAokB4axlHLpygVb'; // Replace with your Base ID
        const tableId = 'tblLSW8oShBhPOZg'; // Replace with your Table ID
        const filters = `CurrentValue.[Department/ProductLine] = "${department}"`;
        const fieldNames = JSON.stringify(["2ndTier"]);

        const records = await this.getRecords(baseId, tableId, filters, fieldNames);

        return records.map(record => ({
            secondTier: record.fields["2ndTier"]
        }));
    }

    /**
     * Fetches 2ndTierLimit data based on a selected department.
     * @param {string} department - The selected department name.
     * @returns {Promise<Array>} An array of records.
     */
    async get2ndTierLimit(department) {
        const baseId = 'Gflaw9RBkiaHAokB4axlHLpygVb'; // Replace with your Base ID
        const tableId = 'tblLSW8oShBhPOZg'; // Replace with your Table ID
        const filters = `CurrentValue.[Department/ProductLine] = "${department}"`;
        const fieldNames = JSON.stringify(["2ndTierLimit"]);

        const records = await this.getRecords(baseId, tableId, filters, fieldNames);

        return records.map(record => ({
            secondTierLimit: record.fields["2ndTierLimit"]
        }));
    }

    /**
     * Fetches CEO data based on a selected department.
     * @param {string} department - The selected department name.
     * @returns {Promise<Array>} An array of records.
     */
    async getCEO(department) {
        const baseId = 'Gflaw9RBkiaHAokB4axlHLpygVb'; // Replace with your Base ID
        const tableId = 'tblLSW8oShBhPOZg'; // Replace with your Table ID
        const filters = `CurrentValue.[Department/ProductLine] = "${department}"`;
        const fieldNames = JSON.stringify(["CEO"]);

        const records = await this.getRecords(baseId, tableId, filters, fieldNames);

        return records.map(record => ({
            ceo: record.fields.CEO
        }));
    }
}

// Instantiate the API client as a singleton
const larkApi = new CWLarkAPI();

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
 * GET route for health checks.
 */
app.get('/', (req, res) => {
    res.status(200).send('Lark API server is running!');
});

/**
 * POST /get_department_product_line
 * Fetches the Department/ProductLine data.
 */
app.post('/get_department_product_line', async (req, res) => {
    try {
        const dataList = await larkApi.getDepartmentProductLine();
        const result = {
            code: 0,
            msg: "success!",
            data: {
                result: {
                    options: dataList.map((d, i) => ({
                        id: `options_id_${i}`,
                        value: d.departmentProductLine,
                        isDefault: false
                    })),
                    hasMore: false,
                    nextPageToken: "xxxx"
                }
            }
        };
        return res.json(result);
    } catch (e) {
        console.error('Error in /get_department_product_line:', e);
        return res.status(500).json({ code: 1, msg: "failed", data: {} });
    }
});

/**
 * POST /get_hod
 * Fetches the HOD data based on a selected department.
 */
app.post('/get_hod', async (req, res) => {
    try {
        const department = req.body.linkage_params?.department;
        if (!department) {
            return res.json({ code: 1, msg: "Parameter error!", data: { result: { options: [] } } });
        }
        const dataList = await larkApi.getHOD(department);
        const result = {
            code: 0,
            msg: "success!",
            data: {
                result: {
                    options: dataList.map((d, i) => ({
                        id: `options_id_${i}`,
                        value: d.hod,
                        isDefault: false
                    })),
                    hasMore: false,
                    nextPageToken: "xxxx"
                }
            }
        };
        return res.json(result);
    } catch (e) {
        console.error('Error in /get_hod:', e);
        return res.status(500).json({ code: 1, msg: "failed", data: {} });
    }
});

/**
 * POST /get_hod_limit
 * Fetches the HODLimit data based on a selected department.
 */
app.post('/get_hod_limit', async (req, res) => {
    try {
        const department = req.body.linkage_params?.department;
        if (!department) {
            return res.json({ code: 1, msg: "Parameter error!", data: { result: { options: [] } } });
        }
        const dataList = await larkApi.getHODLimit(department);
        const result = {
            code: 0,
            msg: "success!",
            data: {
                result: {
                    options: dataList.map((d, i) => ({
                        id: `options_id_${i}`,
                        value: d.hodLimit,
                        isDefault: false
                    })),
                    hasMore: false,
                    nextPageToken: "xxxx"
                }
            }
        };
        return res.json(result);
    } catch (e) {
        console.error('Error in /get_hod_limit:', e);
        return res.status(500).json({ code: 1, msg: "failed", data: {} });
    }
});

/**
 * POST /get_2nd_tier
 * Fetches the 2ndTier data based on a selected department.
 */
app.post('/get_2nd_tier', async (req, res) => {
    try {
        const department = req.body.linkage_params?.department;
        if (!department) {
            return res.json({ code: 1, msg: "Parameter error!", data: { result: { options: [] } } });
        }
        const dataList = await larkApi.get2ndTier(department);
        const result = {
            code: 0,
            msg: "success!",
            data: {
                result: {
                    options: dataList.map((d, i) => ({
                        id: `options_id_${i}`,
                        value: d.secondTier,
                        isDefault: false
                    })),
                    hasMore: false,
                    nextPageToken: "xxxx"
                }
            }
        };
        return res.json(result);
    } catch (e) {
        console.error('Error in /get_2nd_tier:', e);
        return res.status(500).json({ code: 1, msg: "failed", data: {} });
    }
});

/**
 * POST /get_2nd_tier_limit
 * Fetches the 2ndTierLimit data based on a selected department.
 */
app.post('/get_2nd_tier_limit', async (req, res) => {
    try {
        const department = req.body.linkage_params?.department;
        if (!department) {
            return res.json({ code: 1, msg: "Parameter error!", data: { result: { options: [] } } });
        }
        const dataList = await larkApi.get2ndTierLimit(department);
        const result = {
            code: 0,
            msg: "success!",
            data: {
                result: {
                    options: dataList.map((d, i) => ({
                        id: `options_id_${i}`,
                        value: d.secondTierLimit,
                        isDefault: false
                    })),
                    hasMore: false,
                    nextPageToken: "xxxx"
                }
            }
        };
        return res.json(result);
    } catch (e) {
        console.error('Error in /get_2nd_tier_limit:', e);
        return res.status(500).json({ code: 1, msg: "failed", data: {} });
    }
});

/**
 * POST /get_ceo
 * Fetches the CEO data based on a selected department.
 */
app.post('/get_ceo', async (req, res) => {
    try {
        const department = req.body.linkage_params?.department;
        if (!department) {
            return res.json({ code: 1, msg: "Parameter error!", data: { result: { options: [] } } });
        }
        const dataList = await larkApi.getCEO(department);
        const result = {
            code: 0,
            msg: "success!",
            data: {
                result: {
                    options: dataList.map((d, i) => ({
                        id: `options_id_${i}`,
                        value: d.ceo,
                        isDefault: false
                    })),
                    hasMore: false,
                    nextPageToken: "xxxx"
                }
            }
        };
        return res.json(result);
    } catch (e) {
        console.error('Error in /get_ceo:', e);
        return res.status(500).json({ code: 1, msg: "failed", data: {} });
    }
});

// --- Server Start ---
app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
