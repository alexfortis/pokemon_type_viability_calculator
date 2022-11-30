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
	const atks_times_pow = {};
	for(const mt of moves) {
	    atks_times_pow[mt.type] = {p: avg_atks[mt.type].p * mt.physical, s: avg_atks[mt.type].s * mt.special};
	}
	console.log(atks_times_pow);
	var content = "type,def_score";
	for(let i = 0; i < util.types.length; i++) {
	    content += `,${util.types[i]}`;
	    for(let j = i+1; j < util.types.length; j++) {
		content += `,${util.types[i]}/${util.types[j]}`;
	    }
	}
	//i, j for the defending type
	for(let i = 0; i < util.types.length; i++) {
	    const ti = util.types[i];
	    for(let j = i; j < util.types.length; j++) {
		const tj = util.types[j];
		const type_str = (j === i) ? (ti) : (ti + "/" + tj);
		const matchups = {};
		//type ti, tj
		var totalScore = 0;
		//k, l for the attacking type
		for(let k = 0; k < moves.length; k++) {
		    const mk = moves[k];
		    for(let l = k; l < moves.length; l++) {
			const ml = moves[l];
			//type mk.type, ml.type
			const off_t_str = (k === l)?(mk.type):(mk.type + "/" + ml.type);
			var def_score = 0;
			if(k === l) {
			    //monotype mk.type
			    const e = single_type_graph[ti][mk.type].def * (i === j)?(1):(single_type_graph[tj][mk.type].def);
			    const def_score_k = e * (atks_times_pow[mk.type].p * mk.physicalCount + atks_times_pow[mk.type].s * mk.specialCount) / (mk.physicalCount + mk.specialCount);
			    //console.log(`Defensive score of ${type_str} against ${off_t_str} is ${def_score_k}`);
			    def_score = def_score_k * mons.filter(mon => get_mons.isTypes(mon, mk.type)).length / mons.length;
			}
			else {
			    const ek = single_type_graph[ti][mk.type].def * (i === j)?(1):(single_type_graph[tj][mk.type].def);
			    const def_score_k = ek * (atks_times_pow[mk.type].p * mk.physicalCount + atks_times_pow[mk.type].s * mk.specialCount) / (mk.physicalCount + mk.specialCount);
			    const el = single_type_graph[ti][ml.type].def * (i === j)?(1):(single_type_graph[tj][ml.type].def);
			    const def_score_l = el * (atks_times_pow[ml.type].p * ml.physicalCount + atks_times_pow[ml.type].s * ml.specialCount) / (ml.physicalCount + ml.specialCount);
			    //console.log(`Defensive score of ${type_str} against ${off_t_str} is the max of ${def_score_k} (${mk.type}) and ${def_score_l} (${ml.type})`);
			    def_score = util.max(def_score_k, def_score_l) * mons.filter(mon => get_mons.isTypes(mon, mk.type, ml.type)).length / mons.length;
			}
			matchups[off_t_str] = def_score;
			totalScore += def_score;
		    }
		}
		//console.log(`Matchups for ${type_str} (total score: ${totalScore}):`);
		content += `\n${type_str},${totalScore}`;
		for(let k = 0; k < moves.length; k++) {
		    const tk = moves[k].type;
		    //console.log(`\t${tk}: ${matchups[tk]}`);
		    content += `,${matchups[tk]}`;
		    for(let l = k+1; l < moves.length; l++) {
			const tl = moves[l].type;
			const tkl_str = tk + "/" + tl;
			//console.log(`\t${tkl_str}: ${matchups[tkl_str]}`);
			content += `,${matchups[tkl_str]}`;
		    }
		}
	    }
	}
	fs.writeFileSync(process.cwd() + "/" + outfile, content);
    });
});
