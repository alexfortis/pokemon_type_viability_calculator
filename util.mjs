export const types = ["bug", "dark", "dragon", "electric", "fairy", "fighting", "fire", "flying", "ghost", "grass", "ground", "ice", "normal", "poison", "psychict", "rock", "steel", "water"];

export function pad(num, digits) {
    var str = num.toString();
    while(str.length < digits) {
	str = "0" + str;
    }
    return str;
}

function addSuperEffective(graph, t1, t2) {
    graph[t1].double_offensive.push(t2);
    graph[t2].double_defensive.push(t1);
}

function addNotVeryEffective(graph, t1, t2) {
    graph[t1].half_offensive.push(t2);
    graph[t2].half_defensive.push(t1);
}

function addNoEffect(graph, t1, t2) {
    graph[t1].immune_offensive.push(t2);
    graph[t2].immune_defensive.push(t1);
}

function addBatchEffectiveness(graph, offensive_type, whichFunc, defensive_types) {
    for(const dt of defensive_types) {
	whichFunc(graph, offensive_type, dt);
    }
}

export function type_graph() {
    const graph = {};
    const super_e = addSuperEffective, notvery_e = addNotVeryEffective, no_e = addNoEffect;
    for(const type of types) {
	graph[type] = {
	    double_offensive: [],
	    double_defensive: [],
	    half_offensive: [],
	    half_defensive: [],
	    immune_offensive: [],
	    immune_defensive: []
	};
    }
    
    addBatchEffectiveness(graph, "normal", notvery_e, ["rock", "steel"]);
    addBatchEffectiveness(graph, "normal", no_e, ["ghost"]);

    addBatchEffectiveness(graph, "fighting", super_e, ["normal", "rock", "steel", "ice", "dark"]);
    addBatchEffectiveness(graph, "fighting", notvery_e, ["flying", "poison", "bug", "psychict", "fairy"]);
    addBatchEffectiveness(graph, "fighting", no_e, ["ghost"]);
    
    addBatchEffectiveness(graph, "flying", super_e, ["fighting", "bug", "grass"]);
    addBatchEffectiveness(graph, "flying", notvery_e, ["rock", "steel", "electric"]);

    addBatchEffectiveness(graph, "poison", super_e, ["grass", "fairy"]);
    addBatchEffectiveness(graph, "poison", notvery_e, ["poison", "ground", "rock", "ghost"]);
    addBatchEffectiveness(graph, "poison", no_e, ["steel"]);

    addBatchEffectiveness(graph, "ground", super_e, ["poison", "rock", "steel", "fire", "electric"]);
    addBatchEffectiveness(graph, "ground", notvery_e, ["bug", "grass"]);
    addBatchEffectiveness(graph, "ground", no_e, ["flying"]);

    addBatchEffectiveness(graph, "rock", super_e, ["flying", "bug", "fire", "ice"]);
    addBatchEffectiveness(graph, "rock", notvery_e, ["fighting", "ground", "steel"]);

    addBatchEffectiveness(graph, "bug", super_e, ["grass", "psychict", "dark"]);
    addBatchEffectiveness(graph, "bug", notvery_e, ["fighting", "flying", "poison", "ghost", "steel", "fire", "fairy"]);

    addBatchEffectiveness(graph, "ghost", super_e, ["ghost", "psychict"]);
    addBatchEffectiveness(graph, "ghost", notvery_e, ["dark"]);
    addBatchEffectiveness(graph, "ghost", no_e, ["normal"]);

    addBatchEffectiveness(graph, "steel", super_e, ["rock", "ice", "fairy"]);
    addBatchEffectiveness(graph, "steel", notvery_e, ["steel", "fire", "water", "electric"]);

    addBatchEffectiveness(graph, "fire", super_e, ["bug", "steel", "grass", "ice"]);
    addBatchEffectiveness(graph, "fire", notvery_e, ["rock", "fire", "water", "dragon"]);

    addBatchEffectiveness(graph, "water", super_e, ["ground", "rock", "fire"]);
    addBatchEffectiveness(graph, "water", notvery_e, ["water", "grass", "dragon"]);

    addBatchEffectiveness(graph, "grass", super_e, ["ground", "rock", "water"]);
    addBatchEffectiveness(graph, "grass", notvery_e, ["flying", "poison", "bug", "steel", "fire", "grass", "dragon"]);

    addBatchEffectiveness(graph, "electric", super_e, ["flying", "water"]);
    addBatchEffectiveness(graph, "electric", notvery_e, ["grass", "electric", "dragon"]);
    addBatchEffectiveness(graph, "electric", no_e, ["ground"]);

    addBatchEffectiveness(graph, "psychict", super_e, ["fighting", "poison"]);
    addBatchEffectiveness(graph, "psychict", notvery_e, ["steel", "psychict"]);
    addBatchEffectiveness(graph, "psychict", no_e, ["dark"]);

    addBatchEffectiveness(graph, "ice", super_e, ["flying", "ground", "grass", "dragon"]);
    addBatchEffectiveness(graph, "ice", notvery_e, ["steel", "fire", "water", "ice"]);

    addBatchEffectiveness(graph, "dragon", super_e, ["dragon"]);
    addBatchEffectiveness(graph, "dragon", notvery_e, ["steel"]);
    addBatchEffectiveness(graph, "dragon", no_e, ["fairy"]);

    addBatchEffectiveness(graph, "dark", super_e, ["ghost", "psychict"]);
    addBatchEffectiveness(graph, "dark", notvery_e, ["fighting", "dark", "fairy"]);

    addBatchEffectiveness(graph, "fairy", super_e, ["fighting", "dragon", "dark"]);
    addBatchEffectiveness(graph, "fairy", notvery_e, ["poison", "steel", "fire"]);

    return graph;
}

export default {types, pad, type_graph};
