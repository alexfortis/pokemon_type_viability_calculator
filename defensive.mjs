import {MoveCount, get_move_data} from "./get_moves.mjs";
import util from "./util.mjs";
import get_mons from "./get_mons.mjs";
import fs from "fs";

const outfile = "defensive_scores.csv";

Promise.all(util.types.map(get_move_data)).then((moves) => {
    const single_type_graph = util.type_adjlist();
    get_mons.get_mons().then((mons) => {
	const avg_phys_atk = util.avg(mons.map(mon => mon.att)),
	      avg_spec_atk = util.avg(mons.map(mon => mon.satt));
	const avg_atks = {};
	//get the average physical and special attack stats for each type
	//also start the content buffer
	var content = "type,norm_def_score,raw_def_score";
	for(let i = 0; i < util.types.length; i++) {
	    const ti = util.types[i];
	    const mons_ti = mons.filter(mon => get_mons.isTypes(mon, ti));
	    avg_atks[ti] = {
		count: mons_ti.length,
		physical: (mons_ti.length > 0)?(util.avg(mons_ti.map(mon => mon.att))):(0),
		special: (mons_ti.length > 0)?(util.avg(mons_ti.map(mon => mon.satt))):(0)
	    }
	    content += `,${ti}`
	    for(let j = i+1; j < util.types.length; j++) {
		const tj = util.types[j];
		const tij = `${ti}/${tj}`;
		const mons_tij = mons.filter(mon => get_mons.isTypes(mon, ti, tj));
		avg_atks[tij] = {
		    count: mons_tij.length,
		    physical: (mons_tij.length > 0)?(util.avg(mons_ti.map(mon => mon.att))):(0),
		    special: (mons_tij.length > 0)?(util.avg(mons_ti.map(mon => mon.satt))):(0)
		};
		content += `,${tij}`;
	    }
	}
	//store all matchups for later use
	const allMatchups = {};
	const totalScores = [];
	//i, j for the defending type
	for(let i = 0; i < util.types.length; i++) {
	    const ti = util.types[i];
	    for(let j = i; j < util.types.length; j++) {
		const tj = util.types[j];
		const def_type_str = (i === j)?(ti):(`${ti}/${tj}`);
		const matchups = {};
		var totalScore = 0;
		//k, l for the attacking type
		for(let k = 0; k < moves.length; k++) {
		    const mk = moves[k];
		    for(let l = k; l < moves.length; l++) {
			const ml = moves[l];
			const off_type_str = (k === l)?(mk.type):(`${mk.type}/${ml.type}`);
			if(avg_atks[off_type_str].count > 0) {
			    var def_score = 0;
			    //monotype mk.type
			    if(k === l) {
				const e = single_type_graph[ti][mk.type].def * ((i === j)?(1):(single_type_graph[tj][mk.type].def));
				const def_score_k = e * (mk.physical * avg_atks[off_type_str].physical/avg_phys_atk * mk.physicalCount + mk.special * avg_atks[off_type_str].special/avg_spec_atk * mk.specialCount) / (mk.physicalCount + mk.specialCount);
				def_score = def_score_k * avg_atks[off_type_str].count / mons.length;
			    }
			    //type mk.type, ml.type
			    else {
				const ek = single_type_graph[ti][mk.type].def * ((i === j)?(1):(single_type_graph[tj][mk.type].def)),
				      el = single_type_graph[ti][ml.type].def * ((i === j)?(1):(single_type_graph[tj][ml.type].def));
				const def_score_k = ek * (mk.physical * avg_atks[off_type_str].physical/avg_phys_atk * mk.physicalCount + mk.special * avg_atks[off_type_str].special/avg_spec_atk * mk.specialCount) / (mk.physicalCount + mk.specialCount),
				      def_score_l = el * (ml.physical * avg_atks[off_type_str].physical/avg_phys_atk * ml.physicalCount + ml.special * avg_atks[off_type_str].special/avg_spec_atk * ml.specialCount) / (ml.physicalCount + ml.specialCount);
				def_score = util.max(def_score_k, def_score_l) * avg_atks[off_type_str].count / mons.length;
			    }
			    matchups[off_type_str] = def_score;
			    totalScore += def_score;
			}
			else {
			    matchups[off_type_str] = 0;
			}
		    }
		}
		totalScores.push(totalScore);
		allMatchups[def_type_str] = {totalScore, matchups};
	    }
	}
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
