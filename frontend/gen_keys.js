const crypto = require('crypto');

const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
    },
    privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem'
    }
});

const fs = require('fs');
fs.writeFileSync('pub.txt', publicKey);
fs.writeFileSync('priv.txt', privateKey);
console.log('Keys written to pub.txt and priv.txt');

