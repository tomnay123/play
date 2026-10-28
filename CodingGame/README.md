# CodingGame

A browser game that teaches coding to children aged 7–12. Players tap picture blocks to build a program, then press Go to steer a robot around a space station to collect stars, dodging asteroids and open space. Later levels move on to typing real Python-style code.

## Levels and concepts

1. Get the star!: moving
2. Turn the corner: turning
3. Zig zag: planning a route
4. Bug hunt: debugging a program that's almost right
5. Staircase: Repeat loops
6. Around the pond: loops inside loops
7. Loop bug: debugging inside a loop
8. The long road: Repeat until ⭐
9. Snail shell: If / otherwise (sensing a path ahead, left or right)
10. Key and door: picking up keys and opening doors
11. Hurdles: My block (making your own function)
12. Shifting road: one program that works on 3 different maps
13. Key or no key?: If "have a key", across 2 maps
14. Mystery maze: If inside If, across 3 maps

Typed code (a small Python-style language that runs on the same robot):

15. Blocks are code: build with blocks and watch the Python appear
16. Type it!: typing `forward()`, `turn_left()`, `turn_right()`
17. Loop the loop: `for i in range(5):`
18. Typo trouble: fixing syntax errors
19. Code that decides: `while not at_star():` with `if` / `else`, across 3 maps
20. Your own function: `def hop():`
21. Maze master: `elif`, across 3 maps

The typed language understands `forward()`, `turn_left()`, `turn_right()`, `for i in range(n):`, `while not at_star():`, `if` / `elif` / `else` with `path_ahead()`, `path_left()`, `path_right()` and `has_key()`, one `def name():` function, `pass` and `#` comments. Errors are explained in plain words with the line number.

Each level can unlock blocks and set a block limit, so the new idea is the way to solve it. A "New!" card explains each idea the first time it appears. Levels with several maps run them in a shuffled order every time Go is pressed, so only a general rule works. Every level is open, so players can skip ahead.

## Run it

Open `index.html` in a browser. No build step or install needed.

## Files

- `index.html`: page layout
- `style.css`: styles
- `game.js`: levels, blocks, the program runner and the board drawing (add levels to `LEVELS`)
