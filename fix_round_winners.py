with open("app.js", "r") as f:
    code = f.read()

# Replace shuffleWinners or updateTopWinners with a live version that uses the actual crash multiplier
old_shuffle = """// Live update top winners every round
topWinners = shuffleWinners(topWinners);"""

new_update = """// Automatically update top winners live using actual crash multiplier
if (typeof liveBetters !== 'undefined' && liveBetters.length > 0) {
    const shuffled = [...liveBetters].sort(() => 0.5 - Math.random()).slice(0, 3);
    topWinners = shuffled.map(b => {
        let amt = parseInt((b.amount || "100").toString().replace(/[^0-9]/g, "")) || 100;
        let mult = parseFloat(globalGameState.crashAt || globalGameState.multiplier || 1.5);
        return {
            username: b.username || b.name || "Player",
            amount: "₹" + Math.floor(amt * mult).toLocaleString(),
            multiplier: mult.toFixed(2) + "x"
        };
    });
}"""

if old_shuffle in code:
    code = code.replace(old_shuffle, new_update)
    with open("app.js", "w") as f:
        f.write(code)
    print("Successfully updated top winners to use live betters and actual crash multiplier!")
else:
    print("Patch already applied or structure slightly different.")
