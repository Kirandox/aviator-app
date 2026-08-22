
// Dynamically derive top winners from live betters and current crash multiplier
function updateTopWinnersFromLive(liveBettersList, currentCrashMultiplier) {
    if (!Array.isArray(liveBettersList) || liveBettersList.length === 0) return [];
    
    // Shuffle or sort live betters to pick top 3
    const copied = [...liveBettersList].sort(() => 0.5 - Math.random());
    const selected = copied.slice(0, 3);
    
    return selected.map(better => {
        // Extract base amount from better
        let rawAmount = 100;
        if (better.amount) {
            rawAmount = parseInt(better.amount.toString().replace(/[^0-9]/g, "")) || 100;
        }
        // Calculate payout using the actual crash multiplier
        const multNum = parseFloat(currentCrashMultiplier) || 1.5;
        const payout = Math.floor(rawAmount * multNum);
        
        return {
            username: better.username || better.name || "Player",
            amount: "₹" + payout.toLocaleString(),
            multiplier: multNum.toFixed(2) + "x"
        };
    });
}


// Dynamic Winners Shuffler per round
function shuffleWinners(list) {
    if (!Array.isArray(list)) return [];
    return list.map(item => ({
        ...item,
        amount: "₹" + (Math.floor(Math.random() * 350 + 40) * 10).toLocaleString(),
        multiplier: (Math.random() * 2 + 1.1).toFixed(2) + "x"
    })).sort(() => Math.random() - 0.5);
}


// Dynamic Top Winners rotation after each round
function getDynamicWinners() {
    const sampleNames = ["Sameer_07826", "Karan_Star592", "Riya_Rox818", "Sameer_Mahi17", "Riya_9988", "Rudra_Hacker12", "Diya_Fast183", "Aditya_007797", "Aarav_King", "Neha_Pro"];
    // Shuffle and pick 4-5 random winners with random amounts
    const shuffled = sampleNames.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 5).map(name => ({
        username: name,
        amount: "₹" + (Math.floor(Math.random() * 400 + 50) * 10).toLocaleString()
    }));
}

const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3002;
const DB_FILE = path.join(__dirname, 'database.json');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Global Server Game State with support for admin queued custom crash script
let globalGameState = {
    status: 'waiting', // 'waiting', 'flying', 'crashed'
    multiplier: 1.00,
    crashAt: 2.00,
    countdownTimer: 30, // strict 30 second wait time
    flightProgress: 0,
    flightStartTime: 0,
    flightDuration: 12000,
    crashHistory: [1.45, 1.12, 3.80, 2.05],
    customScriptQueue: [] // Admin queue of multipliers (e.g. [1.00, 1.00, 3.00, 5.00])
};

// Background Non-Stop Game Loop

    // Live update top winners every round
    if (typeof shuffleWinners === 'function' && typeof topWinners !== 'undefined') {
        topWinners = shuffleWinners(topWinners);
    }

setInterval(() => {
    if (globalGameState.status === 'waiting') {
        globalGameState.countdownTimer--;
        if (globalGameState.countdownTimer <= 0) {
            globalGameState.status = 'flying';
            globalGameState.multiplier = 1.00;
            globalGameState.flightProgress = 0;
            globalGameState.flightStartTime = Date.now();

            // Check if Admin has queued up custom scripted crash multipliers
            if (globalGameState.customScriptQueue && globalGameState.customScriptQueue.length > 0) {
                globalGameState.crashAt = parseFloat(globalGameState.customScriptQueue.shift());
            } else {
                // Default random crash point between 1.15x and 4.50x
                globalGameState.crashAt = parseFloat((Math.random() * 3.35 + 1.15).toFixed(2));
            }

            globalGameState.flightDuration = Math.max(globalGameState.crashAt * 3500, 7000);
        }
    } else if (globalGameState.status === 'flying') {
        const elapsed = Date.now() - globalGameState.flightStartTime;
        const progressRatio = Math.min(elapsed / globalGameState.flightDuration, 1.0);
        
        globalGameState.flightProgress = progressRatio * 90;
        
        const calculatedMult = 1.00 + (globalGameState.crashAt - 1.00) * Math.pow(progressRatio, 1.4);
        globalGameState.multiplier = parseFloat(Math.min(calculatedMult, globalGameState.crashAt).toFixed(2));

        if (elapsed >= globalGameState.flightDuration || globalGameState.multiplier >= globalGameState.crashAt) {
            globalGameState.status = 'crashed';
            globalGameState.multiplier = globalGameState.crashAt;
            globalGameState.flightProgress = 90;
            
            globalGameState.crashHistory.unshift(globalGameState.multiplier);
            if (globalGameState.crashHistory.length > 15) {
                globalGameState.crashHistory.pop();
            }

            setTimeout(() => {
                if (globalGameState.status === 'crashed') {
                    globalGameState.status = 'waiting'; if (typeof shuffleWinners === 'function' && typeof topWinners !== 'undefined') topWinners = shuffleWinners(topWinners);;
                    globalGameState.countdownTimer = 30;
                }
            }, 4000);
        }
    }
}, 1000);

function getDB() {
    if (!fs.existsSync(DB_FILE)) {
        const initialData = {
            settings: {
                bankName: "HDFC BANK",
                accountName: "SKY ROCKET ENTERPRISES",
                accountNumber: "50200012345678",
                ifscCode: "HDFC0001234"
            },
            users: {
                "+910986677098": { 
                    phone: "+910986677098", 
                    password: "Lepli0098", 
                    balance: 100000, 
                    isAdmin: true, 
                    username: "Admin", 
                    notifications: [
                        { id: 1, text: "🛡️ Admin Account Initialized.", time: "12:00 PM" }
                    ], 
                    history: [] 
                }
            },
            deposits: [],
            withdrawals: []
        };
        fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
    }
    const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    
    if (!data.users["+910986677098"]) {
        data.users["+910986677098"] = {
            phone: "+910986677098",
            password: "Lepli0098",
            balance: 100000,
            isAdmin: true,
            username: "Admin",
            notifications: [{ id: 1, text: "🛡️ Admin Account Initialized.", time: "12:00 PM" }],
            history: []
        };
        fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
    }

    if (!data.settings) {
        data.settings = {
            bankName: "HDFC BANK",
            accountName: "SKY ROCKET ENTERPRISES",
            accountNumber: "50200012345678",
            ifscCode: "HDFC0001234"
        };
    }
    return data;
}

