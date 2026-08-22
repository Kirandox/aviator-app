with open("app.js", "r") as f:
    code = f.read()

# Let us check how top winners/betters are currently handled and update the round progression/socket emission
# We look for the game round loop or winner generation logic in app.js
if "liveBetters" in code or "winners" in code or "topWinners" in code:
    # A lightweight helper function to randomize top winners list names/amounts dynamically after each round
    randomizer_code = """
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
"""
    if "getDynamicWinners" not in code:
        code = randomizer_code + "\n" + code

    with open("app.js", "w") as f:
        f.write(code)
    print("Added dynamic winner generator!")
else:
    print("Checked app.js structure.")
