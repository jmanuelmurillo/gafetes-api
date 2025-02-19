const CryptoJS = require('crypto-js');

const Security = {
    GetEncryptionConfiguration: function () {
        return 'abcdefghijklmnop';
    },
    encryptData: function (msg, pass) {

        if (msg === undefined && !(typeof msg === 'string' || msg instanceof String)) {
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
    },
    decryptData: function (transitmessage, pass) {

        var keySize = 256;
        var ivSize = 128;
        var saltSize = 256;
        var iterations = 1000;

        var hexResult = Security.base64ToHex(transitmessage)

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

        })

        return decrypted.toString(CryptoJS.enc.Utf8);
    },
    hexToBase64: function (str) {
        var strArr = str.replace(/\r|\n/g, "").replace(/([\da-fA-F]{2}) ?/g, "0x$1 ").replace(/ +$/, "").split(" ");
        return btoa(strArr.reduce(function (str, charIndex) {
            return str += String.fromCharCode(charIndex);
        }, ''));
    },
    base64ToHex: function (str) {
        for (var i = 0, bin = atob(str.replace(/[ \r\n]+$/, "")), hex = []; i < bin.length; ++i) {
            var tmp = bin.charCodeAt(i).toString(16);
            if (tmp.length === 1) tmp = "0" + tmp;
            hex[hex.length] = tmp;
        }
        return hex.join("");
    }
}

module.exports = Security;