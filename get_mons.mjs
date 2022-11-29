import {types, pad} from "./util.mjs";
import jsdom from "jsdom";
const JSDOM = jsdom.JSDOM;
const url = "https://www.serebii.net/pokemon/nationalpokedex.shtml";

export class MonData {
    constructor(num, name, t1, t2, hp, att, def, satt, sdef, spd) {
	this.num = num;
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
	return "#" + this.num + " " + this.name + " " + this.t1 +
	    ((this.t2)?("/" + this.t2):("")) + " " + this.hp + " " +
	    this.att + " " + this.def + " " + this.satt + " " +
	    this.sdef + " " + this.spd;
    }
}

export function isType(mon, type) {
    return mon.t1 === type || mon.t2 === type;
}

export function isTypes(mon, type1, type2) {
    return (mon.t1 === type1 && mon.t2 === type2) || (mon.t1 === type2 && mon.t2 === type1);
}

function parse_mon_data(table_row) {
    const cells = table_row.children;
    const monNum = parseInt(cells[0].innerHTML.trim().slice(1));
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
    return new MonData(monNum, monName, monTypes[0], monTypes[1], monHp, monAtt, monDef, monSatt, monSdef, monSpd);
}

function get_alt_forms(num, pkmn_name, doc, regForms) {
    const form_names_types = {};
    const form_names_stat_tables = {};
    var defaultTable;
    const tables = doc.window.document.getElementsByClassName("dextable");
    for(const table of tables) {
	const tds = table.getElementsByTagName("td");
	if(tds[4] && tds[4].innerHTML === "Type") {
	    const formsTable = table.getElementsByClassName("cen")[0].getElementsByTagName("table")[0];
	    if(formsTable) {
		const forms = Array.prototype.slice.call(formsTable.getElementsByTagName("tr"), 1);
		for(const form of forms) {
		    const cells = form.getElementsByTagName("td");
		    const formName = cells[0].innerHTML;
		    if(formName !== "Zen Mode") {
			const formTypes = Array.prototype.map.call(cells[1].children, a => a.getAttribute("href").slice(a.getAttribute("href").lastIndexOf("/")+1, -6));
			form_names_types[formName] = formTypes;
		    }
		}
	    }
	}
	else if(tds[0]) {
	    const h2 = tds[0].getElementsByTagName("h2")[0];
	    if(h2) {
		if(h2.innerHTML === "Stats") {
		    defaultTable = table;
		}
		else if(h2.innerHTML.startsWith("Stats")) {
		    for(const name in form_names_types) {
			if(h2.innerHTML.startsWith("Stats - " + name.replace("_", " ")) || h2.innerHTML === "Stats - Alternate Forms") {
			    if(!name in form_names_stat_tables) {
				form_names_stat_tables[name] = table;
			    }
			}
		    }
		}
	    }
	}
    }
    for(const name in form_names_types) {
	if(!(name in form_names_stat_tables)) {
	    form_names_stat_tables[name] = defaultTable;
	}
	const baseStats = Array.prototype.slice.call(form_names_stat_tables[name].getElementsByTagName("tr")[2].getElementsByTagName("td"), 1).map(x => x.innerHTML);
	const form_name = pkmn_name + "_-_" + name.replace(" ", "_");
	regForms[form_name] = new MonData(num, form_name, form_names_types[name][0], form_names_types[name][1], baseStats[0], baseStats[1], baseStats[2], baseStats[3], baseStats[4], baseStats[5]);
    }
}

export async function get_mons() {
    console.log("Fetching from " + url);
    const resp = await fetch(url);
    const html = await resp.text();
    const doc = new JSDOM(html);
    const table = doc.window.document.getElementsByClassName("dextable")[0];
    const rows = Array.prototype.slice.call(table.getElementsByTagName("tbody")[0].children, 2);
    const mons = rows.map(parse_mon_data);
    var regionalForms = {};
    //check the gen 7 and gen 8 pages for alternate forms
    for(const mon of mons) {
	console.log(`Fetching data for #${pad(mon.num, 3)} ${mon.name}`);
	//gen 7
	if(mon.num < 810) {
	    const gen7_url = "https://www.serebii.net/pokedex-sm/" + pad(mon.num, 3) + ".shtml";
	    //console.log(`Fetching gen 7 data for #${mon.num} ${mon.name} from ${gen7_url}`);
	    const gen7_resp = await fetch(gen7_url);
	    if(gen7_resp.status === 200) {
		const gen7_doc = new JSDOM(await gen7_resp.text());
		get_alt_forms(mon.num, mon.name, gen7_doc, regionalForms);
	    }
	}
	//gen 8
	const gen8_url = "https://www.serebii.net/pokedex-swsh/" + mon.name.toLowerCase();
	//console.log(`Fetching gen 8 data for #${mon.num} ${mon.name} from ${gen8_url}`);
	const gen8_resp = await fetch(gen8_url);
	if(gen8_resp.status === 200) {
	    const gen8_doc = new JSDOM(await gen8_resp.text());
	    get_alt_forms(mon.num, mon.name, gen8_doc, regionalForms);
	}
    }
    //and finally add the alternate forms to the list
    for(const formName in regionalForms) {
	mons.push(regionalForms[formName]);
    }
    mons.sort((a,b) => a.num - b.num);
    return mons;
}

get_mons().then(mons => {
    mons.forEach(mon => console.log(mon.toString()));
});
