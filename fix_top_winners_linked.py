with open("app.js", "r") as f:
    code = f.read()

# We will write a dedicated function that selects top winners dynamically from live betters and current multiplier
logic_patch = """
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
"""

if "updateTopWinnersFromLive" not in code:
    code = logic_patch + "\n" + code

with open("app.js", "w") as f:
    f.write(code)

print("Successfully added linked top winners generator!")
