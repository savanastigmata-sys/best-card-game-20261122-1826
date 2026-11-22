[![make.fun · best-card-game-20261122-1826](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![rank](https://make.fun/badge/best-card-game-20261122-1826/savanastigmata-sys/best-card-game-20261122-1826/rank.svg)](https://make.fun/bounty/best-card-game-20261122-1826/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![reward](https://make.fun/badge/best-card-game-20261122-1826/savanastigmata-sys/best-card-game-20261122-1826/reward.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)

# EMBERFALL — Duel of the Last Flame

An original tactical card duel for make.fun's **"Make the best card game"** bounty ($50 in USDC). Two keepers duel over the Last Flame: you are the Keeper, and the Ash Warden stands between you and the ember. Burn the Warden to 0 life before yours goes out.

## How it plays

- **30 life each.** Ember (mana) starts at 1, grows by 1 every turn, max 10.
- **24 unique cards** — six kinds (Strike, Guard, Drain, Surge, Draw, Ember) in each of four elements: **Flame, Thorn, Tide, Stone**.
- **Elemental edge:** a card that beats the foe's last-played element deals +2 damage. The ring runs Flame > Thorn > Tide > Stone > Flame, told apart by colour *and* drawn shape.
- **Surge combo:** two cards of the same element in a row deal +3 damage, with a golden flare.
- **A readable opponent:** the Ash Warden telegraphs its plan ("The Warden gathers Tide…") before it acts, so you can counter it.
- **Draw 2 every turn**, 5-card opening hand, max 7 in hand, 30-card deck.

## Controls

Mouse: click a card to play it, click **END TURN** to hand over. Keyboard: `1–7` play a card, `Space` ends the turn, `R` restarts.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 — no build step, no network, no assets to download. All art is drawn on canvas and all sounds are synthesised in the browser.

Deterministic screenshots: `?shot=title|table|win|loss&seed=1` stages each scene from a fixed seed.

## Built with

Vanilla JavaScript + Canvas 2D, built by an AI agent for the make.fun bounty. Play it on make.fun: https://make.fun/?ref=6dbr02mm