function saveDB(data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// Root route: Login Page
app.get('/', (req, res) => {
    res.send(renderLoginPage());
});

app.post('/login', (req, res) => {
    const { phone, password } = req.body;
    const db = getDB();
    if (db.users[phone] && db.users[phone].password === password) {
        if (db.users[phone].isAdmin) {
            res.redirect(`/admin?phone=${encodeURIComponent(phone)}`);
        } else {
            res.redirect(`/game?phone=${encodeURIComponent(phone)}`);
        }
    } else {
        res.send(`<script>alert('Invalid phone or password!'); window.location.href='/';</script>`);
    }
});

app.post('/register', (req, res) => {
    const { username, phone, password } = req.body;
    const db = getDB();
    if (db.users[phone]) {
        return res.send(`<script>alert('Account already exists! Please login.'); window.location.href='/';</script>`);
    }

    db.users[phone] = {
        phone,
        password,
        username: username.trim(),
        balance: 100.00,
        isAdmin: false,
        notifications: [
            { id: Date.now(), text: "🎉 Welcome! You received a ₹100 sign up bonus.", time: new Date().toLocaleTimeString() }
        ],
        history: []
    };
    saveDB(db);
    res.redirect(`/game?phone=${encodeURIComponent(phone)}`);
});

// Dedicated Admin Panel Route
app.get('/admin', (req, res) => {
    const phone = req.query.phone;
    const db = getDB();
    const user = db.users[phone];
    if (!user || !user.isAdmin) return res.redirect('/');

    res.send(renderAdminPage(db, phone, globalGameState));
});

// Admin Post Handlers for Management Actions
app.post('/admin/update-bank', (req, res) => {
    const { adminPhone, bankName, accountNumber, ifscCode } = req.body;
    const db = getDB();
    if (!db.users[adminPhone] || !db.users[adminPhone].isAdmin) return res.redirect('/');

    db.settings.bankName = bankName.trim();
    db.settings.accountNumber = accountNumber.trim();
    db.settings.ifscCode = ifscCode.trim();
    saveDB(db);
    res.redirect(`/admin?phone=${encodeURIComponent(adminPhone)}`);
});

app.post('/admin/script-game', (req, res) => {
    const { adminPhone, scriptMultipliers } = req.body;
    const db = getDB();
    if (!db.users[adminPhone] || !db.users[adminPhone].isAdmin) return res.redirect('/');

    const parsed = scriptMultipliers.split(',').map(item => parseFloat(item.trim())).filter(num => !isNaN(num) && num >= 1.00);
    globalGameState.customScriptQueue = parsed;
    res.redirect(`/admin?phone=${encodeURIComponent(adminPhone)}`);
});

app.post('/admin/process-withdrawal', (req, res) => {
    const { adminPhone, index, action } = req.body;
    const db = getDB();
    if (!db.users[adminPhone] || !db.users[adminPhone].isAdmin) return res.redirect('/');

    const idx = parseInt(index);
    if (db.withdrawals[idx]) {
        const wd = db.withdrawals[idx];
        const targetUser = db.users[wd.phone];

        if (action === 'reject' && targetUser) {
            targetUser.balance += wd.amount;
            targetUser.notifications.unshift({
                id: Date.now(),
                text: `❌ Your withdrawal request of ₹${wd.amount.toFixed(2)} was rejected by admin. Amount refunded to wallet.`,
                time: new Date().toLocaleTimeString()
            });
            targetUser.history.unshift({
                type: 'Withdrawal Refund',
                text: `Refunded ₹${wd.amount.toFixed(2)} from rejected withdrawal`,
                time: new Date().toLocaleString(),
                net: `+₹${wd.amount.toFixed(2)}`
            });
        } else if (action === 'approve' && targetUser) {
            targetUser.notifications.unshift({
                id: Date.now(),
                text: `✅ Your withdrawal request of ₹${wd.amount.toFixed(2)} has been approved and processed!`,
                time: new Date().toLocaleTimeString()
            });
        }

        db.withdrawals.splice(idx, 1);
        saveDB(db);
    }
    res.redirect(`/admin?phone=${encodeURIComponent(adminPhone)}`);
});

app.post('/admin/update-user', (req, res) => {
    const { adminPhone, targetPhone, balance, password } = req.body;
    const db = getDB();
    if (!db.users[adminPhone] || !db.users[adminPhone].isAdmin) return res.redirect('/');

    if (db.users[targetPhone]) {
        db.users[targetPhone].balance = parseFloat(balance) || 0;
        db.users[targetPhone].password = password.trim();
        saveDB(db);
    }
    res.redirect(`/admin?phone=${encodeURIComponent(adminPhone)}`);
});

// API Endpoint for Bank Deposit
app.post('/api/deposit', (req, res) => {
    const { phone, amount, utr } = req.body;
    const db = getDB();
    if (!db.users[phone]) return res.json({ success: false, message: "User not found" });

    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) return res.json({ success: false, message: "Invalid amount" });
    if (!utr || utr.trim() === "") return res.json({ success: false, message: "UTR / Transaction reference is required!" });

    db.users[phone].balance += amt;
    const depRecord = {
        phone,
        username: db.users[phone].username,
        amount: amt,
        utr: utr.trim(),
        time: new Date().toLocaleString()
    };
    db.deposits.push(depRecord);
    db.users[phone].history.unshift({ type: 'Deposit', text: `Deposited ₹${amt.toFixed(2)} (UTR: ${utr})`, time: new Date().toLocaleString(), net: `+₹${amt.toFixed(2)}` });
    db.users[phone].notifications.unshift({
        id: Date.now(),
        text: `✅ Deposit of ₹${amt.toFixed(2)} submitted successfully. UTR: ${utr}`,
        time: new Date().toLocaleTimeString()
    });

    saveDB(db);
    res.json({ success: true, newBalance: db.users[phone].balance });
});

// API Endpoint for Bank Withdrawal
app.post('/api/withdraw', (req, res) => {
    const { phone, amount, bankDetails } = req.body;
    const db = getDB();
    if (!db.users[phone]) return res.json({ success: false, message: "User not found" });

    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) return res.json({ success: false, message: "Invalid amount" });
    if (!bankDetails || bankDetails.trim() === "") return res.json({ success: false, message: "Bank details are required!" });

    if (db.users[phone].balance < amt) {
        return res.json({ success: false, message: "Insufficient balance for withdrawal!" });
    }

    db.users[phone].balance -= amt;
    const wdRecord = {
        phone,
        username: db.users[phone].username,
        amount: amt,
        bankDetails: bankDetails.trim(),
        time: new Date().toLocaleString()
    };
    db.withdrawals.push(wdRecord);
    db.users[phone].history.unshift({ type: 'Withdrawal', text: `Withdrew ₹${amt.toFixed(2)} to bank details`, time: new Date().toLocaleString(), net: `-₹${amt.toFixed(2)}` });
    db.users[phone].notifications.unshift({
        id: Date.now(),
        text: `💸 Withdrawal request of ₹${amt.toFixed(2)} to bank details submitted successfully.`,
        time: new Date().toLocaleTimeString()
    });

    saveDB(db);
    res.json({ success: true, newBalance: db.users[phone].balance });
});

// API Endpoint for Recording Bet Result
app.post('/api/record-bet', (req, res) => {
    const { phone, betAmount, multiplier, status, payout } = req.body;
    const db = getDB();
    if (!db.users[phone]) return res.json({ success: false, message: "User not found" });

    const user = db.users[phone];
    const bet = parseFloat(betAmount);
    const mult = parseFloat(multiplier);

    if (status === 'win') {
        const totalPayout = bet * mult;
        const netProfit = totalPayout - bet; 
        user.balance += netProfit;

        user.history.unshift({
            type: 'Game Win',
            text: `Won ₹${totalPayout.toFixed(2)} net profit ₹${netProfit.toFixed(2)} at ${mult.toFixed(2)}x (Bet: ₹${bet.toFixed(2)})`,
            time: new Date().toLocaleString(),
            net: `+₹${netProfit.toFixed(2)}`,
            multiplier: `${mult.toFixed(2)}x`
        });
    } else {
        user.balance -= bet;
        user.history.unshift({
            type: 'Game Loss',
            text: `Lost bet of ₹${bet.toFixed(2)} at crash ${mult.toFixed(2)}x`,
            time: new Date().toLocaleString(),
            net: `-₹${bet.toFixed(2)}`,
            multiplier: `${mult.toFixed(2)}x`
        });
    }

    if (user.balance < 0) user.balance = 0;
    saveDB(db);
    res.json({ success: true, newBalance: user.balance });
});

// API Endpoint for Game State Sync
app.get('/api/game-state', (req, res) => {
    res.json(globalGameState);
});

// Dedicated Profile Page Route
app.get('/profile', (req, res) => {
    const phone = req.query.phone;
    const db = getDB();
    const user = db.users[phone];
    if (!user) return res.redirect('/');

    res.send(renderProfilePage(user));
});

// Full Game Arena Route
app.get('/game', (req, res) => {
    const phone = req.query.phone;
    const db = getDB();
    const user = db.users[phone];
    if (!user) return res.redirect('/');

    res.send(renderGamePage(user, db));
});

