import {types} from "./util.mjs";
import jsdom from "jsdom";
const JSDOM = jsdom.JSDOM;
const url = "https://www.serebii.net/pokemon/nationalpokedex.shtml";

export class MonData {
    constructor(name, t1, t2, hp, att, def, satt, sdef, spd) {
	this.name = name;
	this.t1 = t1;
	this.t2 = t2;
	this.hp = hp;
	this.att = att;
	this.def = def;
	this.satt = satt;
	this.sdef = sdef;
	this.spd = spd;
    }
    toString() {
	return this.name + " " + this.t1 +
	    ((this.t2)?("/" + this.t2):("")) + " " + this.hp + " " +
	    this.att + " " + this.def + " " + this.satt + " " +
	    this.sdef + " " + this.spd;
    }
}

export function isType(mon, type) {
    return mon.t1 === type || mon.t2 === type;
}

function parse_mon_data(table_row) {
    const cells = table_row.children;
    const monName = cells[2].getElementsByTagName("a")[0].innerHTML;
    const monTypes = Array.prototype.map.call(cells[3].getElementsByTagName("a"), (a) => {
	if(a) {
	    return a.getAttribute("href").slice(14);
	}
	else return undefined;
    });
    const monHp = cells[5].innerHTML;
    const monAtt = cells[6].innerHTML;
    const monDef = cells[7].innerHTML;
    const monSatt = cells[8].innerHTML;
    const monSdef = cells[9].innerHTML;
    const monSpd = cells[10].innerHTML;
    return new MonData(monName, monTypes[0], monTypes[1], monHp, monAtt, monDef, monSatt, monSdef, monSpd);
}

export async function get_mons() {
    console.log("Fetching from " + url);
    const resp = await fetch(url);
    const html = await resp.text();
    const doc = new JSDOM(html);
    const table = doc.window.document.getElementsByClassName("dextable")[0];
    const rows = Array.prototype.slice.call(table.getElementsByTagName("tbody")[0].children, 2);
    const mons = rows.map(parse_mon_data);
    return mons;
}

/*get_mons().then(mons => {
    console.log(mons);
});
*/
