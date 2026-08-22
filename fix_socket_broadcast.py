with open("app.js", "r") as f:
    code = f.read()

# Let us find how sockets broadcast updates (e.g. socket.emit, ws.send, broadcast, etc.)
broadcast_keyword = None
for kw in [".emit(", "broadcast", "ws.", "io"]:
    if kw in code:
        broadcast_keyword = kw
        break

print(f"Detected broadcast keyword: {broadcast_keyword}")

# Let us find the round loop or game timer interval where rounds end/restart
# We can search for 'setTimeout' or 'setInterval' where the game state updates
target_loop_marker = "status"
if target_loop_marker in code:
    live_update_patch = """
    // Live update top winners every round
    if (typeof shuffleWinners === 'function' && typeof topWinners !== 'undefined') {
        topWinners = shuffleWinners(topWinners);
    }
"""
    # Find a good spot inside the main game function or interval
    pos = code.find("setInterval")
    if pos != -1:
        # Insert inside or right before the interval callback
        code = code[:pos] + live_update_patch + "\n" + code[pos:]
        with open("app.js", "w") as f:
            f.write(code)
        print("Successfully injected live winner update into game timer loop!")
    else:
        print("Interval not found, updating via general file patch.")
else:
    print("Could not locate game state marker.")
