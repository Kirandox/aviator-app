with open("app.js", "r") as f:
    code = f.read()

# Let us find where the game state resets for a new round (e.g. status = 'waiting' or starting a new flight)
# We can wrap the winners array update in the round initialization block
target_snippet = "status = 'waiting'"
if target_snippet not in code:
    target_snippet = "status: 'waiting'"

if target_snippet in code:
    # Insert shuffle logic when waiting/restarting round
    code = code.replace(target_snippet, "status = 'waiting'; if (typeof shuffleWinners === 'function' && typeof topWinners !== 'undefined') topWinners = shuffleWinners(topWinners);")
    with open("app.js", "w") as f:
        f.write(code)
    print("Successfully hooked shuffleWinners into round reset!")
else:
    print("Could not find standard round waiting state, checking alternative...")
    # Alternative hook on setInterval or game loop tick
    if "setInterval" in code:
        print("Game loop uses interval.")

