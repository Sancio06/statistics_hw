// ==========================================
// TOY ECC ARITHMETIC (y^2 = x^3 + 7 mod 17)
// ==========================================
const P = 17;
const A = 0;
const G = { x: 1, y: 5 };

function modInverse(a, m) {
    let m0 = m;
    let y = 0, x = 1;
    if (m === 1) return 0;
    a = ((a % m) + m) % m;
    while (a > 1) {
        let q = Math.floor(a / m);
        let t = m;
        m = a % m;
        a = t;
        t = y;
        y = x - q * y;
        x = t;
    }
    if (x < 0) x += m0;
    return x;
}

function pointAdd(P1, P2) {
    if (P1 === null) return P2;
    if (P2 === null) return P1;

    let s;
    if (P1.x === P2.x && P1.y === P2.y) {
        let num = (3 * P1.x * P1.x + A) % P;
        let den = (2 * P1.y) % P;
        if (den === 0) return null;
        s = (num * modInverse(den, P)) % P;
    } else if (P1.x === P2.x) {
        return null; // Point at Infinity
    } else {
        let num = (P2.y - P1.y) % P;
        let den = (P2.x - P1.x) % P;
        s = (num * modInverse(den, P)) % P;
    }

    let x3 = (s * s - P1.x - P2.x) % P;
    x3 = ((x3 % P) + P) % P;

    let y3 = (s * (P1.x - x3) - P1.y) % P;
    y3 = ((y3 % P) + P) % P;

    return { x: x3, y: y3 };
}

function multiplyPoint(k) {
    if (k <= 0) return null;
    let current = G;
    for (let i = 1; i < k; i++) {
        current = pointAdd(current, G);
        if (current === null) break;
    }
    return current;
}

function scalarMultiply(k, Pt) {
    if (k <= 0 || Pt === null) return null;
    let current = Pt;
    for (let i = 1; i < k; i++) {
        current = pointAdd(current, Pt);
        if (current === null) break;
    }
    return current;
}

// ==========================================
// HOMEWORK 2 INTERACTIVE FUNCTIONS
// ==========================================
function runEccDemo() {
    const msgInput = document.getElementById("eccMessage");
    const privInput = document.getElementById("eccPrivKey");
    const out = document.getElementById("eccOutput");
    if (!msgInput || !privInput || !out) return;

    const msg = parseInt(msgInput.value);
    const privKey = parseInt(privInput.value);

    if (isNaN(msg) || isNaN(privKey) || msg < 1 || msg >= P || privKey < 1) {
        out.innerHTML = "<p style='color:red;'>Please enter a valid message m ∈ [1, 16] and key k ≥ 1.</p>";
        return;
    }

    let pubKey = multiplyPoint(privKey);
    let r = 3;
    let C1 = multiplyPoint(r);
    let sharedPoint = scalarMultiply(r, pubKey);

    let mask = (sharedPoint && sharedPoint.x !== 0) ? sharedPoint.x : 1;
    let cipher = (msg * mask) % P;
    let decrypted = (cipher * modInverse(mask, P)) % P;

    out.innerHTML = `
        <div style="background: #f4f0f8; padding: 12px; border-radius: 6px; border-left: 4px solid #7b42bc; margin-top: 10px;">
            <p style="margin: 4px 0;"><strong>Recipient Public Key Q<sub>B</sub>:</strong> ${pubKey ? `(${pubKey.x},${pubKey.y})` : 'O (Point at Infinity)'}</p>
            <p style="margin: 4px 0;"><strong>Ciphertext C<sub>1</sub> (rG):</strong> ${C1 ? `(${C1.x},${C1.y})` : 'O'}, <strong>C<sub>2</sub>:</strong> ${cipher}</p>
            <p style="margin: 4px 0;"><strong>Shared Secret Point (rQ<sub>B</sub>):</strong> ${sharedPoint ? `(${sharedPoint.x},${sharedPoint.y})` : 'O'} &rarr; Mask x-coord = ${mask}</p>
            <p style="margin: 4px 0; font-size: 1.05rem; color: #3f225f;"><strong>Decrypted Message:</strong> m = ${decrypted} (Original Message: ${msg})</p>
        </div>
    `;
}

