import {MoveCount, get_move_data} from "./get_moves.mjs";
import util from "./util.mjs";
import get_mons from "./get_mons.mjs";
import fs from "fs";

const outfile = "offensive_scores.csv";

Promise.all(util.types.map(get_move_data)).then((moves) => {
    const single_type_graph = util.type_adjlist();
    get_mons.get_mons().then(mons => {
	var content = "type,off_score";
	const pkmn_count_by_type = {};
	const all_types = [];
	//entry format: {p, s, c}
	const avg_defs = {};
	//get the average physical/special defense of each type
	for(let i = 0; i < util.types.length; i++) {
	    const type_i = util.types[i];
	    const _type_i = (util.types[i] === "psychict")?("psychic"):(util.types[i]);
	    //monotype i; every single-type has at least one pokemon
	    const mons_i = mons.filter(mon => get_mons.isTypes(mon, _type_i));
	    avg_defs[type_i] = {p: util.avg(mons_i.map(mon => parseInt(mon.def))), s: util.avg(mons_i.map(mon => parseInt(mon.sdef))), c: mons_i.length};
	    console.log(`Count of ${type_i}-type pokemon: ${mons_i.length}`);
	    pkmn_count_by_type[type_i] = mons_i.length;
	    all_types.push(type_i);
	    content += `,${type_i}`;
	    for(let j = i+1; j < util.types.length; j++) {
		const type_j = util.types[j];
		const _type_j = (util.types[j] === "psychict")?("psychic"):(util.types[j]);
		const type_ij = `${type_i}/${type_j}`;
		all_types.push(type_ij);
		const mons_ij = mons.filter(mon => get_mons.isTypes(mon, _type_i, _type_j));
		console.log(`Count of ${type_ij}-type pokemon: ${mons_ij.length}`);
		pkmn_count_by_type[type_ij] = mons_ij.length;
		content += `,${type_ij}`;
		if(mons_ij.length === 0) {
		    avg_defs[type_ij] = {p: -1, s: -1, c: 0};
		}
		else {
		    avg_defs[type_ij] = {p: util.avg(mons_ij.map(mon => parseInt(mon.def))), s: util.avg(mons_ij.map(mon => parseInt(mon.sdef))), c: mons_ij.length};
		}
	    }
	}
	const lines = [];
	const totalScores = [];
	console.log(pkmn_count_by_type);
	//console.log(avg_defs);
	//now, compute the expected effectiveness of each type on each other type
	//i, j for attacking type
	for(let i = 0; i < moves.length; i++) {
	    const mi = moves[i];
	    const ti = mi.type;
	    const _ti = (ti === "psychict")?("psychic"):(ti);
	    for(let j = i; j < moves.length; j++) {
		const mj = moves[j];
		const tj = mj.type;
		const _tj = (tj === "psychict")?("psychic"):(tj);
		const atk_type_str = (i === j)?(`${ti}`):(`${ti}/${tj}`);
		var totalScore = 0;
		const matchups = {};
		//k, l for defending type
		for(let k = 0; k < util.types.length; k++) {
		    const tk = util.types[k];
		    const _tk = (tk === "psychict")?("psychic"):(tk);
		    for(let l = k; l < util.types.length; l++) {
			const tl = util.types[l];
			const _tl = (tl === "psychict")?("psychic"):(tl);
			const def_type_str = (k === l)?(tk):(`${tk}/${tl}`);
			var off_score = 0;
			if(i === j) {
			    const e = single_type_graph[ti][tk].off * (k === l)?(1):(single_type_graph[ti][tl].off);
			    const off_score_i = e * (mi.physical * mi.physicalCount / avg_defs[def_type_str].p + mi.special * mi.specialCount / avg_defs[def_type_str].s)/(mi.physicalCount + mi.specialCount);
			    off_score = off_score_i * pkmn_count_by_type[def_type_str] / mons.length;
			}
			else {
			    const ei = single_type_graph[ti][tk].off * (k === l)?(1):(single_type_graph[ti][tl].off);
			    const ej = single_type_graph[tj][tk] * (k === l)?(1):(single_type_graph[tj][tl].off);
			    const off_score_i = ei * (mi.physical * mi.physicalCount / avg_defs[def_type_str].p + mi.special * mi.specialCount / avg_defs[def_type_str].s)/(mi.physicalCount + mi.specialCount);
			    const off_score_j = ej * (mj.physical * mj.physicalCount / avg_defs[def_type_str].p + mj.special * mj.specialCount / avg_defs[def_type_str].s)/(mj.physicalCount + mj.specialCount);
			    const off_score_ij = util.max(off_score_i, off_score_j);
			    off_score = off_score_ij * pkmn_count_by_type[def_type_str] / mons.length;
			}
			matchups[def_type_str] = off_score;
			totalScore += off_score;
		    }
		}
		var row = "";
		for(let k = 0; k < util.types.length; k++) {
		    const tk = util.types[k];
		    row += `,${matchups[tk]}`;
		    for(let l = k+1; l < util.types.length; l++) {
			const tl = util.types[l];
			const tkl_str = `${tk}/${tl}`;
			row += `,${matchups[tkl_str]}`;
		    }
		}
		lines.push(row);
		totalScores.push(totalScore);
	    }
	}
	const FACTOR = util.AVERAGE_SCORE / util.avg(totalScores);
	for(let i = 0; i < lines.length; i++) {
	    content += `\n${all_types[i]},${totalScores[i]*FACTOR}${lines[i]}`;
	}
	fs.writeFileSync(process.cwd() + "/" + outfile, content);
    });
});
