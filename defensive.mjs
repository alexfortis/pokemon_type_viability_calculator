import {types, MoveCount, get_move_data} from "./get_moves.mjs";

var offensiveTypeData = [];

Promise.all(types.map(get_move_data)).then((values) => {
    for(const value of values) {
	offensiveTypeData.push(value);
    }
    console.log(offensiveTypeData);
});
