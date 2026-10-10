// Parameters for Toy Curve: y^2 = x^3 + 7 (mod 17)
const P = 17;
const A = 0;
const G = { x: 1, y: 5 };

// Extended Euclidean Algorithm for Modular Inverse
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

// Elliptic Curve Point Addition over F_p
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

// Function for Section 3: Compute Public Key
function runComputation() {
    const kInput = document.getElementById("privateKeyInput");
    const outputBox = document.getElementById("outputBox");
    if (!kInput || !outputBox) return;

    const k = parseInt(kInput.value);
    if (isNaN(k) || k < 1) {
        outputBox.innerHTML = "<p style='color:red;'>Please enter a valid key k ≥ 1.</p>";
        return;
    }

    const steps = computeSequence(k);
    const finalPoint = steps[steps.length - 1].point;

    let tableHtml = `
        <h3 style="color:#3f225f; margin-bottom:10px;">Multiplication Sequence (1G to ${k}G):</h3>
        <table style="width: 100%; border-collapse: collapse; text-align: left;">
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
        let coordText = s.point ? `(${s.point.x}, ${s.point.y})` : "Infinity (Point at Infinity)";
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
        
        <div style="margin-top: 15px; padding: 12px 15px; background-color: #f4f0f8; border-left: 4px solid #7b42bc; border-radius: 6px;">
            <p style="margin: 0; font-size: 1.05rem;">
                <strong>Private Key (k):</strong> ${k} &nbsp;|&nbsp; 
                <strong>Toy Public Key Q = ${k}G:</strong> ${finalPoint ? `(${finalPoint.x},${finalPoint.y})` : 'Infinity'}
            </p>
        </div>
    `;

    outputBox.innerHTML = tableHtml;
}

// Function for Section 4: Statistical Analysis
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
        <div style="background: #fafafa; padding: 15px; border-radius: 8px; border: 1px solid #e5d8f2;">
            <h4 style="color: #3f225f; margin-top: 0;">Summary Statistics for k = 1 to 18</h4>
            <p style="margin: 5px 0;"><strong>Observed X Coordinates:</strong> ${Object.keys(xFreq).join(", ")}</p>
            <p style="margin: 5px 0;"><strong>Observed Y Coordinates:</strong> ${Object.keys(yFreq).join(", ")}</p>
            <p style="margin: 5px 0;"><strong>X Coordinate Bit Frequencies (Position 1 to 5):</strong> [ ${bitOnes.join(", ")} ]</p>
        </div>
    `;

    statsOutput.innerHTML = html;
}

// Attach Event Listeners on Page Load
window.onload = function() {
    runComputation();

    const calcBtn = document.getElementById("calcBtn");
    if (calcBtn) {
        calcBtn.onclick = runComputation;
    }

    const analyzeBtn = document.getElementById("analyzeBtn");
    if (analyzeBtn) {
        analyzeBtn.onclick = runStatisticalAnalysis;
    }
};
    if (analyzeBtn) {
        analyzeBtn.addEventListener("click", runStatisticalAnalysis);
    }
});
