---
permalink: /how-to-play
---

# How to Play

If you don't know about Open Emoji Battler project itself, read [this post](https://forum.open-emoji-battler.community/t/topic/60) first.

---

You need the [Polkadot{.js} extension](https://polkadot.js.org/extension/) to play this game. Please install this extension on your updated browser and set up your account. You can access the game from [the top page](https://game.open-emoji-battler.community).

Also, you can try the game instantly without the extension and account from the try button. Your data aren't recorded, and you can't change your deck, but it's a good starting point to practice and understands how this game works.

## Overview

Open Emoji Battler is a PvP strategy game. The game mechanics are inspired by popular auto-battler games but adapted for on-chain gaming.

The ultimate goal of this game is to increase your EP (Emoji Power) through competing matches. EP is a rating-like system for players. It's also used for matchmaking.

In a match, you battle with three rivals. Rivals are previous gameplay data by players, so you don't need to wait for others to start playing. Your aim is to defeat rivals by damaging their health points while keeping your health alive.

## EMO

EMOs are emoji units that fight for players. You can see the detail on the mouse over.

![emo|690x499,50%](assets/emo.png)

- Grade: 1 to 6
- Type: Human, Nature, Food, Object

## Match Flow

1. Build your deck.
1. Start a match. Your rivals are chosen. You have initial health.
1. Repeat a turn that consists of the shop phase and battle phase.
	- shop: Make your board stronger. Buy and sell EMOs, upgrade your player grade, using coins.
	- battle: Watch the auto-battle. EMOs on boards automatically attack the opponent's EMOs until one loses all EMOs. The winner deals damages to the opponent's health.
1. The match ends when you are the last one standing or your health reaches 0.
1. Your EP gets updated based on the result.

Let's look into each step.

## Preparation

You can build EMO decks and select one for use, or just continue with the default deck. Please select EMOs for each grade. Decks are saved on your browser's local storage.

The combination of your deck and fixed set of EMOs will be used as a pool in the match. The number of EMOs will be multiplied.

When you're ready, press the start button. The first shop phase starts.

Your rivals are automatically chosen based on your EP. Your initial health is 30.

## Shop Phase

At the beginning of this phase, you get some coins. The amount of coins you get starts at 3 on the first turn and increases 1 each turn up to a maximum of 8. Your unused coins aren't carried to the next turn.

In this phase, you can do the followings:

- Use 3 coins to buy an EMO from the top line of the Catalog.
	- EMOs on Catalog are randomly selected from the pool.
	- Click the "Buy" button to select the EMO and choose where to set it on your board.
	- You cannot buy an EMO with a higher grade than your player grade.
- Use 1 coin to proceed to the next Catalog line.
	- Only on the first turn, you can do this twice for free.
- Use some coins to upgrade your player grade.
	- The number of coins necessary to upgrade varies on the grade. It decreases by 1 on each turn.
- Move an EMO to the desired position on your board for free.
- Sell an EMO from your board. You get 1 coin.

You can check the status of your rivals.

![shop|690x435](assets/shop.jpeg)

When you have three EMOs of the same emoji on your board, they will be fused into a powerful Triple EMO, and you get 5 coins.

After you finish all operations, proceed to the battle phase.

## Battle Phase

The battle automatically starts with one of your rivals. The player with a greater number of EMOs attacks first. If the numbers of EMOs are equal, a random side starts an attack.

Each EMO on the board from left to right attacks an opponent's random EMO and repeats it.

The state of health 0 is called "retired."

The player that all EMOs retired loses the battle. The winner deals damage to the opponent's health. The damage amount is a sum of the player's grade and the remaining EMOs' grades on the board.

After the battle, the next shop phase starts. Any changes on the boards during the battle will be reset. A set of shop phase and battle phase is called a turn.

When all of your rivals or you retire, the whole match finishes.

## Result

You see the rank of the match and the change of your EP.

## Notes

- Do not reload the site during gameplay. You can't resume the match, and you're considered lost in the match.
- Do not reject the transaction signing popup from the extension. As same as above, you can't resume. These behaviors should be improved in the future version.
- You can watch [a gameplay demo video here](https://www.youtube.com/watch?v=ah3-sWMATSM).

That's it! If you have any issues, feel free to ask us on [Discord](https://discord.gg/fvXzW8hFQ7) or [Twitter](https://twitter.com/OEB_community).
