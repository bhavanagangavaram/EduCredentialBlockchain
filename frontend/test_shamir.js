const secrets = require('secrets.js-grempe');
const JSEncrypt = require('jsencrypt');

const STATIC_PRIVATE_KEY = `-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEAmJOxUVAoeVxdjWHvA2EWVpW7lZ8Oq+qG9Yod37xpU39BURB2
C9L5WzOo/KrUFuO/4My03avQ2TvAmnQ9zWLtFa9HKb38AKTRmconsaQhdAQsgcmE
H8QwDneR7MXxO7x29+a29uDlaRF3K+HVjydjdA7vC6I6rfZimD34Q8+7AKMmIqTI
ebgiBBYTftTYu5bMHEydavk206K9gnGhuuD9tTPKPOt47RkbdFZ33Acu3doZ/IGx
lB1o8ZMhnm1qMiH/JM3rxwo1BkYZ69sfeMsFnYlU2+xDGJTP37YiPNDXj/UVo8xP
kOadP9W/Ph6kobtHDMFGrNB02y2tKCL8xoq7DwIDAQABAoIBACI5HpDKlgmCukk4
KlBruoL5WvYYk0XkeRkiPcktjcJ4zMHOG2xTijL2x3TFLIVl2GgoAnmmTFYtnOoI
IMSs59jxU9j9EEVkss74FSc3VXmcZg9GkCg/7TeRgl3FmHJ5t4Wrbma50ztZ+40Q
PsK5ZwllQCEv5lGW7k6Pt9weACgIFoxMxu1NcJUnBE72gnWcSoLfltUxLmoW032Z
X+OgavfhKYgN4BLIQhD8iMjNjJ4W1cELz69Mu8VcSIsoF0J+/sFxdRusRRyS6J2c
8mAYLclznSpgahqBlbHQfRaAfZMOB6skCe29aZ8fblaqy72/MLlmWnUzZgGdu5Kk
lGlVY6ECgYEA5vgEHXZAtkCjP6WOHp16EFcvRCZU/cTbrDq5dGkijAY6ImDzH25U
n/rw1qdIXlQxzDcy9g5XAMAvwRUrRmUOfFoljyj/ix3AZ5j/vA5oF9Y2SNNBg/xR
G4U2HnTjy7RlvZSOp8KcuSXhCPBU7y5gpP3iw52vDBqoShCT2sI1QqsCgYEAqRzG
7Lx6CQKjE42Tm1Nsfe0zv90OmbBMFx/KDb73Gh2pl4mkehWlHt/kGec+MqAHHRSf
dJ/SDm8+xcL+zmw1sS1uf+pLkrJlbGBGLVdk/GD4PBCC0rQg3v7t0V1jd31002gh
xd4uvBt4WAR8af/gaBc+k0wwm91dYbE54ruCCS0CgYEA3SddyVgRXnFF3wuGqYnf
9wWEHJ0XhGWaca9JJE4G5kyQHZr3MIFURlrhgKdsg+XaSNAR28ifRfi/wQGkDiN1
W1x12j5Hcc1rDcdSF58zzJ8wG0ss0FQo1VEYINGLzOFPCdfVQIz3w9ChSQ3WRa8C
mvj+yI+TrONZgJGfATg0B0ECgYBisBVyL6czvOM31OXvveZRMmyBqdoMXDJ7SCTc
krWW+vpuIXfnetwqQVPWvfixCGw+TzuijmXB4K+MLvgNtF488BtM8Ih7qjm/3gr2
CMs48MnMG4KMvWt1VuWnyUzzfTYA7QLQepFhWtKG4s9L+HOXqwDsaojvXGZTTV5P
b0c6XQKBgQCYeoKfLnSuwgpTgmazBZQvzfNwL5pzn/AeryxFh1wCnCAexY8jKrxV
wr4LnxflbqtzHpqVwX/Hx6d30SQIuQNHE8YrMThbF2mRw7JdmYu5sFrY1jAq0HvM
bsBxgLawxZX8Lw/i+Z1fgV1rAmZBG8WbbBUwnvdmwWCagDjuM8Br9Q==
-----END RSA PRIVATE KEY-----`;

try {
    const hexPrivateKey = secrets.str2hex(STATIC_PRIVATE_KEY);
    const shares = secrets.share(hexPrivateKey, 5, 3);
    console.log("Shares generated:", shares.length);
    
    // Simulate user input
    const validShares = [shares[0], shares[1], shares[2]];
    
    // Check if lengths match and if there's any whitespace issue
    const cleanShares = validShares.map(s => s.trim());
    
    const combinedHex = secrets.combine(cleanShares);
    const reconstructedPrivateKey = secrets.hex2str(combinedHex);
    
    if (reconstructedPrivateKey === STATIC_PRIVATE_KEY) {
        console.log("Reconstruction successful!");
    } else {
        console.log("Reconstruction failed, strings don't match.");
        console.log("Original length:", STATIC_PRIVATE_KEY.length);
        console.log("Reconstructed length:", reconstructedPrivateKey.length);
    }
} catch (e) {
    console.error("Error:", e);
}
