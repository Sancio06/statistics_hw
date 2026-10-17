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
        return null;
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

function computeSequence(k) {
    let steps = [];
    let current = G;
    steps.push({ step: 1, point: G });

    for (let i = 2; i <= k; i++) {
        if (current === null) {
            steps.push({ step: i, point: null });
            current = G;
            continue;
        }
        let next = pointAdd(current, G);
        current = next;
        steps.push({ step: i, point: current });
    }
    return steps;
}

// ==========================================
// HOMEWORK 2 INTERACTIVE FUNCTIONS
// ==========================================
function runEccDemo() {
    const msg = parseInt(document.getElementById("eccMessage").value);
    const privKey = parseInt(document.getElementById("eccPrivKey").value);
    const out = document.getElementById("eccOutput");
    if (!out) return;

    let seq = computeSequence(privKey);
    let pubKey = seq[seq.length - 1].point;

    let r = 3;
    let rG = computeSequence(r)[r - 1].point;
    let rQ = computeSequence((r * privKey) % 18)[((r * privKey) % 18) - 1].point;

    let mask = rQ ? rQ.x : 1;
    let cipher = (msg * mask) % P;
    let decrypted = (cipher * modInverse(mask, P)) % P;

    out.innerHTML = `
        <div style="background: #f4f0f8; padding: 12px; border-radius: 6px; border-left: 4px solid #7b42bc;">
            <p><strong>Public Key Q_B:</strong> ${pubKey ? `(${pubKey.x},${pubKey.y})` : 'Infinity'}</p>
            <p><strong>Ciphertext:</strong> C1 = (${rG.x}, ${rG.y}), C2 = ${cipher}</p>
            <p><strong>Decrypted Message:</strong> m = ${decrypted} (Original: ${msg})</p>
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
        <div style="background: #f4f0f8; padding: 12px; border-radius: 6px; border-left: 4px solid #7b42bc;">
            <p><strong>Plaintext:</strong> ${text}</p>
            <p><strong>Ciphertext (Shift +${shift}):</strong> ${cipher}</p>
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
        <div style="background: #f4f0f8; padding: 12px; border-radius: 6px; border-left: 4px solid #7b42bc;">
            <p><strong>Recovered Key Shift (K):</strong> ${bestShift} (Chi-square score: ${minChi2.toFixed(2)})</p>
            <p><strong>Decrypted Plaintext:</strong> ${recoveredText}</p>
        </div>
    `;
}

function runAttackEcc() {
    const targetX = parseInt(document.getElementById("targetX").value);
    const targetY = parseInt(document.getElementById("targetY").value);
    const out = document.getElementById("attackEccOutput");
    if (!out) return;

    let foundK = null;
    let steps = computeSequence(18);

    for (let i = 0; i < steps.length; i++) {
        if (steps[i].point && steps[i].point.x === targetX && steps[i].point.y === targetY) {
            foundK = steps[i].step;
            break;
        }
    }

    out.innerHTML = `
        <div style="background: #f4f0f8; padding: 12px; border-radius: 6px; border-left: 4px solid #7b42bc;">
            ${foundK ? `<p style="color:green; font-weight:bold;">Private Key Recovered! k = ${foundK}</p><p>Exhaustive Search Operations:${foundK} curve additions.</p>` : `<p style="color:red;">Point not found on curve subgroup.</p>`}
        </div>
    `;
}

function initApp2() {
    const eccBtn = document.getElementById("eccEncryptBtn");
    if (eccBtn) eccBtn.addEventListener("click", runEccDemo);

    const caesarBtn = document.getElementById("caesarRunBtn");
    if (caesarBtn) caesarBtn.addEventListener("click", runCaesarDemo);

    const breakCaesarBtn = document.getElementById("breakCaesarBtn");
    if (breakCaesarBtn) breakCaesarBtn.addEventListener("click", runBreakCaesar);

    const attackEccBtn = document.getElementById("attackEccBtn");
    if (attackEccBtn) attackEccBtn.addEventListener("click", runAttackEcc);
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initApp2);
} else {
    initApp2();
}