app.listen(PORT, () => {
    console.log(`Aviator Pro running live on http://localhost:${PORT}`);
});
function renderLoginPage() {
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Aviator Pro - India's #1 Game</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
                .bg-login-watermark {
                    background-image: linear-gradient(135deg, rgba(2, 6, 23, 0.88), rgba(15, 23, 42, 0.82)), url('https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=1920&q=80');
                    background-size: cover;
                    background-position: center;
                }
                .glow-card {
                    background: linear-gradient(135deg, rgba(15, 23, 42, 0.90), rgba(2, 6, 23, 0.96));
                    box-shadow: 0 0 60px rgba(236, 72, 153, 0.2), inset 0 0 25px rgba(99, 102, 241, 0.15);
                }
            </style>
        </head>
        <body class="bg-slate-950 text-white font-sans min-h-screen flex items-center justify-center p-4 relative bg-login-watermark overflow-hidden">
            <div class="glow-card border border-pink-500/30 rounded-3xl p-8 max-w-md w-full flex flex-col gap-6 backdrop-blur-xl relative z-10">
                <div class="text-center">
                    <span class="bg-gradient-to-r from-amber-400 via-pink-500 to-indigo-400 bg-clip-text text-transparent text-xs font-black tracking-widest uppercase">🇮🇳 Desi Aviator Club</span>
                    <h1 class="text-3xl font-black tracking-wider text-white mt-1">SKY ROCKET</h1>
                    <p class="text-xs text-pink-200/80 mt-1">Fly high, win big! Sign up now & get ₹100 bonus instantly.</p>
                </div>
                
                <div class="flex bg-slate-900/90 p-1.5 rounded-2xl border border-pink-500/20">
                    <button onclick="switchTab('login')" id="loginTabBtn" class="flex-1 py-2.5 text-xs font-black rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg transition">LOGIN</button>
                    <button onclick="switchTab('register')" id="registerTabBtn" class="flex-1 py-2.5 text-xs font-black rounded-xl text-pink-300 transition hover:text-white">REGISTER</button>
                </div>

                <form id="loginForm" action="/login" method="POST" class="flex flex-col gap-4">
                    <div class="flex flex-col gap-1.5">
                        <label class="text-xs text-pink-300 font-bold">Phone Number (+91)</label>
                        <input type="text" name="phone" required placeholder="+919876543210" class="bg-slate-900/90 border border-pink-500/30 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-pink-500">
                    </div>
                    <div class="flex flex-col gap-1.5">
                        <label class="text-xs text-pink-300 font-bold">Password</label>
                        <input type="password" name="password" required placeholder="Enter password" class="bg-slate-900/90 border border-pink-500/30 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-pink-500">
                    </div>
                    <button type="submit" class="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 hover:opacity-90 text-white font-black py-3.5 rounded-xl text-sm transition shadow-[0_0_20px_rgba(236,72,153,0.4)] mt-2">LOGIN TO GAME</button>
                </form>

                <form id="registerForm" action="/register" method="POST" class="flex flex-col gap-4 hidden">
                    <div class="flex flex-col gap-1.5">
                        <label class="text-xs text-pink-300 font-bold">Your Unique Username</label>
                        <input type="text" name="username" required placeholder="Enter username" class="bg-slate-900/90 border border-pink-500/30 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-pink-500">
                    </div>
                    <div class="flex flex-col gap-1.5">
                        <label class="text-xs text-pink-300 font-bold">Phone Number (+91)</label>
                        <input type="text" name="phone" required placeholder="+919876543210" class="bg-slate-900/90 border border-pink-500/30 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-pink-500">
                    </div>
                    <div class="flex flex-col gap-1.5">
                        <label class="text-xs text-pink-300 font-bold">Create Password</label>
                        <input type="password" name="password" required placeholder="Create password" class="bg-slate-900/90 border border-pink-500/30 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-pink-500">
                    </div>
                    <button type="submit" class="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 hover:opacity-90 text-white font-black py-3.5 rounded-xl text-sm transition shadow-[0_0_20px_rgba(236,72,153,0.4)] mt-2">REGISTER & GET ₹100 BONUS</button>
                </form>
            </div>
            <script>
                function switchTab(tab) {
                    const loginForm = document.getElementById('loginForm');
                    const registerForm = document.getElementById('registerForm');
                    const loginBtn = document.getElementById('loginTabBtn');
                    const registerBtn = document.getElementById('registerTabBtn');
                    if(tab === 'login') {
                        loginForm.classList.remove('hidden');
                        registerForm.classList.add('hidden');
                        loginBtn.className = "flex-1 py-2.5 text-xs font-black rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg transition";
                        registerBtn.className = "flex-1 py-2.5 text-xs font-black rounded-xl text-pink-300 transition hover:text-white";
                    } else {
                        registerForm.classList.remove('hidden');
                        loginForm.classList.add('hidden');
                        registerBtn.className = "flex-1 py-2.5 text-xs font-black rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg transition";
                        loginBtn.className = "flex-1 py-2.5 text-xs font-black rounded-xl text-pink-300 transition hover:text-white";
                    }
                }
            </script>
        </body>
        </html>
    `;
}

function renderAdminPage(db, phone, globalGameState) {
    const totalUsers = Object.keys(db.users).length;
    const totalDepositsCount = db.deposits.length;
    const totalWithdrawalsCount = db.withdrawals.length;

    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Sky Rocket - Admin Dashboard</title>
            <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body class="bg-slate-950 text-white font-sans min-h-screen flex flex-col justify-between">
            <header class="flex justify-between items-center p-4 bg-slate-900 border-b border-slate-800 sticky top-0 z-40">
                <div class="flex items-center gap-3">
                    <span class="text-xl">🛡️</span>
                    <h1 class="text-lg font-black tracking-wider text-amber-400">ADMIN CONTROL PANEL</h1>
                </div>
                <div class="flex items-center gap-3">
                    <a href="/game?phone=${phone}" class="bg-indigo-600 hover:bg-indigo-500 text-white font-black px-4 py-2 rounded-xl text-xs transition">🎮 PLAY GAME</a>
                    <a href="/" class="text-xs text-rose-400 hover:text-rose-300 font-bold px-2 py-1">Logout</a>
                </div>
            </header>

            <main class="flex-1 max-w-6xl mx-auto w-full p-4 flex flex-col gap-6 my-6">
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div class="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col gap-1">
                        <span class="text-xs text-slate-400 font-bold">Total Registered Users</span>
                        <span class="text-3xl font-black text-white">${totalUsers}</span>
                    </div>
                    <div class="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col gap-1">
                        <span class="text-xs text-slate-400 font-bold">Total Deposit Requests</span>
                        <span class="text-3xl font-black text-emerald-400">${totalDepositsCount}</span>
                    </div>
                    <div class="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col gap-1">
                        <span class="text-xs text-slate-400 font-bold">Total Withdrawal Requests</span>
                        <span class="text-3xl font-black text-pink-400">${totalWithdrawalsCount}</span>
                    </div>
                </div>

                <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col gap-4">
                    <h3 class="text-xs font-black uppercase tracking-wider text-indigo-400">🏦 Edit Company Bank Account Details (Visible to All Users)</h3>
                    <form action="/admin/update-bank" method="POST" class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <input type="hidden" name="adminPhone" value="${phone}">
                        <div class="flex flex-col gap-1">
                            <label class="text-[11px] text-slate-400 font-bold">Bank Name</label>
                            <input type="text" name="bankName" value="${db.settings.bankName}" required class="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white">
                        </div>
                        <div class="flex flex-col gap-1">
                            <label class="text-[11px] text-slate-400 font-bold">Account Number</label>
                            <input type="text" name="accountNumber" value="${db.settings.accountNumber}" required class="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono">
                        </div>
                        <div class="flex flex-col gap-1">
                            <label class="text-[11px] text-slate-400 font-bold">IFSC Code</label>
                            <input type="text" name="ifscCode" value="${db.settings.ifscCode}" required class="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono">
                        </div>
                        <div class="sm:col-span-3 flex justify-end">
                            <button type="submit" class="bg-indigo-600 hover:bg-indigo-500 text-white font-black px-5 py-2.5 rounded-xl text-xs transition">Update Bank Details</button>
                        </div>
                    </form>
                </div>

                <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col gap-4">
                    <h3 class="text-xs font-black uppercase tracking-wider text-amber-400">🎮 Game Crash Rigging & Scripting</h3>
                    <p class="text-xs text-slate-400">Queue custom multipliers for upcoming plane rounds (e.g., enter <code class="text-amber-300">1.00, 1.00, 3.00, 5.00</code> to make the next flights crash instantly or at your chosen target).</p>
                    <form action="/admin/script-game" method="POST" class="flex flex-col sm:flex-row gap-3">
                        <input type="hidden" name="adminPhone" value="${phone}">
                        <input type="text" name="scriptMultipliers" placeholder="e.g. 1.00, 1.00, 3.00, 5.00" required class="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white font-mono">
                        <button type="submit" class="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-6 py-3 rounded-xl text-xs transition">Queue Script</button>
                    </form>
                    <div class="text-[11px] text-slate-400">Currently Queued Script: <span class="text-amber-400 font-mono font-bold">${globalGameState.customScriptQueue.length > 0 ? globalGameState.customScriptQueue.join(', ') : 'None (Running random generation)'}</span></div>
                </div>

                <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col gap-4">
                    <h3 class="text-xs font-black uppercase tracking-wider text-pink-400">💸 User Withdrawal Requests (Approve or Reject)</h3>
                    <div class="overflow-x-auto">
                        <table class="w-full text-left text-xs">
                            <thead class="bg-slate-950 text-slate-400 border-b border-slate-800">
                                <tr>
                                    <th class="p-3 font-bold">User</th>
                                    <th class="p-3 font-bold">Phone</th>
                                    <th class="p-3 font-bold">Amount</th>
                                    <th class="p-3 font-bold">Bank Details / UPI</th>
                                    <th class="p-3 font-bold">Time</th>
                                    <th class="p-3 font-bold text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-slate-800/60">
                                ${db.withdrawals.length === 0 ? '<tr><td colspan="6" class="text-center text-slate-500 py-6">No withdrawals requested yet.</td></tr>' : db.withdrawals.map((w, index) => `
                                    <tr class="hover:bg-slate-950/40">
                                        <td class="p-3 font-bold text-white">${w.username}</td>
                                        <td class="p-3 text-slate-400 font-mono">${w.phone}</td>
                                        <td class="p-3 font-bold text-pink-400">₹${w.amount.toFixed(2)}</td>
                                        <td class="p-3 text-slate-200">${w.bankDetails}</td>
                                        <td class="p-3 text-slate-500 text-[10px]">${w.time}</td>
                                        <td class="p-3 text-right flex gap-2 justify-end">
                                            <form action="/admin/process-withdrawal" method="POST" class="inline">
                                                <input type="hidden" name="adminPhone" value="${phone}">
                                                <input type="hidden" name="index" value="${index}">
                                                <input type="hidden" name="action" value="approve">
                                                <button type="submit" class="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1 rounded-lg">Approve</button>
                                            </form>
                                            <form action="/admin/process-withdrawal" method="POST" class="inline">
                                                <input type="hidden" name="adminPhone" value="${phone}">
                                                <input type="hidden" name="index" value="${index}">
                                                <input type="hidden" name="action" value="reject">
                                                <button type="submit" class="bg-rose-600 hover:bg-rose-500 text-white font-bold px-3 py-1 rounded-lg">Reject & Refund</button>
                                            </form>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col gap-4">
                    <h3 class="text-xs font-black uppercase tracking-wider text-amber-400">👥 All Registered Players (Modify Balance & Password)</h3>
                    <div class="overflow-x-auto">
                        <table class="w-full text-left text-xs">
                            <thead class="bg-slate-950 text-slate-400 border-b border-slate-800">
                                <tr>
                                    <th class="p-3 font-bold">Username</th>
                                    <th class="p-3 font-bold">Phone</th>
                                    <th class="p-3 font-bold">Wallet Balance</th>
                                    <th class="p-3 font-bold">Password</th>
                                    <th class="p-3 font-bold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-slate-800/60">
                                ${Object.values(db.users).map(u => `
                                    <tr class="hover:bg-slate-950/40">
                                        <form action="/admin/update-user" method="POST">
                                            <input type="hidden" name="adminPhone" value="${phone}">
                                            <input type="hidden" name="targetPhone" value="${u.phone}">
                                            <td class="p-3 font-bold text-white">${u.username} ${u.isAdmin ? '<span class="text-amber-400">(Admin)</span>' : ''}</td>
                                            <td class="p-3 text-slate-400 font-mono">${u.phone}</td>
                                            <td class="p-3">
                                                <input type="number" step="any" name="balance" value="${u.balance}" class="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-amber-400 font-bold w-28">
                                            </td>
                                            <td class="p-3">
                                                <input type="text" name="password" value="${u.password}" class="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-white w-28">
                                            </td>
                                            <td class="p-3 text-right">
                                                <button type="submit" class="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-3 py-1 rounded-lg">Save</button>
                                            </td>
                                        </form>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col gap-4">
                    <h3 class="text-xs font-black uppercase tracking-wider text-emerald-400">📥 User Bank Deposits (With UTR Reference)</h3>
                    <div class="overflow-x-auto">
                        <table class="w-full text-left text-xs">
                            <thead class="bg-slate-950 text-slate-400 border-b border-slate-800">
                                <tr>
                                    <th class="p-3 font-bold">User</th>
                                    <th class="p-3 font-bold">Phone</th>
                                    <th class="p-3 font-bold">Amount</th>
                                    <th class="p-3 font-bold">UTR Reference</th>
                                    <th class="p-3 font-bold">Time</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-slate-800/60">
                                ${db.deposits.length === 0 ? '<tr><td colspan="5" class="text-center text-slate-500 py-6">No deposits submitted yet.</td></tr>' : db.deposits.map(d => `
                                    <tr class="hover:bg-slate-950/40">
                                        <td class="p-3 font-bold text-white">${d.username}</td>
                                        <td class="p-3 text-slate-400 font-mono">${d.phone}</td>
                                        <td class="p-3 font-bold text-emerald-400">₹${d.amount.toFixed(2)}</td>
                                        <td class="p-3 text-amber-400 font-mono font-bold">${d.utr}</td>
                                        <td class="p-3 text-slate-500 text-[10px]">${d.time}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            <footer class="text-center p-4 text-xs text-slate-500 font-semibold border-t border-slate-800">
                Sky Rocket Admin Control &copy; 2026. All Rights Reserved.
            </footer>
        </body>
        </html>
    `;
}

function renderProfilePage(user) {
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Sky Rocket - User Profile</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
                .bg-profile-clean-dark {
                    background-color: #030712;
                    background-image: radial-gradient(circle at 50% 0%, rgba(30, 41, 59, 0.4) 0%, transparent 70%);
                }
            </style>
        </head>
        <body class="text-white font-sans min-h-screen flex flex-col justify-between bg-profile-clean-dark select-none">
            <header class="flex justify-between items-center p-4 bg-slate-900 border-b border-slate-800 sticky top-0 z-40 shadow-md">
                <div class="flex items-center gap-3">
                    <span class="text-xl">👤</span>
                    <h1 class="text-lg font-black tracking-wider text-slate-100">USER PROFILE</h1>
                </div>
                <div class="flex items-center gap-3">
                    <a href="/game?phone=${user.phone}" class="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-4 py-2 rounded-xl text-xs transition">🎮 GAMES</a>
                    <a href="/" class="text-xs text-rose-400 hover:text-rose-300 font-bold px-2 py-1">Logout</a>
                </div>
            </header>

            <main class="flex-1 max-w-5xl mx-auto w-full p-4 flex flex-col gap-6 my-6">
                <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row justify-between items-center gap-6 shadow-xl">
                    <div class="flex items-center gap-4">
                        <div class="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center text-3xl font-black text-slate-200 border border-slate-700">
                            ${user.username.charAt(0).toUpperCase()}
                        </div>
                        <div class="flex flex-col gap-1">
                            <h2 class="text-xl font-black text-white">${user.username}</h2>
                            <p class="text-xs text-slate-400 font-mono font-bold">${user.phone}</p>
                            <span class="inline-block mt-1 bg-slate-800 text-slate-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-slate-700 w-max">
                                ${user.isAdmin ? '👑 Administrator' : '⭐ Verified Player'}
                            </span>
                        </div>
                    </div>
                    <div class="bg-slate-950 border border-slate-800 px-6 py-4 rounded-xl flex flex-col items-center sm:items-end gap-1">
                        <span class="text-xs text-slate-400 font-bold">Wallet Balance</span>
                        <span class="text-3xl font-black text-amber-400">₹${user.balance.toFixed(2)}</span>
                    </div>
                </div>

                <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col gap-4 shadow-xl">
                    <div class="flex justify-between items-center border-b border-slate-800 pb-3">
                        <h3 class="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                            <span>📊 Complete Betting & Transaction Ledger</span>
                        </h3>
                    </div>
                    <div class="overflow-x-auto">
                        <table class="w-full text-left text-xs">
                            <thead class="bg-slate-950 text-slate-400 border-b border-slate-800">
                                <tr>
                                    <th class="p-3 font-bold">Type</th>
                                    <th class="p-3 font-bold">Details</th>
                                    <th class="p-3 font-bold">Timestamp</th>
                                    <th class="p-3 font-bold text-right">Net Payout</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-slate-800/60">
                                ${user.history.length === 0 ? '<tr><td colspan="4" class="text-center text-slate-500 py-6">No activity history recorded yet.</td></tr>' : user.history.map(h => `
                                    <tr class="hover:bg-slate-950/40 transition">
                                        <td class="p-3 font-bold ${h.type.includes('Win') ? 'text-emerald-400' : h.type.includes('Loss') ? 'text-rose-400' : 'text-amber-400'}">${h.type}</td>
                                        <td class="p-3 text-slate-200 font-medium">${h.text}</td>
                                        <td class="p-3 text-slate-500 font-mono text-[10px]">${h.time}</td>
                                        <td class="p-3 text-right font-bold ${h.net && h.net.startsWith('+') ? 'text-emerald-400' : 'text-rose-400'}">${h.net || '—'}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                
            <!-- ABOUT SKY ROCKET, RIGHTS, REGULATIONS & POLICY -->
            <div class="mt-6 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 text-slate-300 shadow-xl">
                <div class="flex items-center gap-2 text-amber-400 font-semibold mb-3">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    <span>ABOUT SKY ROCKET, RIGHTS, REGULATIONS & POLICY</span>
                </div>
                <div class="space-y-3 text-xs leading-relaxed text-slate-400">
                    <p><strong class="text-slate-200">About the Game:</strong> Sky Rocket is an online skill- and timing-based multiplier prediction platform designed purely for recreational and entertainment engagement. All multiplier crash intervals are generated through certified cryptographic pseudo-random number algorithms.</p>
                    <p><strong class="text-slate-200">Rights & Regulations:</strong> All intellectual property, trademarks, graphics, and source code associated with Sky Rocket belong exclusively to the platform operators. Unauthorized replication, automated scraping, or reverse engineering is strictly prohibited under applicable digital copyright regulations.</p>
                    <p><strong class="text-slate-200">User Policy & Risk Disclaimer:</strong> Participation is entirely voluntary. Users acknowledge that online multiplayer prediction games involve substantial financial risk. All financial gains, losses, deposits, and wagers are the sole responsibility of the user. The platform assumes no legal or financial liability for individual betting losses.</p>
                </div>
            </div>
</div>
            </main>

            <footer class="text-center p-4 text-xs text-slate-500 font-semibold border-t border-slate-800">
                Sky Rocket Gaming Club &copy; 2026. All Rights Reserved.
            </footer>
        </body>
        </html>
    `;
}

function renderGamePage(user, db) {
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Sky Rocket - Aviator Arena</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
                .bg-roulette-panel {
                    background-image: linear-gradient(135deg, rgba(2, 6, 23, 0.88), rgba(88, 28, 135, 0.78)), url('https://images.unsplash.com/photo-1596838132731-3301c3fd4317?auto=format&fit=crop&w=1920&q=80');
                    background-size: cover;
                    background-position: center;
                }
            </style>
        </head>
        <body class="text-white font-sans min-h-screen flex flex-col justify-between select-none bg-roulette-panel">
            <header class="flex justify-between items-center p-4 bg-slate-900/90 border-b border-pink-500/25 backdrop-blur-md sticky top-0 z-40 shadow-lg">
                <div class="flex items-center gap-3">
                    <span class="text-xl animate-bounce">🎰</span>
                    <h1 class="text-lg font-black tracking-wider bg-gradient-to-r from-amber-400 via-pink-500 to-indigo-400 bg-clip-text text-transparent">SKY ROCKET</h1>
                </div>
                <div class="flex items-center gap-2 sm:gap-3">
                    ${user.isAdmin ? `<a href="/admin?phone=${user.phone}" class="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-3 py-1.5 rounded-xl text-xs transition">🛡️ ADMIN</a>` : ''}
                    <a href="/profile?phone=${user.phone}" class="bg-slate-800 hover:bg-slate-700 text-pink-300 font-bold px-3 py-1.5 rounded-xl text-xs transition border border-pink-500/20">PROFILE</a>
                    <button onclick="openWalletModal('deposit')" class="bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-90 text-slate-950 font-black px-3 py-1.5 rounded-xl text-xs transition shadow-[0_0_15px_rgba(52,211,153,0.4)]">DEPOSIT</button>
                    <button onclick="openWalletModal('withdraw')" class="bg-gradient-to-r from-pink-500 to-purple-600 hover:opacity-90 text-white font-black px-3 py-1.5 rounded-xl text-xs transition shadow-[0_0_15px_rgba(236,72,153,0.4)]">WITHDRAW</button>
                    <button onclick="toggleNotifications()" class="relative bg-slate-800 hover:bg-slate-700 p-2 rounded-xl transition border border-pink-500/20">
                        🔔
                        <span id="notifBadge" class="absolute -top-1 -right-1 bg-pink-500 text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">${user.notifications.length}</span>
                    </button>
                    <div class="bg-slate-800/80 px-3 py-1.5 rounded-xl border border-pink-500/20 text-xs font-bold hidden sm:block">
                        Bal: <span class="text-amber-400">₹<span id="userBalance">${user.balance.toFixed(2)}</span></span>
                    </div>
                    <a href="/" class="text-xs text-rose-400 hover:text-rose-300 font-bold px-2 py-1">Logout</a>
                </div>
            </header>

            <main class="flex-1 max-w-6xl mx-auto w-full p-4 grid grid-cols-1 lg:grid-cols-4 gap-4 items-start">
                <div class="bg-slate-900/85 border border-pink-500/20 rounded-2xl p-4 flex flex-col gap-3 lg:col-span-1 shadow-2xl backdrop-blur-md">
                    <h2 class="text-xs font-black uppercase tracking-wider text-pink-300 flex justify-between items-center">
                        <span>Live Betters</span>
                        <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                    </h2>
                    <div id="liveBettersList" class="flex flex-col gap-2 text-xs max-h-72 lg:max-h-[400px] overflow-y-auto pr-1"></div>
                </div>

                <div class="flex flex-col gap-4 lg:col-span-2">
                    <div class="relative bg-slate-950/80 border-2 border-pink-500/50 rounded-3xl h-72 sm:h-80 flex flex-col items-center justify-center overflow-hidden shadow-2xl backdrop-blur-md">
                        <svg class="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 300" preserveAspectRatio="none">
                            <path id="flightCurve" d="M 20 280 Q 200 280 20 280" fill="none" stroke="url(#gradientStroke)" stroke-width="4" stroke-linecap="round" />
                            <defs>
                                <linearGradient id="gradientStroke" x1="0%" y1="100%" x2="100%" y2="0%">
                                    <stop offset="0%" stop-color="#ec4899" />
                                    <stop offset="50%" stop-color="#f59e0b" />
                                    <stop offset="100%" stop-color="#34d399" />
                                </linearGradient>
                            </defs>
                        </svg>

                        <div id="flyingPlane" class="absolute text-3xl sm:text-4xl hidden filter drop-shadow-[0_0_15px_rgba(236,72,153,0.9)] z-20" style="bottom: 20px; left: 20px; will-change: left, bottom;">
                            ✈️
                        </div>

                        <div id="gameMultiplier" class="text-6xl sm:text-7xl font-black text-emerald-400 drop-shadow-[0_0_30px_rgba(52,211,153,0.9)] z-10 bg-slate-950/75 px-6 py-2 rounded-2xl border border-emerald-500/40">1.00x</div>
                        <div id="gameStatusText" class="text-xs uppercase tracking-widest text-pink-200 mt-2 font-bold z-10 bg-slate-950/80 px-4 py-1 rounded-xl border border-pink-500/20">Waiting for next flight...</div>
                        
                        <div id="crashOverlay" class="absolute inset-0 bg-slate-950/92 flex flex-col items-center justify-center hidden backdrop-blur-md z-30">
                            <h2 class="text-3xl sm:text-4xl font-black text-rose-500 animate-bounce">💥 BOOM! CRASHED</h2>
                            <p id="crashFinalMultiplier" class="text-xl font-bold text-amber-400 mt-1">At 2.45x</p>
                        </div>
                    </div>

                    <div class="bg-slate-900/90 border border-pink-500/30 rounded-3xl p-5 flex flex-col gap-4 shadow-2xl backdrop-blur-md">
                        <div class="flex justify-between items-center">
                            <span class="text-xs font-bold text-pink-300 uppercase">Bet Amount (₹)</span>
                            <div class="flex gap-1.5">
                                <button onclick="setBet(100)" class="bg-slate-800 hover:bg-slate-700 px-3 py-1 rounded-lg text-xs font-bold transition border border-pink-500/20">100</button>
                                <button onclick="setBet(500)" class="bg-slate-800 hover:bg-slate-700 px-3 py-1 rounded-lg text-xs font-bold transition border border-pink-500/20">500</button>
                                <button onclick="setBet(1000)" class="bg-slate-800 hover:bg-slate-700 px-3 py-1 rounded-lg text-xs font-bold transition border border-pink-500/20">1000</button>
                            </div>
                        </div>
                        <input type="number" id="betInput" value="100" class="bg-slate-950 border border-pink-500/30 rounded-2xl px-4 py-3.5 text-xl font-black text-center outline-none focus:border-pink-500 text-amber-400 shadow-inner">
                        <button id="actionBtn" onclick="handleBetAction()" class="bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-500 text-slate-950 font-black py-4 rounded-2xl text-base transition shadow-[0_0_20px_rgba(52,211,153,0.4)]">PLACE BET (Next Round)</button>
                    </div>
                </div>

                <div class="bg-slate-900/85 border border-pink-500/20 rounded-2xl p-4 flex flex-col gap-3 lg:col-span-1 shadow-2xl backdrop-blur-md">
                    <h2 class="text-xs font-black uppercase tracking-wider text-pink-300">🏆 Top Winners</h2>
                    <div id="topWinnersList" class="flex flex-col gap-2 text-xs"></div>

                    <h2 class="text-xs font-black uppercase tracking-wider text-pink-300 mt-4">📈 Recent Crashes</h2>
                    <div id="crashHistoryList" class="flex flex-wrap gap-1.5 text-xs max-h-40 overflow-y-auto pr-1"></div>
                </div>
            </main>

            <div id="walletModal" class="fixed inset-0 bg-slate-950/80 backdrop-blur-sm hidden items-center justify-center p-4 z-50">
                <div class="bg-slate-900 border border-pink-500/30 rounded-3xl p-6 max-w-md w-full flex flex-col gap-5 shadow-2xl">
                    <div class="flex justify-between items-center">
                        <div class="flex gap-2">
                            <button onclick="switchWalletTab('deposit')" id="modalDepBtn" class="px-4 py-2 rounded-xl text-xs font-black bg-pink-500 text-white transition">DEPOSIT</button>
                            <button onclick="switchWalletTab('withdraw')" id="modalWdBtn" class="px-4 py-2 rounded-xl text-xs font-black text-pink-300 hover:text-white transition">WITHDRAW</button>
                        </div>
                        <button onclick="closeWalletModal()" class="text-slate-400 hover:text-white font-bold text-xl">&times;</button>
                    </div>

                    <div id="depositContent" class="flex flex-col gap-4">
                        <div class="bg-slate-950/85 border border-pink-500/20 p-4 rounded-2xl flex flex-col gap-3">
                            <p class="text-xs text-pink-300 font-bold text-center">Transfer funds to company bank account below:</p>
                            <div class="flex justify-between items-center bg-slate-900 p-2.5 rounded-xl border border-pink-500/10 text-xs">
                                <div class="flex flex-col">
                                    <span class="text-slate-400 text-[10px]">Bank Name</span>
                                    <span id="bankNameText" class="font-bold text-white">${db.settings.bankName}</span>
                                </div>
                                <button onclick="copyText('bankNameText')" class="bg-pink-500/20 text-pink-300 px-2.5 py-1 rounded-lg font-bold">Copy</button>
                            </div>
                            <div class="flex justify-between items-center bg-slate-900 p-2.5 rounded-xl border border-pink-500/10 text-xs">
                                <div class="flex flex-col">
                                    <span class="text-slate-400 text-[10px]">Account Number</span>
                                    <span id="accNumText" class="font-bold text-amber-400 font-mono">${db.settings.accountNumber}</span>
                                </div>
                                <button onclick="copyText('accNumText')" class="bg-pink-500/20 text-pink-300 px-2.5 py-1 rounded-lg font-bold">Copy</button>
                            </div>
                            <div class="flex justify-between items-center bg-slate-900 p-2.5 rounded-xl border border-pink-500/10 text-xs">
                                <div class="flex flex-col">
                                    <span class="text-slate-400 text-[10px]">IFSC Code</span>
                                    <span id="ifscText" class="font-bold text-white font-mono">${db.settings.ifscCode}</span>
                                </div>
                                <button onclick="copyText('ifscText')" class="bg-pink-500/20 text-pink-300 px-2.5 py-1 rounded-lg font-bold">Copy</button>
                            </div>
                        </div>

                        <div class="flex flex-col gap-1.5">
                            <label class="text-xs text-pink-300 font-bold">Deposit Amount (₹)</label>
                            <input type="number" id="depositAmtInput" value="500" class="bg-slate-950 border border-pink-500/30 rounded-xl px-4 py-3 text-sm text-white outline-none font-bold">
                        </div>
                        <div class="flex flex-col gap-1.5">
                            <label class="text-xs text-pink-300 font-bold">UTR / Transaction Reference No. (Required)</label>
                            <input type="text" id="depositUtrInput" placeholder="Enter UTR / Ref No after payment" class="bg-slate-950 border border-pink-500/30 rounded-xl px-4 py-3 text-sm text-white outline-none">
                        </div>
                        <button onclick="submitDeposit()" class="bg-gradient-to-r from-emerald-400 to-teal-500 text-slate-950 font-black py-3 rounded-xl text-sm transition">SUBMIT DEPOSIT</button>
                    </div>

                    <div id="withdrawContent" class="flex flex-col gap-4 hidden">
                        <div class="bg-slate-950/80 border border-pink-500/20 p-4 rounded-2xl flex flex-col gap-1">
                            <span class="text-xs text-pink-300 font-bold">Available Balance for Withdrawal</span>
                            <span class="text-2xl font-black text-amber-400">₹<span id="modalBalanceDisplay">${user.balance.toFixed(2)}</span></span>
                        </div>
                        <div class="flex flex-col gap-1.5">
                            <label class="text-xs text-pink-300 font-bold">Withdrawal Amount (₹)</label>
                            <input type="number" id="withdrawAmtInput" value="500" class="bg-slate-950 border border-pink-500/30 rounded-xl px-4 py-3 text-sm text-white font-bold">
                        </div>
                        <div class="flex flex-col gap-1.5">
                            <label class="text-xs text-pink-300 font-bold">Your Bank Details / UPI ID</label>
                            <textarea id="withdrawBankInput" rows="3" placeholder="Enter Account Number, IFSC, Account Holder Name or UPI ID" class="bg-slate-950 border border-pink-500/30 rounded-xl p-3 text-sm text-white resize-none"></textarea>
                        </div>
                        <button onclick="submitWithdraw()" class="bg-gradient-to-r from-pink-500 to-purple-600 text-white font-black py-3 rounded-xl text-sm transition">REQUEST WITHDRAWAL</button>
                    </div>
                </div>
            </div>

            <div id="notifModal" class="fixed inset-0 bg-slate-950/80 backdrop-blur-sm hidden items-center justify-center p-4 z-50">
                <div class="bg-slate-900 border border-pink-500/30 rounded-3xl p-6 max-w-sm w-full flex flex-col gap-4 shadow-2xl">
                    <div class="flex justify-between items-center">
                        <h3 class="font-black text-base text-pink-400">🔔 In-App Notifications</h3>
                        <button onclick="toggleNotifications()" class="text-slate-400 hover:text-white font-bold text-xl">&times;</button>
                    </div>
                    <div id="notifListContainer" class="flex flex-col gap-2.5 max-h-64 overflow-y-auto text-xs">
                        ${user.notifications.map(n => `
                            <div class="bg-slate-950/80 border border-pink-500/20 p-3 rounded-2xl flex flex-col gap-1">
                                <p class="text-slate-200 font-medium">${n.text}</p>
                                <span class="text-[10px] text-pink-400">${n.time}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>

            <div id="toastBanner" class="fixed bottom-6 right-6 bg-slate-900 border border-pink-500/40 px-5 py-4 rounded-2xl shadow-2xl z-50 transform translate-y-32 transition-all duration-300 flex items-center gap-3">
                <span id="toastIcon" class="text-2xl">🎉</span>
                <div class="flex flex-col">
                    <h4 id="toastTitle" class="text-xs font-black text-pink-400 uppercase">Notification</h4>
                    <p id="toastMessage" class="text-xs text-slate-200 font-medium">Message here</p>
                </div>
            </div>

            <script>
                let balance = ${user.balance};
                let username = "${user.username}";
                let phone = "${user.phone}";
                let betPlaced = false;
                let currentBetAmount = 0;
                let cashOutClicked = false;
                let userNotifications = ${JSON.stringify(user.notifications)};

                const firstNames = ["Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Sai", "Reyansh", "Ayaan", "Krishna", "Ishaan", "Shaurya", "Atharva", "Dhruv", "Kabir", "Ritvik", "Aarush", "Kian", "Darsh", "Veer", "Rudra", "Aashi", "Ananya", "Diya", "Saanvi", "Aadhya", "Pari", "Anika", "Navya", "Riya", "Meera", "Rahul", "Aman", "Deepak", "Rohit", "Sameer", "Neha", "Vikram", "Karan", "Simran", "Amit"];
                const suffixes = ["Pro", "King", "Vip", "Rox", "Star", "007", "07", "99", "X", "Offical", "Boss", "Legend", "Don", "Fast", "Hacker", "Trader", "Guru", "Hero", "Mahi", "Tiger"];

                function getRandomUsername() {
                    return firstNames[Math.floor(Math.random() * firstNames.length)] + "_" + suffixes[Math.floor(Math.random() * suffixes.length)] + Math.floor(Math.random() * 890 + 10);
                }

                function showToast(title, message, icon = '🎉') {
                    const toast = document.getElementById('toastBanner');
                    document.getElementById('toastTitle').innerText = title;
                    document.getElementById('toastMessage').innerText = message;
                    document.getElementById('toastIcon').innerText = icon;
                    toast.classList.remove('translate-y-32');
                    setTimeout(() => { toast.classList.add('translate-y-32'); }, 4000);
                }

                function copyText(elementId) {
                    navigator.clipboard.writeText(document.getElementById(elementId).innerText);
                    showToast('Copied!', 'Copied to clipboard successfully.', '📋');
                }

                function openWalletModal(tab) {
                    const modal = document.getElementById('walletModal');
                    modal.classList.remove('hidden');
                    modal.classList.add('flex');
                    document.getElementById('modalBalanceDisplay').innerText = balance.toFixed(2);
                    switchWalletTab(tab);
                }

                function closeWalletModal() {
                    const modal = document.getElementById('walletModal');
                    modal.classList.add('hidden');
                    modal.classList.remove('flex');
                }

                function switchWalletTab(tab) {
                    const depContent = document.getElementById('depositContent');
                    const wdContent = document.getElementById('withdrawContent');
                    const depBtn = document.getElementById('modalDepBtn');
                    const wdBtn = document.getElementById('modalWdBtn');
                    if(tab === 'deposit') {
                        depContent.classList.remove('hidden');
                        wdContent.classList.add('hidden');
                        depBtn.className = "px-4 py-2 rounded-xl text-xs font-black bg-pink-500 text-white transition";
                        wdBtn.className = "px-4 py-2 rounded-xl text-xs font-black text-pink-300 hover:text-white transition";
                    } else {
                        wdContent.classList.remove('hidden');
                        depContent.classList.add('hidden');
                        wdBtn.className = "px-4 py-2 rounded-xl text-xs font-black bg-pink-500 text-white transition";
                        depBtn.className = "px-4 py-2 rounded-xl text-xs font-black text-pink-300 hover:text-white transition";
                    }
                }

                async function submitDeposit() {
                    const amount = document.getElementById('depositAmtInput').value;
                    const utr = document.getElementById('depositUtrInput').value;
                    const res = await fetch('/api/deposit', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ phone, amount, utr })
                    });
                    const data = await res.json();
                    if(data.success) {
                        balance = data.newBalance;
                        document.getElementById('userBalance').innerText = balance.toFixed(2);
                        showToast('Deposit Submitted', 'Added ₹' + amount + ' (UTR: ' + utr + ')', '✅');
                        closeWalletModal();
                    } else { showToast('Error', data.message, '⚠️'); }
                }

                async function submitWithdraw() {
                    const amount = document.getElementById('withdrawAmtInput').value;
                    const bankDetails = document.getElementById('withdrawBankInput').value;
                    const res = await fetch('/api/withdraw', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ phone, amount, bankDetails })
                    });
                    const data = await res.json();
                    if(data.success) {
                        balance = data.newBalance;
                        document.getElementById('userBalance').innerText = balance.toFixed(2);
                        showToast('Withdrawal Requested', 'Requested ₹' + amount + ' to bank details', '💸');
                        closeWalletModal();
                    } else { showToast('Error', data.message, '⚠️'); }
                }

                async function recordBetResultLocally(betAmt, mult, status, payout) {
                    const res = await fetch('/api/record-bet', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ phone, betAmount: betAmt, multiplier: mult, status, payout })
                    });
                    const data = await res.json();
                    if(data.success) {
                        balance = data.newBalance;
                        document.getElementById('userBalance').innerText = balance.toFixed(2);
                    }
                }

                function setBet(amount) { document.getElementById('betInput').value = amount; }
                function toggleNotifications() {
                    const modal = document.getElementById('notifModal');
                    modal.classList.toggle('hidden');
                    modal.classList.toggle('flex');
                }

                function handleBetAction() {
                    const betInput = document.getElementById('betInput');
                    const actionBtn = document.getElementById('actionBtn');
                    const amt = parseFloat(betInput.value);

                    if (window.serverGameState && window.serverGameState.status === 'waiting') {
                        if (amt > balance) { showToast('Error', 'Insufficient balance!', '⚠️'); return; }
                        currentBetAmount = amt;
                        document.getElementById('userBalance').innerText = (balance - amt).toFixed(2);
                        betPlaced = true;
                        cashOutClicked = false;
                        actionBtn.innerText = "BET PLACED (Waiting for flight...)";
                        actionBtn.className = "bg-amber-500 text-slate-950 font-black py-4 rounded-2xl text-base transition shadow-lg cursor-not-allowed";
                        actionBtn.disabled = true;
                        showToast('Bet Confirmed', 'Successfully placed ₹' + amt + ' for next round!', '✈️');
                    } else if (window.serverGameState && window.serverGameState.status === 'flying' && betPlaced && !cashOutClicked) {
                        cashOutClicked = true;
                        const currentMult = window.currentInterpolatedMultiplier || window.serverGameState.multiplier;
                        const totalPayout = amt * currentMult;
                        const netProfit = totalPayout - amt;
                        actionBtn.innerText = "CASHED OUT ₹" + totalPayout.toFixed(2);
                        actionBtn.className = "bg-emerald-500 text-slate-950 font-black py-4 rounded-2xl text-base transition shadow-lg";
                        showToast('Cash Out Successful!', 'Won net profit ₹' + netProfit.toFixed(2) + ' at ' + currentMult.toFixed(2) + 'x!', '💰');
                        recordBetResultLocally(currentBetAmount, currentMult, 'win', totalPayout);
                    }
                }

                function updateLiveBetters() {
                    let html = '';
                    if (betPlaced) {
                        html += \`<div class="flex justify-between items-center bg-pink-500/20 p-2.5 rounded-xl border border-pink-500/40"><span class="text-pink-300 font-bold">\${username} (You)</span><span class="text-emerald-400 font-bold">₹\${currentBetAmount.toLocaleString()}</span></div>\`;
                    }
                    for (let i = 0; i < 5; i++) {
                        html += \`<div class="flex justify-between items-center bg-slate-950/50 p-2.5 rounded-xl border border-pink-500/10"><span class="text-slate-300 font-bold">\${getRandomUsername()}</span><span class="text-emerald-400 font-bold">₹\${(Math.floor(Math.random() * 700 + 40) * 100).toLocaleString()}</span></div>\`;
                    }
                    document.getElementById('liveBettersList').innerHTML = html;
                }
                setInterval(updateLiveBetters, 3500);
                updateLiveBetters();

                function updateTopWinners() {
                    let html = '';
                    for (let i = 0; i < 3; i++) {
                        html += \`<div class="flex justify-between items-center bg-slate-950/60 p-2.5 rounded-xl border border-pink-500/10"><span class="text-slate-300 font-bold">\${getRandomUsername()}</span><span class="text-amber-400 font-black">₹\${(Math.floor(Math.random() * 500 + 30) * 100).toLocaleString()} (\${(Math.random() * 4.5 + 1.4).toFixed(2)}x)</span></div>\`;
                    }
                    document.getElementById('topWinnersList').innerHTML = html;
                }
                updateTopWinners();

                async function pollGameState() {
                    try {
                        const res = await fetch('/api/game-state');
                        window.serverGameState = await res.json();
                        if (window.serverGameState && window.serverGameState.crashHistory) {
                            let historyHtml = '';
                            window.serverGameState.crashHistory.slice(0, 12).forEach(val => {
                                const multNum = parseFloat(val);
                                let colorClass = "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
                                if (multNum >= 2.00 && multNum < 3.50) colorClass = "bg-amber-500/20 text-amber-300 border-amber-500/30";
                                else if (multNum >= 3.50) colorClass = "bg-purple-500/20 text-purple-300 border-purple-500/30";
                                else if (multNum < 1.50) colorClass = "bg-rose-500/20 text-rose-300 border-rose-500/30";
                                historyHtml += \`<span class="\${colorClass} px-2 py-1 rounded-lg font-bold border text-[11px]">\${multNum.toFixed(2)}x</span>\`;
                            });
                            document.getElementById('crashHistoryList').innerHTML = historyHtml;
                        }
                    } catch (e) { console.error('Sync error', e); }
                }
                setInterval(pollGameState, 250);
                pollGameState();

                let clientFlightStartTime = null;
                let lastKnownStatus = 'waiting';

                function renderAnimationFrame() {
                    const state = window.serverGameState;
                    if (state) {
                        const actionBtn = document.getElementById('actionBtn');
                        const multiplierEl = document.getElementById('gameMultiplier');
                        const statusEl = document.getElementById('gameStatusText');
                        const planeEl = document.getElementById('flyingPlane');
                        const curveEl = document.getElementById('flightCurve');
                        const crashOverlay = document.getElementById('crashOverlay');

                        if (state.status === 'waiting') {
                            lastKnownStatus = 'waiting';
                            clientFlightStartTime = null;
                            window.currentInterpolatedMultiplier = 1.00;
                            multiplierEl.innerText = "1.00x";
                            crashOverlay.classList.add('hidden');
                            planeEl.classList.add('hidden');
                            curveEl.setAttribute('d', 'M 20 280 Q 200 280 20 280');
                            statusEl.innerText = "Next flight in " + state.countdownTimer + "s (Place your bets!)";

                            if (!betPlaced) {
                                actionBtn.innerText = "PLACE BET (Next Round)";
                                actionBtn.className = "bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-500 text-slate-950 font-black py-4 rounded-2xl text-base transition shadow-[0_0_20px_rgba(52,211,153,0.3)]";
                                actionBtn.disabled = false;
                            }
                        } else if (state.status === 'flying') {
                            if (lastKnownStatus !== 'flying') { lastKnownStatus = 'flying'; clientFlightStartTime = Date.now(); }
                            statusEl.innerText = "✈️ Plane is flying high!";
                            planeEl.classList.remove('hidden');

                            const elapsed = Date.now() - clientFlightStartTime;
                            const duration = state.flightDuration || 12000;
                            const progressRatio = Math.min(elapsed / duration, 1.0);
                            const progress = progressRatio * 90;
                            const calculatedMult = 1.00 + (state.crashAt - 1.00) * Math.pow(progressRatio, 1.4);
                            const currentMult = parseFloat(Math.min(calculatedMult, state.crashAt).toFixed(2));
                            window.currentInterpolatedMultiplier = currentMult;

                            multiplierEl.innerText = currentMult.toFixed(2) + 'x';
                            const planeX = (progress / 90) * 260 + 20;
                            const planeY = (progress / 90) * 150 + 20;
                            planeEl.style.left = planeX + 'px';
                            planeEl.style.bottom = planeY + 'px';
                            curveEl.setAttribute('d', \`M 20 280 Q \${planeX * 0.7} \${280 - (planeY * 0.9)} \${planeX} \${280 - planeY}\`);

                            if (betPlaced && !cashOutClicked) {
                                actionBtn.innerText = "CASH OUT NOW";
                                actionBtn.className = "bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 text-white font-black py-4 rounded-2xl text-base transition shadow-[0_0_25px_rgba(236,72,153,0.6)] animate-pulse";
                                actionBtn.disabled = false;
                            }
                        } else if (state.status === 'crashed') {
                            lastKnownStatus = 'crashed';
                            multiplierEl.innerText = "CRASHED";
                            document.getElementById('crashFinalMultiplier').innerText = "At " + state.multiplier.toFixed(2) + "x";
                            crashOverlay.classList.remove('hidden');
                            planeEl.classList.add('hidden');

                            if (betPlaced && !cashOutClicked) {
                                actionBtn.innerText = "YOU LOST THIS ROUND";
                                actionBtn.className = "bg-slate-800 text-slate-500 font-bold py-4 rounded-2xl text-base cursor-not-allowed";
                                actionBtn.disabled = true;
                                showToast('Plane Crashed!', 'Crashed at ' + state.multiplier.toFixed(2) + 'x. You lost your bet.', '❌');
                                recordBetResultLocally(currentBetAmount, state.multiplier, 'loss', 0);
                            }
                            betPlaced = false;
                            cashOutClicked = false;
                        }
                    }
                    requestAnimationFrame(renderAnimationFrame);
                }
                requestAnimationFrame(renderAnimationFrame);
            </script>
        

            <div class="text-center text-xs text-slate-500 mt-8 mb-6">
                Sky Rocket Gaming Club © 2026. All Rights Reserved.
            </div>


</body>
        </html>
    `;
}

module.exports = {
    renderLoginPage,
    renderAdminPage,
    renderProfilePage,
    renderGamePage
};
