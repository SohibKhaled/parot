const axios = require('axios');
const crypto = require('crypto');
require("dotenv").config();

const API_KEY = process.env.BINANCE_API;
const API_SECRET = process.env.BINANCE_SECRET;

const BASE_URL = 'https://bpay.binanceapi.com';

function generateSignature(queryString, secret) {
    return crypto.createHmac('sha512', secret).update(queryString).digest('hex');
  }
  
  function generateNonce() {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }
  
  async function createOrder(params) {
    const timestamp = Date.now();
    const nonce = generateNonce();
    const queryString = `merchantTradeNo=${params.merchantTradeNo}&totalFee=${params.totalFee}&currency=${params.currency}&productDetail=${params.productDetail}&productName=${params.productName}&timestamp=${timestamp}&nonce=${nonce}`;
    const signature = generateSignature(queryString, API_SECRET);
  
    const headers = {
      'Content-Type': 'application/json',
      'BinancePay-Timestamp': timestamp,
      'BinancePay-Nonce': nonce,
      'BinancePay-Certificate-SN': API_KEY,
      'BinancePay-Signature': signature,
    };
  
    try {
      const response = await axios.post(`${BASE_URL}/binancepay/openapi/order`, params, { headers });
      return response.data;
    } catch (error) {
      console.error('Error creating order:', error.response.data);
      throw error;
    }
  }
  
  module.exports = {
    createOrder,
  };