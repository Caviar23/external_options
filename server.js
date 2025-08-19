// server.js
const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');

// The port for the server to listen on. Vercel/Render will assign a port,
// but for local testing, we'll use 3000.
const port = process.env.PORT || 3000;

// The secret key and token for encryption and request validation.
// In a real application, these should be environment variables.
// The key must be 32 bytes for AES-256.
const API_TOKEN = process.env.API_TOKEN; // Use environment variable
const API_KEY = process.env.API_KEY;   // Use environment variable

const app = express();
app.use(bodyParser.json());

/**
 * Node.js implementation of the Golang CBCEncrypter logic.
 * Encrypts data using AES-256-CBC with a SHA-256 hashed key.
 *
 * @param {string} source - The plaintext string to encrypt.
 * @param {string} keyStr - The encryption key string.
 * @returns {string} The Base64-encoded encrypted data.
 */
function encryptLarkData(source, keyStr) {
  try {
    // 1. Hash the key with SHA-256 as per the Golang example
    const key = crypto.createHash('sha256').update(keyStr).digest();

    // 2. Create a random IV for security and prepend it to the ciphertext.
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);

    let encrypted = cipher.update(source, 'utf8');
    encrypted = Buffer.concat([encrypted, cipher.final()]);

    // Prepend the IV to the encrypted data for decryption later
    const finalData = Buffer.concat([iv, encrypted]);

    // Return Base64-encoded string
    return finalData.toString('base64');
  } catch (error) {
    console.error('Encryption failed:', error);
    return null;
  }
}

/**
 * This is the main API endpoint for Lark to request external data.
 * It's a POST request as specified in the documentation.
 */
app.post('/', (req, res) => {
  const { user_id, employee_id, token, linkage_params } = req.body;

  console.log(`Received request from user_id: ${user_id}, employee_id: ${employee_id}`);

  // 1. Token validation
  if (!API_TOKEN || token !== API_TOKEN) {
    console.error('Token validation failed.');
    return res.status(401).json({
      code: 1, // Non-zero code for failure
      msg: 'Invalid token'
    });
  }

  // 2. Generate a sample data payload to return
  let options = [];

  // The documentation says to return all options if linkage_params is empty.
  // We'll simulate that by returning a full list when no params are provided.
  if (!linkage_params || Object.keys(linkage_params).length === 0) {
    options = [
      { id: 'customer_1', value: 'Customer A', isDefault: true },
      { id: 'customer_2', value: 'Customer B', isDefault: false },
      { id: 'customer_3', value: 'Customer C', isDefault: false },
    ];
  } else {
    // If linkage_params exist, you would use them to filter your data source.
    // For this example, we'll just return a filtered list based on a mock condition.
    const linkedValue = linkage_params.linked_field_code; // Replace with your actual linked field name
    if (linkedValue === 'filter_a') {
      options = [
        { id: 'customer_1', value: 'Customer A', isDefault: true },
      ];
    } else {
      options = [
        { id: 'customer_2', value: 'Customer B', isDefault: false },
        { id: 'customer_3', value: 'Customer C', isDefault: false },
      ];
    }
  }

  // 3. Construct the response payload
  const resultPayload = {
    result: {
      options: options,
      i18nResources: [
        {
          locale: 'en_us',
          isDefault: true,
          texts: {
            'Customer A': 'Customer A',
            'Customer B': 'Customer B',
            'Customer C': 'Customer C'
          }
        },
        {
          locale: 'zh_cn',
          isDefault: false,
          texts: {
            'Customer A': '客户A',
            'Customer B': '客户B',
            'Customer C': '客户C'
          }
        },
      ]
    }
  };

  // Convert payload to a JSON string for encryption
  const plaintext = JSON.stringify(resultPayload);

  // Encrypt the result
  const encryptedResult = encryptLarkData(plaintext, API_KEY);

  if (encryptedResult) {
    // 4. Send the encrypted response
    res.json({
      code: 0,
      msg: 'success!',
      data: {
        result: encryptedResult
      }
    });
  } else {
    // Handle encryption failure
    res.status(500).json({
      code: 1,
      msg: 'Encryption failed.',
      data: {}
    });
  }
});

// A simple GET route for Vercel's health check and browser testing
app.get('/', (req, res) => {
  res.send('Lark API server is running!');
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
