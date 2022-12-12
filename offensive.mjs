import {MoveCount, get_move_data} from "./get_moves.mjs";
import util from "./util.mjs";
import get_mons from "./get_mons.mjs";
import fs from "fs";

const outfile = "offensive_scores.csv";

Promise.all(util.types.map(get_move_data)).then((moves) => {
    const single_type_graph = util.type_adjlist();
    get_mons.get_mons().then(mons => {
	//start the content buffer to be written to outfile
	var content = "type,norm_off_score,raw_off_score";
	//get the average physical and special defense stats for all mons
	const avg_phys_def = util.avg(mons.map(mon => mon.def)),
	      avg_spec_def = util.avg(mons.map(mon => mon.sdef));
	//get the average physical and special defense stats for each type
	const avg_defs = {};
	for(let i = 0; i < util.types.length; i++) {
	    const ti = util.types[i];
	    const mons_i = mons.filter(mon => get_mons.isTypes(mon, ti));
	    avg_defs[ti] = {
		count: mons_i.length,
		physical: util.avg(mons_i.map(mon => mon.def)),
		special: util.avg(mons_i.map(mon => mon.sdef))
	    };
	    content += `,${ti}`;
	    for(let j = i+1; j < util.types.length; j++) {
		const tj = util.types[j];
		const tij = `${ti}/${tj}`;
		const mons_ij = mons.filter(mon => get_mons.isTypes(mon, ti, tj));
		if(mons_ij.length === 0) {
		    avg_defs[tij] = {count: 0, physical: 0, special: 0};
		}
		else {
		    avg_defs[tij] = {
			count: mons_ij.length,
			physical: util.avg(mons_ij.map(mon => mon.def)),
			special: util.avg(mons_ij.map(mon => mon.sdef))
		    };
		}
		content += `,${tij}`;
	    }
	}
	//score all matchups for later use
	const allMatchups = {};
	const totalScores = [];
	//i, j for the attacking type
	for(let i = 0; i < moves.length; i++) {
	    const mi = moves[i];
	    const ti = mi.type;
	    for(let j = i; j < moves.length; j++) {
		const mj = moves[j];
		const tj = mj.type;
		const off_type_str = (i === j)?(ti):(`${ti}/${tj}`);
		var totalScore = 0;
		const matchups = {};
		//k, l for the defending type
		for(let k = 0; k < util.types.length; k++) {
		    const tk = util.types[k];
		    for(let l = k; l < util.types.length; l++) {
			const tl = util.types[l];
			const def_type_str = (k === l)?(tk):(`${tk}/${tl}`);
			var off_score = 0;
			if(i === j) {
			    const ei = single_type_graph[ti][tk].off * ((k === l)?(1):(single_type_graph[ti][tl].off));
			    const off_score_i = ei * (mi.physicalCount * mi.physical * avg_defs[def_type_str].physical/avg_phys_def + mi.specialCount * mi.special * avg_defs[def_type_str].special/avg_spec_def) / (mi.physicalCount + mi.specialCount);
			    off_score = off_score_i * avg_defs[def_type_str].count/mons.length;
			}
			else {
			    const ei = single_type_graph[ti][tk].off * ((k === l)?(1):(single_type_graph[ti][tl].off)),
				  ej = single_type_graph[tj][tk].off * ((k === l)?(1):(single_type_graph[tj][tl].off));
			    const off_score_i = ei * (mi.physicalCount * mi.physical * avg_defs[def_type_str].physical/avg_phys_def + mi.specialCount * mi.special * avg_defs[def_type_str].special/avg_spec_def) / (mi.physicalCount + mi.specialCount),
				  off_score_j = ej * (mj.physicalCount * mj.physical * avg_defs[def_type_str].physical/avg_phys_def + mj.specialCount * mj.special * avg_defs[def_type_str].special/avg_spec_def) / (mj.physicalCount + mj.specialCount);
			    off_score = util.max(off_score_i, off_score_j) * avg_defs[def_type_str].count/mons.length;
			}
			matchups[def_type_str] = off_score;
			totalScore += off_score;
		    }
		}
		totalScores.push(totalScore);
		allMatchups[off_type_str] = {totalScore, matchups};
	    }
	}
	console.log(allMatchups);
	const FACTOR = util.AVERAGE_SCORE / util.avg(totalScores);
	for(const type in allMatchups) {
	    content += `\n${type},${allMatchups[type].totalScore*FACTOR},${allMatchups[type].totalScore}`;
	    for(const matchup in allMatchups[type].matchups) {
		content += `,${allMatchups[type].matchups[matchup]}`;
	    }
	}
	fs.writeFileSync(process.cwd() + "/" + outfile, content);
    });
});
