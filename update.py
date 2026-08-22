with open("app.js", "r") as f:
    code = f.read()

policy_html = """
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
            </div>"""

# Remove any previous occurrences
while policy_html in code:
    code = code.replace(policy_html, "")

# Find renderProfilePage and insert it right before the last closing `</div>` inside the function
profile_idx = code.find("function renderProfilePage")
if profile_idx != -1:
    # Find the next function or the end of the file to bound our search
    next_func = code.find("function ", profile_idx + 20)
    if next_func == -1:
        next_func = len(code)
    
    profile_block = code[profile_idx:next_func]
    # Find the last </div> in renderProfilePage
    last_div_rel = profile_block.rfind("</div>")
    if last_div_rel != -1:
        insert_pos = profile_idx + last_div_rel
        code = code[:insert_pos] + policy_html + "\n" + code[insert_pos:]
        with open("app.js", "w") as f:
            f.write(code)
        print("Successfully placed policy block at the bottom of profile page!")
    else:
        print("Could not find closing div in profile block.")
else:
    print("renderProfilePage not found.")
