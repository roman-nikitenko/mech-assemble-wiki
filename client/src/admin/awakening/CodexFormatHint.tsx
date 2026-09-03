/** Reference for the JSON both awakening importers accept, shown collapsed
    next to each Import button.

    It lives in the UI rather than in a docs file on purpose: this is needed at
    the moment someone is staring at an empty paste box, months from now, on a
    machine that may not have the repo checked out. */

const SHAPE = `{
  "name": "Wukong",              // ignored — you pick the mech on this page
  "lv": [                        // exactly 6 entries, awakening levels 1-6
    {
      "n": 1,                    // which level this is
      "live": true,              // enabled in-game? false = "coming soon"

      "big": {                   // the level's CORE node
        "attr": ["HP +5%"],      //   percentage bonuses
        "skill": "Fire Field",   //   the skill it grants
        "info": null,            //   that skill's description
        "cd": [0, 0],            //   raw cooldown pair, meaning unconfirmed
        "power": 1000,           //   power granted
        "lucky": 1301,           //   red-packet id
        "reward": null,          //   one-off item (Lv.3 only)
        "skin": null,            //   skin unlocked (Lv.6, some mechs)
        "major": 1,              //   COST -> cost ladder
        "sh": 150                //   COST -> cost ladder
      },

      "nodes": [                 // the 5 OUTER nodes, in order
        {
          "icon": "UI_Attr_hp",  //   sprite key, matches the icon files
          "mech": "HP +15%",     //   the stat it grants
          "enh": {               //   or an enhancement instead of a stat
            "text": "DMG +10%",
            "ex": [22, 23, 24]   //     modes it does NOT apply in
          },
          "cond": {              //   what unlocks it
            "entry": "AwakenOrnamentReachSpecificQuality",
            "text": "Accessory Fire Gauntlet reached 6 quality",
            "raw": "77_230006_6"
          },
          "pts": 100,            //   COST -> cost ladder
          "sh": 30,              //   COST -> cost ladder
          "acct": ["HP +3,000"]  //   account-wide grant -> cost ladder
        }
      ]
    }
  ]
}`;

export function CodexFormatHint() {
  return (
    <details className="mt-3 rounded-xl border border-edge bg-surface/50">
      <summary className="min-h-11 cursor-pointer list-none px-4 py-3 text-sm font-semibold hover:text-accent">
        What shape does the JSON need to be?
      </summary>
      <div className="border-t border-edge px-4 py-3">
        <p className="text-xs text-ink-dim">
          One mech's block from the awakening codex. A whole codex file
          (<code className="font-mono">{`{ "mechs": [ … ] }`}</code>) works too — the mech
          editor takes the first entry, so paste a single mech's file when it matters
          which one.
        </p>
        <p className="mt-2 text-xs text-ink-dim">
          Fields marked <span className="text-ink">COST</span> are read only by the{" "}
          <span className="text-ink">Awakening costs</span> page, never by a mech's editor
          — the costs are identical for all 19 mechs, so they are stored once globally
          instead of on every node. That is why the same file is pasted in two places.
        </p>
        <pre className="mt-3 overflow-x-auto rounded-lg border border-edge bg-bg p-3 font-mono text-[11px] leading-relaxed text-ink-dim">
          {SHAPE}
        </pre>
        <p className="mt-2 text-xs text-ink-dim">
          Anything unrecognised is ignored, and any field may be{" "}
          <code className="font-mono">null</code>. Nothing is written to the database
          until you press Save.
        </p>
        <p className="mt-2 text-xs text-ink-dim">
          The block above is annotated for reading — those{" "}
          <code className="font-mono">//</code> comments are not valid JSON. Paste a
          real codex file rather than this example.
        </p>
      </div>
    </details>
  );
}
