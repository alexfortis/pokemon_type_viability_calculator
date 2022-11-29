export const types = ["bug", "dark", "dragon", "electric", "fairy", "fighting", "fire", "flying", "ghost", "grass", "ground", "ice", "normal", "poison", "psychict", "rock", "steel", "water"];

export function pad(num, digits) {
    var str = num.toString();
    while(str.length < digits) {
	str = "0" + str;
    }
    return str;
}

export function type_graph() {
    
}

export default {types, pad, type_graph};
