import {MoveCount, get_move_data} from "./get_moves.mjs";
import util from "./util.mjs";
import get_mons from "./get_mons.mjs";
import fs from "fs";

const outfile = "defensive_scores.csv";

Promise.all(util.types.map(get_move_data)).then((moves) => {
    const single_type_graph = util.type_adjlist();
    get_mons.get_mons().then((mons) => {
	//get the average physical/special atttack of each type
	//entry format: type {p, s, c}
	const avg_atks = {};
	for(const type of util.types) {
	    const _type = (type === "psychict")?("psychic"):(type);
	    const mons_of_type = mons.filter(mon => get_mons.isType(mon, _type));
	    //console.log(`There are ${mons_of_type.length} Pokemon with the ${_type} type`);
	    const avg_phys_atk = util.avg(mons_of_type.map(mon => parseInt(mon.att)));
	    const avg_spec_atk = util.avg(mons_of_type.map(mon => parseInt(mon.satt)));
	    avg_atks[type] = {p: avg_phys_atk, s: avg_spec_atk, c: mons_of_type.length};
	}
	//console.log(avg_atks);
	var content = "type,def_score";
	for(let i = 0; i < util.types.length; i++) {
	    const ti = util.types[i];
	    for(let j = i; j < util.types.length; j++) {
		const tj = util.types[j];
		const type = (j === i)?(ti):(ti + "/" + tj);
		var totalScore = 0;
		const matchups = {};
		for(const mt of moves) {
		    for(const mt2 of moves) {
			if(mt.type <= mt2.type) {
			    const mts_as_str = (mt === mt2)?(mt.type):(mt.type + "/" + mt2.type);
			    var def_score = 0;
			    if(mt === mt2) {
				const e = single_type_graph[ti][mt.type].def * (i === j)?(1):(single_type_graph[tj][mt.type].def);
				const def_score_mt = e * (mt.physical * mt.physicalCount * avg_atks[mt.type].p + mt.special * mt.specialCount * avg_atks[mt.type].s) / (mt.physicalCount + mt.specialCount) * avg_atks[mt.type].c/mons.length;
				def_score = def_score_mt;
			    }
			    else {
				const e = single_type_graph[ti][mt.type].def * (i === j)?(1):(single_type_graph[tj][mt.type].def);
				const def_score_mt = e * (mt.physical * mt.physicalCount * avg_atks[mt.type].p + mt.special * mt.specialCount * avg_atks[mt.type].s) / (mt.physicalCount + mt.specialCount) * avg_atks[mt.type].c/mons.length;
				const e2 = single_type_graph[ti][mt2.type].def * (i === j)?(1):(single_type_graph[tj][mt2.type].def);
				const def_score_mt2 = e2 * (mt2.physical * mt2.physicalCount * avg_atks[mt2.type].p + mt2.special * mt2.specialCount * avg_atks[mt2.type].s) / (mt2.physicalCount + mt2.specialCount) * avg_atks[mt2.type].c/mons.length;
				def_score = (def_score_mt > def_score_mt2)?(def_score_mt):(def_score_mt2);
			    }
			    matchups[mts_as_str] = def_score;
			    totalScore += def_score;
			}
		    }
		}
		content += `\n${type},${totalScore}`;
	    }
	}
	fs.writeFileSync(process.cwd() + "/" + outfile, content);
    });
});
