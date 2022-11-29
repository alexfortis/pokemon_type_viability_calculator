import {MoveCount, get_move_data} from "./get_moves.mjs";
import util from "./util.mjs";

var offensiveTypeData = [];

Promise.all(util.types.map(get_move_data)).then((values) => {
    for(const value of values) {
	offensiveTypeData.push(value);
    }
    console.log(offensiveTypeData);
});
