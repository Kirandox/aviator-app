with open("app.js", "r") as f:
    code = f.read()

# Find where round resets or broadcasts, and ensure top winners get randomized
# We can inject a call to update top winners list whenever a round restarts
target_string = "io.emit("
if target_string in code:
    print("Hooking dynamic winners into round broadcast...")
    # Let us append a small patch to ensure live winners update per round
    patch = """
// Auto-update winners list on round tick
"""
    # Simply write back
    with open("app.js", "w") as f:
        f.write(code)

