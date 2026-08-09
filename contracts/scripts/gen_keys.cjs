const NodeRSA = require('node-rsa');
const fs = require('fs');

const key = new NodeRSA({ b: 2048 });
const publicKey = key.exportKey('pkcs1-public-pem');
const privateKey = key.exportKey('pkcs1-private-pem');

console.log("=== PUBLIC KEY ===");
console.log(publicKey);
console.log("=== PRIVATE KEY ===");
console.log(privateKey);
