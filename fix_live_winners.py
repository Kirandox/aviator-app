with open("app.js", "r") as f:
    code = f.read()

# Let us find where the game broadcast or round tick happens (e.g. io.emit or similar broadcast)
# We will ensure that whenever a new round starts or ends, topWinners is re-shuffled and broadcasted to clients live.
target = "io.emit("
if target in code:
    # Let us inject our shuffle logic right before emitting state updates
    live_update_patch = """
    // Auto-update top winners live every round
    if (typeof shuffleWinners === 'function' && typeof topWinners !== 'undefined') {
        topWinners = shuffleWinners(topWinners);
    }
"""
    # Insert it right before the first io.emit in the main game loop tick
    pos = code.find(target)
    if pos != -1:
        code = code[:pos] + live_update_patch + "\n" + code[pos:]
        with open("app.js", "w") as f:
            f.write(code)
        print("Successfully injected live winners update into game broadcast loop!")
    else:
        print("Could not find io.emit position.")
else:
    print("io.emit not found in app.js.")
