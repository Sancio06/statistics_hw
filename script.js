// Toy Elliptic Curve parameters: y^2 = x^3 + 7 (mod 17)
const P = 17;
const A = 0;
const G = { x: 1, y: 5 };

// Helper function for Modular Inverse (Extended Euclidean Algorithm)
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

// Point Addition on Elliptic Curve over F_p
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

    return { x: x3, y: y3, slope: s };
}

// Compute sequence 1G, 2G, ..., kG
function computeSequence(k) {
    let steps = [];
    let current = G;
    steps.push({ step: 1, point: G, desc: "Base Point G" });

    for (let i = 2; i <= k; i++) {
        if (current === null) {
            steps.push({ step: i, point: null, desc: "Point at Infinity" });
            current = G;
            continue;
        }
        let next = pointAdd(current, G);
        current = next;
        steps.push({ 
            step: i, 
            point: current, 
            desc: current ? `(${current.x}, ${current.y})` : "Point at Infinity" 
        });
    }
    return steps;
}

// Render Results on Section 3
function runComputation() {
    const kInput = document.getElementById("privateKeyInput");
    const outputBox = document.getElementById("outputBox");
    if (!kInput || !outputBox) return;

    const k = parseInt(kInput.value);
    if (isNaN(k) || k < 1) {
        outputBox.innerHTML = "<p style='color:red;'>Please enter a valid private key k ≥ 1.</p>";
        return;
    }

    const steps = computeSequence(k);
    const finalPoint = steps[steps.length - 1].point;

    let tableHtml = `
        <h3>Step-by-Step Multiplication (1G to ${k}G):</h3>
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px; text-align: left;">
            <thead>
                <tr style="background-color: #e5d8f2; color: #3f225f;">
                    <th style="padding: 8px; border: 1px solid #ccc;">Scalar (m)</th>
                    <th style="padding: 8px; border: 1px solid #ccc;">Point mG</th>
                    <th style="padding: 8px; border: 1px solid #ccc;">Coordinates (x, y)</th>
                </tr>
            </thead>
            <tbody>
    `;

    steps.forEach(s => {
        let coordText = s.point ? `(${s.point.x}, ${s.point.y})` : "O (Infinity)";
        tableHtml += `
            <tr>
                <td style="padding: 8px; border: 1px solid #ddd;">${s.step}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${s.step}G</td>
                <td style="padding: 8px; border: 1px solid #ddd;"><strong>${coordText}</strong></td>
            </tr>
        `;
    });

    tableHtml += `
            </tbody>
        </table>
        
        <div style="margin-top: 20px; padding: 15px; background-color: #f4f0f8; border-left: 4px solid #7b42bc; border-radius: 8px;">
            <h4 style="margin: 0 0 5px 0; color: #3f225f;">Final Result (TOY PUBLIC KEY):</h4>
            <p style="margin: 0; font-size: 1.1rem;">
                Private Key k = ${k} &rarr; <strong>Public Key Q = ${k}G = ${finalPoint ? `(${finalPoint.x},${finalPoint.y})` : 'Infinity'}</strong>
            </p>
        </div>
    `;

    outputBox.innerHTML = tableHtml;
}

// Section 4: Statistical Analysis
function runStatisticalAnalysis() {
    const statsOutput = document.getElementById("statsOutput");
    if (!statsOutput) return;

    let steps = computeSequence(18);
    let xFreq = {}, yFreq = {};
    let bitOnes = [0, 0, 0, 0, 0];

    steps.forEach(s => {
        if (s.point) {
            xFreq[s.point.x] = (xFreq[s.point.x] || 0) + 1;
            yFreq[s.point.y] = (yFreq[s.point.y] || 0) + 1;

            let bin = s.point.x.toString(2).padStart(5, '0');
            for (let b = 0; b < 5; b++) {
                if (bin[b] === '1') bitOnes[b]++;
            }
        }
    });

    let html = `
        <div style="background: #fafafa; padding: 15px; border-radius: 8px; border: 1px solid #e5d8f2; margin-bottom: 15px;">
            <h4 style="color: #3f225f; margin-top: 0;">Summary Statistics ($k \\in [1, 18]$)</h4>
            <p><strong>Unique X Coordinates Observed:</strong> ${Object.keys(xFreq).join(", ")}</p>
            <p><strong>Bit Frequency of X Coordinates (1s per position):</strong> [ ${bitOnes.join(" , ")} ]</p>
        </div>
    `;

    statsOutput.innerHTML = html;

    // Reprocess MathJax if loaded
    if (window.MathJax && window.MathJax.typeset) {
        window.MathJax.typeset();
    }
}

// Initializing Event Listeners
document.addEventListener("DOMContentLoaded", () => {
    runComputation();

    const calcBtn = document.getElementById("calcBtn");
    if (calcBtn) {
        calcBtn.addEventListener("click", runComputation);
    }

    const analyzeBtn = document.getElementById("analyzeBtn");
    if (analyzeBtn) {
        analyzeBtn.addEventListener("click", runStatisticalAnalysis);
    }
});
    if (analyzeBtn) {
        analyzeBtn.addEventListener("click", runStatisticalAnalysis);
    }
});
