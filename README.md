# Pokémon Type Viability Calculator
## Purpose
To analytically rank all Pokémon types from strongest to weakest based on how they interact with other types and the strength of Pokémon of other types.
## Usage
- If you just want the data, you can see it [here](https://docs.google.com/spreadsheets/d/1CchFpgJfxQf41MJu8qzS33wpiEW8g-63T_OSOu_cqrQ/), or in the CSV/ODS files included in this repository.
- If you want to download and run the code for yourself:
    - Ensure you have [Node.js](https://nodejs.org/) v18 or later installed properly. Not tested on v19.
    - Clone the repository like you would any other.
    - From your terminal, run `node defensive.mjs` to get the defensive scores and `node offensive.mjs` to get the offensive scores.
        - Note that a higher offensive score and a lower defensive score are better.
## Background Information
If you are familiar with how Pokémon games work, skip this section.

If you have never heard of Pokémon or have no idea what it is, check out [the Wikipedia page](https://en.wikipedia.org/wiki/Pok%C3%A9mon). The parts of it that are relevant are the video games in which people train and battle each other with Pocket Monsters, or Pokémon for short.

- In Pokémon games, there are 18 different types.
    - Bug, Dark, Dragon, Electric, Fairy, Fighting, Fire, Flying, Ghost, Grass, Ground, Ice, Normal, Poison, Psychic, Rock, Steel, Water
- Pokémon attack each other with moves, which each have one type (except the rare move Flying Press, which is Flying and Fighting type).
- Each Pokémon can have one or two types. This means there are a possible 18 + $18 \choose 2$ or 171 types a Pokémon can take.
    - All but 10 of these types have been used by at least one Pokémon.
    - Pokémon deal 50% more damage when using moves that match their types.
- Different types have different levels of effectiveness against each other. For example, Water is super effective on Fire, which is super effective on Grass, which is super effective on Water. For a full reference, check [this chart](https://pokemondb.net/type/dual).
    - If a move is "super effective" on a Pokémon, it does double damage.
    - If a move is "not very effective" on a Pokémon, it does half damage.
    - Some types are immune to other types; for example, Flying is immune to Ground, Normal and Ghost are immune to each other, and Steel is immune to Poison.
    - For dual types, these effectiveness multipliers are multiplied together. For example, Water is weak to Electric and Grass, Flying is weak to Electric and resists Grass, and Ground is weak to Grass and immune to Electric, so a Ground/Water Pokémon takes quadruple damage from Grass-type moves but no damage from Electric-type moves, and a Flying/Water Pokémon takes quadruple damage from Electric-type moves but regular damage from Grass-type moves.
- Each Pokémon species has six core statistics: Hit Points (HP), Attack, Defense, Special Attack, Special Defense, and Speed. These can be added together to get its Base Stat Total (BST), a quick (though not perfect) way to determine how powerful a given Pokémon is overall.
    - Each Pokémon's actual stats vary based on other variables irrelevant to this project, but the base stats are inherent to the species, so those are used here.
- Each move used in battle has a category (Physical/Special/Status), power (if not a status move), and accuracy (if the target is not the self).
    - Status moves do not deal immediate damage, but instead change the condition of some Pokémon on the field; e.g. changing its stats, making it confused (so it might attack itself), or inflicting some status condition such as Sleep, Burn, Paralysis, Poison, or Freeze that inhibit the target's ability to battle.
    - Unless otherwise noted, the actual damage done by Physical moves depends on the Attack of the attacking Pokémon and the Defense of the defending Pokémon, and that of Special moves depends on the Special Attack of the attacking Pokémon and Special Defense of the defending Pokémon.
- Pokémon and moves of certain types tend to be weaker than those of other types. For example, Bug-type Pokémon tend to be weak, while Dragon-type Pokémon tend to be strong. This is not inherent to the type, but it affects how useful certain types are in the game.
## Methodology
- Scrape the data I need from wherever I can get it; [serebii.net](https://www.serebii.net) has it.
    - This is scraped once and stored locally, until/unless Serebii updates their website, in which case the local copy should be deleted and refreshed.
- Data required: all moves of each type and category, all stats of all Pokémon (as of Generation 9).
- Use the algorithm described below to analytically determine the type ranking.
## Status
Defensive and offensive scores have been calculated. No known bugs or issues.
## Results Summary
- Defensive:
    - The best defensive type is Dragon/Steel, with Dark/Ghost and Fairy/Steel not far behind. Other good defensive types include Flying/Steel, Ghost/Normal, Dark/Poison, Ghost/Steel, and Steel/Water.
    - The best defensive single type is Steel; Electric and Ghost are almost as good.
    - The worst defensive type is Ground/Rock, with Ice/Rock being the only other type anywhere close.
    - The worst defensive single type is Rock.
- Offensive:
    - The best offensive type is Electric/Fire, with Fire/Ground not far behind, and Fighting/Fire, Fire/Grass, and Fairy/Fire not far behind that.
    - The best offensive single type is Fire.
    - The worst offensive type is Normal, followed closely by Poison and Bug.
    - The worst offensive dual type is Normal/Poison, which is also fourth worst overall.
- Overall:
    - Whether by quotient or by difference, the best type is Fairy/Steel.
    - Whether by quotient or by difference, the next ten types (in alphabetical order) are Dragon/Fire, Dragon/Steel, Electric/Fairy, Electric/Ghost, Fairy/Fire, Fairy/Ghost, Fire/Ghost, Fire/Grass, Flying/Steel, and Ghost/Steel.
    - By quotient, the worst type is Bug, followed closely by Poison and Normal. The worst dual types are Bug/Grass, Bug/Ice, and Bug/Poison, which are the fourth through sixth worst types overall.
    - By difference, the worst types are Bug/Grass and Bug/Ice, followed somewhat closely by Bug, Ice/Rock, and Ground/Rock.
## Algorithm
Notes:
- All defensive and offensive scores are adjusted so the average is 100. Both the raw score and normalized score are placed in the spreadsheet.
- A lower defensive score is better, and a higher offensive score is better.
- Stronger and more common types with more powerful and accurate attacking moves are weighted more heavily than weaker and less common types with weaker and less accurate attacking moves.
- As of the initial release of Pokémon Scarlet and Violet, which kicked off Generation 9, the following type combinations still have yet to be used:
    - Bug/Dragon
    - Bug/Normal
    - Dragon/Fairy
    - Fairy/Fire
    - Fairy/Ground
    - Ghost/Rock
    - Ice/Normal
    - Ice/Poison
    - Normal/Rock
    - Normal/Steel
- Some universal notation:
    - E(T,U) denotes the Effectiveness of a move of type T on a Pokémon of type U. For reference, check [this chart](https://pokemondb.net/type/dual).
    - APA(T) denotes the Average Physical Attack of a Pokémon of type T.
    - ASA(T) denotes the Average Special Attack of a Pokémon of type T.
    - APD(T) denotes the Average Physical Defense of a Pokémon of type T.
    - ASD(T) denotes the Average Special Defense of a Pokémon of type T.
    - APP(T) denotes the Average Power of a Physical move of type T.
    - APS(T) denotes the Average Power of a Special move of type T.
    - NPM(T) denotes the Number of Physical Moves of type T.
    - NSM(T) denotes the Number of Special Moves of type T.
    - APA denotes the Average Physical Attack of all Pokémon.
    - ASA denotes the Average Special Attack of all Pokémon.
    - APD denotes the Average Physical Defense of all Pokémon.
    - ASD denotes the Average Special Defense of all Pokémon.
    - NP denotes the Number of overall Pokémon.
    - NP(T) denotes the number of Pokémon of type T. This does not include dual-typed Pokémon if T is a single type.
- The algorithms described below are done for each of the 171 different types.
### Defensive
- Consider the type T.
    - Initialize totalScore to 0.
    - For every possible type U of which there is at least one Pokémon:
        - If U is a single type:
            - Add to totalScore: E(U,T) * (NPM(U) * APP(U) * APA(U)/APA + NSM(U) * APS(U) * ASA(U)/ASA) / (NPM(U) + NSM(U)).
        - Else:
            - Let A, B be the component types of U. If U is a single type, then U=A and B is undefined.
            - Let A_SCORE = E(A,T) * (NPM(A) * APP(A) * APA(U)/APA + NSM(A) * APS(A) * ASA(U)/ASA) / (NPM(A) + NSM(A)).
            - Let B_SCORE = E(B,T) * (NPM(B) * APP(B) * APA(U)/APA + NSM(B) * APS(B) * ASA(U)/ASA) / (NPM(B) + NSM(B)) if B is defined, 0 otherwise.
            - Add to totalScore: max(A_SCORE, B_SCORE) * NP(U)/NP.
    - totalScore is now the total defensive score for type T. Store it and save it for later.
### Offensive
- Consider the type T.
    - Initialize totalScore to 0.
    - For every possible type U of which there is at least one Pokémon:
        - If T is a single type:
            - Add to totalScore: E(T,U) * (NPM(T) * APP(T) * APA(T)/APA + NSM(T) * APS(T) * ASA(T)/ASA) / (NPM(T) + NSM(T)).
        - Else:
            - Let A, B be the component types of T. If T is a single type, then T=A and B is undefined.
            - Let A_SCORE = E(A,U) * (NPM(A) * APP(A) * APD(U)/APD + NSM(A) * APS(A) * ASD(U)/ASD) / (NPM(A) + NSM(A)).
            - Let B_SCORE = E(A,U) * (NPM(B) * APP(B) * APD(U)/APD + NSM(B) * APS(B) * ASD(U)/ASD) / (NPM(B) + NSM(B)) if B is defined, 0 otherwise.
            - Add to totalScore: max(A_SCORE, B_SCORE) * NP(U)/NP.
    - totalScore is now the total offensive score for type T. Store it and save it for later.
### Combining
It's unclear which is better: offensive/defensive or offensive-defensive. Therefore, both are calculated and placed in the [spreadsheet](https://docs.google.com/spreadsheets/d/1CchFpgJfxQf41MJu8qzS33wpiEW8g-63T_OSOu_cqrQ/), as the quotient total and difference total respectively.
