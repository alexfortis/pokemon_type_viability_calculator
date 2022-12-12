# Pokémon Type Viability Calculator
## Purpose
To algorithmically rank all Pokémon types from strongest to weakest based on how they interact with other types and the strength of Pokémon of other types.
## Methodology
- Scrape the data I need from wherever I can get it; [serebii.net](https://www.serebii.net) has it.
- Data required: all moves of each type and category, all stats of all Pokémon (as of Generation 9).
- Use the algorithm described below to analytically determine the type ranking.
## Status
Defensive and offensive scores have been calculated. Check the rankings [here](https://docs.google.com/spreadsheets/d/1CchFpgJfxQf41MJu8qzS33wpiEW8g-63T_OSOu_cqrQ/).
## Results Summary
- Defensive:
    - The best defensive type is dragon/steel, with dark/ghost and fairy/steel not far behind. Other good defensive types include flying/steel, ghost/normal, dark/poison, ghost/steel, and steel/water.
    - The best defensive single type is steel; electric and ghost are not much worse.
    - The worst defensive type is ground/rock, with ice/rock being the only other type anywhere close.
    - The worst defensive single type is rock.
- Offensive:
    - The best offensive type is electric/fire, with fire/ground not far behind, and fighting/fire, fire/grass, and fairy/fire not far behind that.
    - The best offensive single type is fire.
    - The worst offensive type is normal, followed closely by poison and bug.
    - The worst offensive dual type is normal/poison, which is also fourth worst overall.
- Overall:
    - Whether by quotient or by difference, the best type is fairy/steel.
    - Whether by quotient or by difference, the next ten types (in alphabetical order) are dragon/fire, dragon/steel, electric/fairy, electric/ghost, fairy/fire, fairy/ghost, fire/ghost, fire/grass, flying/steel, and ghost/steel.
    - By quotient, the worst type is bug, followed closely by poison and normal. The worst dual types are bug/grass, bug/ice, and bug/poison, which are the fourth through sixth worst types overall.
    - By difference, the worst types are bug/grass and bug/ice, followed somewhat closely by bug, ice/rock, and ground/rock.
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
