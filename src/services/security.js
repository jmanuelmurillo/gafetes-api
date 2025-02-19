const CryptoJS = require('crypto-js');

const Security = {
    getEncryptionConfiguration: function () {
        return 'abcdefghijklmnop';
    },
    encryptData: function (msg, pass) {
        try {
            if (msg === undefined || !(typeof msg === 'string' || msg instanceof String)) {
                return msg;
            }

            var keySize = 256;
            var ivSize = 128;
            var saltSize = 256;
            var iterations = 1000;

            var salt = CryptoJS.lib.WordArray.random(saltSize / 8);

            var key = CryptoJS.PBKDF2(pass, salt, {
                keySize: keySize / 32,
                iterations: iterations
            });

            var iv = CryptoJS.lib.WordArray.random(ivSize / 8);

            var encrypted = CryptoJS.AES.encrypt(msg, key, {
                iv: iv,
                padding: CryptoJS.pad.Pkcs7,
                mode: CryptoJS.mode.CBC
            });

            var encryptedHex = Security.base64ToHex(encrypted.toString());
            var base64result = Security.hexToBase64(salt + iv + encryptedHex);

            return base64result;
        } catch (error) {
            console.error('Error in encryptData:', error);
            throw new Error('Encryption failed');
        }
    },
    decryptData: function (transitmessage, pass) {
        try {
            var keySize = 256;
            var iterations = 1000;

            var hexResult = Security.base64ToHex(transitmessage);

            var salt = CryptoJS.enc.Hex.parse(hexResult.substr(0, 64));
            var iv = CryptoJS.enc.Hex.parse(hexResult.substr(64, 32));
            var encrypted = Security.hexToBase64(hexResult.substring(96));

            var key = CryptoJS.PBKDF2(pass, salt, {
                keySize: keySize / 32,
                iterations: iterations
            });

            var decrypted = CryptoJS.AES.decrypt(encrypted, key, {
                iv: iv,
                padding: CryptoJS.pad.Pkcs7,
                mode: CryptoJS.mode.CBC
            });

            return decrypted.toString(CryptoJS.enc.Utf8);
        } catch (error) {
            console.error('Error in decryptData:', error);
            throw new Error('Decryption failed');
        }
    },
    hexToBase64: function (str) {
        try {
            return Buffer.from(str, 'hex').toString('base64');
        } catch (error) {
            console.error('Error in hexToBase64:', error);
            throw new Error('Conversion from hex to base64 failed');
        }
    },
    base64ToHex: function (str) {
        try {
            return Buffer.from(str, 'base64').toString('hex');
        } catch (error) {
            console.error('Error in base64ToHex:', error);
            throw new Error('Conversion from base64 to hex failed');
        }
    }
}

module.exports = Security;