function runCaesarDemo() {
    const text = document.getElementById("caesarText").value.toUpperCase();
    const shift = parseInt(document.getElementById("caesarShift").value);
    const out = document.getElementById("caesarOutput");
    if (!out) return;

    let cipher = "";
    for (let i = 0; i < text.length; i++) {
        let code = text.charCodeAt(i);
        if (code >= 65 && code <= 90) {
            cipher += String.fromCharCode(((code - 65 + shift) % 26) + 65);
        } else {
            cipher += text[i];
        }
    }

    out.innerHTML = `
        <div style="background: #f4f0f8; padding: 12px; border-radius: 6px; border-left: 4px solid #7b42bc; margin-top: 10px;">
            <p style="margin: 4px 0;"><strong>Plaintext:</strong> ${text}</p>
            <p style="margin: 4px 0;"><strong>Ciphertext (Shift +${shift}):</strong> ${cipher}</p>
        </div>
    `;
}

function runBreakCaesar() {
    const cipherText = document.getElementById("cipherInput").value.toUpperCase();
    const out = document.getElementById("breakCaesarOutput");
    if (!out) return;

    const englishFreq = [8.17, 1.49, 2.78, 4.25, 12.70, 2.22, 2.01, 6.09, 6.97, 0.15, 0.77, 4.03, 2.41, 6.75, 7.51, 1.93, 0.09, 5.98, 6.32, 9.05, 2.75, 0.98, 2.36, 0.15, 1.97, 0.07];

    let bestShift = 0;
    let minChi2 = Infinity;

    for (let s = 0; s < 26; s++) {
        let counts = new Array(26).fill(0);
        let total = 0;

        for (let i = 0; i < cipherText.length; i++) {
            let code = cipherText.charCodeAt(i);
            if (code >= 65 && code <= 90) {
                let dec = (code - 65 - s + 26) % 26;
                counts[dec]++;
                total++;
            }
        }

        let chi2 = 0;
        for (let j = 0; j < 26; j++) {
            let expected = (englishFreq[j] / 100) * total;
            if (expected > 0) {
                chi2 += Math.pow(counts[j] - expected, 2) / expected;
            }
        }

        if (chi2 < minChi2) {
            minChi2 = chi2;
            bestShift = s;
        }
    }

    let recoveredText = "";
    for (let i = 0; i < cipherText.length; i++) {
        let code = cipherText.charCodeAt(i);
        if (code >= 65 && code <= 90) {
            recoveredText += String.fromCharCode(((code - 65 - bestShift + 26) % 26) + 65);
        } else {
            recoveredText += cipherText[i];
        }
    }

    out.innerHTML = `
        <div style="background: #f4f0f8; padding: 12px; border-radius: 6px; border-left: 4px solid #7b42bc; margin-top: 10px;">
            <p style="margin: 4px 0;"><strong>Recovered Shift Key (K):</strong> ${bestShift} (Chi-square score: ${minChi2.toFixed(2)})</p>
            <p style="margin: 4px 0;"><strong>Decrypted Plaintext:</strong> ${recoveredText}</p>
        </div>
    `;
}

function runAttackEcc() {
    const targetX = parseInt(document.getElementById("targetX").value);
    const targetY = parseInt(document.getElementById("targetY").value);
    const out = document.getElementById("attackEccOutput");
    if (!out) return;

    let foundK = null;

    for (let k = 1; k <= 8; k++) {
        let pt = multiplyPoint(k);
        if (pt && pt.x === targetX && pt.y === targetY) {
            foundK = k;
            break;
        }
    }

    out.innerHTML = `
        <div style="background: #f4f0f8; padding: 12px; border-radius: 6px; border-left: 4px solid #7b42bc; margin-top: 10px;">
            ${foundK ? `<p style="color:green; font-weight:bold; margin: 4px 0;">Private Key Recovered! k = ${foundK}</p><p style="margin: 4px 0;">Exhaustive Search Cost: ${foundK} curve point additions.</p>` : `<p style="color:red; margin: 4px 0;">Point (${targetX},${targetY}) is not in the subgroup generated by G=(1,5).</p><p style="margin: 4px 0; font-size: 0.85rem; color: #555;">Valid subgroup points: (1,5), (2,10), (5,9), (12,1), (12,16), (5,8), (2,7), (1,12).</p>`}
        </div>
    `;
}
