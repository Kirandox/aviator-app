with open("app.js", "r") as f:
    code = f.read()

# Look for common round start/reset functions or intervals in app.js
# We can search for keywords like 'status: "started"', 'status: "waiting"', 'crash', or round interval logic
if "status" in code and "multiplier" in code:
    # Let us replace any static winners assignment with a dynamic shuffle inside the round loop
    print("Found game loop structures.")

# Let us append a robust round-tick randomizer if not already present
patch = """
// Dynamic Winners Shuffler per round
function shuffleWinners(list) {
    if (!Array.isArray(list)) return [];
    return list.map(item => ({
        ...item,
        amount: "₹" + (Math.floor(Math.random() * 350 + 40) * 10).toLocaleString(),
        multiplier: (Math.random() * 2 + 1.1).toFixed(2) + "x"
    })).sort(() => Math.random() - 0.5);
}
"""

if "shuffleWinners" not in code:
    code = patch + "\n" + code
    with open("app.js", "w") as f:
        f.write(code)
    print("Injected shuffleWinners helper.")

