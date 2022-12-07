import util from "./util.mjs";
import fs from "fs";
import jsdom from "jsdom";
const JSDOM = jsdom.JSDOM;

const url = "https://www.serebii.net/pokemon/nationalpokedex.shtml";
const dexfile = "pokedex.txt"

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
	return this.num + " " + this.name + " " + this.t1 +
	    ((this.t2)?("/" + this.t2):("")) + " " + this.hp + " " +
	    this.att + " " + this.def + " " + this.satt + " " +
	    this.sdef + " " + this.spd;
    }
}

function compareMonNums(m1, m2) {
    if(0 < m1.num && 0 < m2.num) {
	return m1.num - m2.num;
    }
    else if(0 < m1.num) {
	return -1;
    }
    else if(0 < m2.num) {
	return 1;
    }
    else {
	return (m1.name < m2.name)?(-1):((m2.name < m1.name)?(1):(0));
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
    let num = cells[0].innerHTML.trim().slice(1);
    const monNum = (num === "???")?(-1):(parseInt(num));
    const monName = cells[2].getElementsByTagName("a")[0].innerHTML.replace(" ", "_");
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

async function scrape_alt_forms(serebii_url, altForms) {
    console.log(`Fetching alternate forms from ${serebii_url}`);
    const resp = await fetch(serebii_url);
    if(resp.status === 200) {
	//process the document
	const doc = new JSDOM(await resp.text());
	const h1 = doc.window.document.getElementsByTagName("h1")[0].innerHTML.trim().slice(7);
	let tempNum = h1.split(" ")[0];
	const monNum = (tempNum === "???")?(-1):(parseInt(tempNum));
	const monName = h1.split(" ")[1];
	const tables = doc.window.document.getElementsByClassName("dextable");
	const statTables = Array.prototype.filter.call(tables, table => {
	    const h2 = table.getElementsByTagName("h2")[0];
	    if(h2) {
		return h2.innerHTML.startsWith("Stats");
	    }
	    return false;
	});
	var defaultTable = null, defaultAltTable = null;
	const formsWithTables = {};
	for(const table of statTables) {
	    const h2_txt = table.getElementsByTagName("h2")[0].innerHTML;
	    if(h2_txt === "Stats") {
		defaultTable = table;
	    }
	    else if(h2_txt === "Stats - Alternate Forms") {
		defaultAltTable = table;
	    }
	    else {
		formsWithTables[h2_txt.slice(8)] = table;
	    }
	}
	const getMonFromTable = (modifiedName, table, t1, t2) => {
	    const stats = Array.prototype.slice.call(table.getElementsByTagName("tr")[2].getElementsByTagName("td"), 1).map(x => parseInt(x.innerHTML));
	    const realNum = (monNum === "???")?(-1):(parseInt(monNum));
	    return new MonData(realNum, modifiedName, t1, t2, stats[0], stats[1], stats[2], stats[3], stats[4], stats[5]);
	};
	//Some Pokemon have hard-to-parse pages, so special cases for them
	//Darmanitan
	if(monName === "Darmanitan") {
	    //normal is already in the dex
	    //normal zen mode
	    const zenTable = formsWithTables["Zen Mode"];
	    altForms["Zen Mode"] = getMonFromTable(monName + "_-_Zen_Mode", zenTable, "fire", "psychic");
	    //are we doing gen 8?
	    if(serebii_url.includes("swsh")) {
		//Galarian form
		const galarTable = formsWithTables["Galarian Darmanitan"];
		altForms["Galarian"] = getMonFromTable(monName + "_-_Galarian", galarTable, "ice", undefined);
		//Galarian zen mode
		const gzTable = formsWithTables["Galarian Darmanitan Zen Mode"];
		altForms["Galarian Zen Mode"] = getMonFromTable(monName + "_-_Galarian_Zen_Mode", gzTable, "ice", "fire");
	    }
	    //don't need to check gen 9 because it'll be a 404
	}
	//Some Pokemon have multiple forms of the same type, so need to account for those.
	//Wishiwashi
	else if(monName === "Wishiwashi") {
	    //normal is already present
	    //school form
	    const schoolingTable = formsWithTables["School Form"];
	    altForms["School Form"] = getMonFromTable(monName + "_-_School", schoolingTable, "water");
	}
	//Palafin
	else if(monName === "Palafin") {
	    const heroTable = formsWithTables["Hero Form"];
	    altForms["Hero Form"] = getMonFromTable(monName + "_-_Hero", heroTable, "water");
	}
	//Deoxys
	else if(monName === "Deoxys") {
	    //normal forme is already there
	    //attack forme
	    const attackTable = formsWithTables["Attack Forme"];
	    altForms["Attack Forme"] = getMonFromTable(monName + "_-_Attack", attackTable, "psychic");
	    //defense forme
	    const defenseTable = formsWithTables["Defense Forme"];
	    altForms["Defense Forme"] = getMonFromTable(monName + "_-_Defense", defenseTable, "psychic");
	    //speed forme
	    let temp_speedTable = formsWithTables["Speed Forme"];
	    //serebii has a typo on the Sword/Shield dex, so I have to account for that
	    const speedTable = temp_speedTable ? temp_speedTable : formsWithTables["Speeed Forme"];
	    altForms["Speed Forme"] = getMonFromTable(monName + "_-_Speed", speedTable, "psychic");
	}
	//Tornadus, Thundurus, Landorus, Enamorus
	else if(monName === "Tornadus" || monName === "Thundurus" || monName === "Landorus" || monName === "Enamorus") {
	    //normal forme is already there
	    //therian forme
	    const types = {
		"Tornadus": ["flying"],
		"Thundurus": ["electric", "flying"],
		"Landorus": ["ground", "flying"],
		"Enamorus": ["fairy", "flying"]
	    };
	    const therianTable = formsWithTables["Therian Forme"];
	    altForms["Therian Forme"] = getMonFromTable(monName + "_-_Therian", therianTable, types[monName][0], types[monName][1]);
	}
	//Kyurem
	else if(monName === "Kyurem") {
	    //normal is already there
	    //black kyurem
	    const blackTable = formsWithTables["Black Kyurem"];
	    altForms["Black Kyurem"] = getMonFromTable(monName + "_-_Black", blackTable, "dragon", "ice");
	    //white kyurem
	    const whiteTable = formsWithTables["White Kyurem"];
	    altForms["White Kyurem"] = getMonFromTable(monName + "_-_White", whiteTable, "dragon", "ice");
	}
	//Greninja
	else if(monName === "Greninja") {
	    //ash-greninja
	    const ashTable = formsWithTables["Ash-Greninja"];
	    //does not exist in gen 9
	    if(ashTable) altForms["Ash-Greninja"] = getMonFromTable(monName + "_-_Ash", ashTable, "water", "dark");
	}
	//Aegislash
	else if(monName === "Aegislash") {
	    //shield form is already there, so only need blade here
	    const bladeTable = formsWithTables["Blade Forme"];
	    altForms["Blade Forme"] = getMonFromTable(monName + "_-_Blade", bladeTable, "steel", "ghost");
	}
	//Pumpkaboo, Gourgeist
	else if(monName === "Pumpkaboo" || monName === "Gourgeist") {
	    //average size is already there
	    //small size
	    const smallTable = formsWithTables["Small Size"];
	    altForms["Small Size"] = getMonFromTable(monName + "_-_Small", smallTable, "ghost", "grass");
	    //large size
	    const largeTable = formsWithTables["Large Size"];
	    altForms["Large Size"] = getMonFromTable(monName + "_-_Large", largeTable, "ghost", "grass");
	    //super size
	    const superTable = formsWithTables["Super Size"];
	    altForms["Super Size"] = getMonFromTable(monName + "_-_Super", superTable, "ghost", "grass");
	}
	//Zygarde
	else if(monName === "Zygarde") {
	    //50% form is already there
	    //10%
	    const tenTable = formsWithTables["10% Forme"];
	    altForms["10% Forme"] = getMonFromTable(monName + "_-_10", tenTable, "dragon", "ground");
	    //complete
	    const completeTable = formsWithTables["Complete Forme"];
	    altForms["Complete Forme"] = getMonFromTable(monName + "_-_Complete", completeTable, "dragon", "ground");
	}
	//Lycanroc
	else if(monName === "Lycanroc") {
	    //day form is already there
	    //midnight
	    const midnightTable = formsWithTables["Midnight Form"];
	    altForms["Midnight Form"] = getMonFromTable(monName + "_-_Midnight", midnightTable, "rock");
	    //dusk
	    const duskTable = formsWithTables["Dusk Form"];
	    altForms["Dusk Form"] = getMonFromTable(monName + "_-_Dusk", duskTable, "rock");
	}
	//Minior
	else if(monName === "Minior") {
	    //regular form is there, so only need cores
	    const coresTable = formsWithTables["Cores"];
	    altForms["Cores"] = getMonFromTable(monName + "_-_Cores", coresTable, "rock", "flying");
	}
	//Eiscue
	else if(monName === "Eiscue") {
	    const noIceTable = formsWithTables["NoIce Form"];
	    //NoIce form is called Noice Face in gen 9, but it's the same, so don't double count it
	    if(noIceTable) altForms["NoIce Form"] = getMonFromTable(monName + "_-_NoIce", noIceTable, "ice");
	}
	//Gimmighoul
	else if(monName === "Gimmighoul") {
	    //only need roaming form
	    const roamingTable = formsWithTables["Roaming Form"];
	    altForms["Roaming Form"] = getMonFromTable(monName + "_-_Roaming", roamingTable, "ghost");
	}
	//Giratina
	else if(monName === "Giratina") {
	    //only need origin forme
	    const originTable = formsWithTables["Origin Forme"];
	    altForms["Origin Forme"] = getMonFromTable(monName + "_-_Origin", originTable, "ghost", "dragon");
	}
	//The rest can be done using the type table
	else {
	    const form_names_types = {};
	    var typesTable = null;
	    for(const table of tables) {
		const tds = table.getElementsByTagName("td");
		if(tds[4] && tds[4].innerHTML === "Type") {
		    typesTable = table.getElementsByClassName("cen")[0].getElementsByTagName("table")[0];
		    break;
		}
	    }
	    //get the data from the stats tables in an easier-to-use format
	    const statsAsObjs = statTables.map(table => {
		const tds = table.getElementsByTagName("td");
		const h2 = tds[0].getElementsByTagName("h2")[0];
		const baseStats = Array.prototype.slice.call(table.getElementsByTagName("tr")[2].getElementsByTagName("td"), 1).map(x => parseInt(x.innerHTML));
		const objData = {
		    title: h2.innerHTML,
		    hp: baseStats[0],
		    atk: baseStats[1],
		    def: baseStats[2],
		    satk: baseStats[3],
		    sdef: baseStats[4],
		    spe: baseStats[5]
		};
		return objData;
	    });
	    //get the types of the different forms
	    if(typesTable) {
		const forms = Array.prototype.slice.call(typesTable.getElementsByTagName("tr"), 1);
		for(const form of forms) {
		    const cells = form.getElementsByTagName("td");
		    const formName = cells[0].innerHTML;
		    const formTypes = Array.prototype.map.call(cells[1].children, a => a.getAttribute("href").slice(a.getAttribute("href").lastIndexOf("/")+1, -6));
		    form_names_types[formName] = formTypes;
		}
	    }
	    //get the stats for each form
	    for(const name in form_names_types) {
		const form_name = monName + "_-_" + name.replace(" ", "_");
		//which table to use?
		var table = null;
		for(const statline of statsAsObjs) {
		    if(statline.title.startsWith(`Stats - ${name}`) || statline.title.startsWith(`Stats - ${monName} ${name}`)) {
			table = statline;
		    }
		    else if(!table && statline.title === "Stats - Alternate Forms") {
			table = statline;
		    }
		}
		if(!table) {
		    table = statsAsObjs.filter(x => x.title === "Stats")[0];
		}
		//get the types
		const t1 = form_names_types[name][0], t2 = form_names_types[name][1];
		//add the alternate form to the map altForms
		altForms[form_name] = new MonData(monNum, form_name, t1, t2, table.hp, table.atk, table.def, table.satk, table.sdef, table.spe);
	    }
	}
    }
    else if(resp.status === 404) {
	//return gracefully without doing anything
    }
    else {
	console.log(`Error retrieving data from ${serebii_url}`);
    }
}

async function scrape_mons() {
    console.log(`Fetching from ${url}`);
    const resp = await fetch(url);
    const html = await resp.text();
    const doc = new JSDOM(html);
    const table = doc.window.document.getElementsByClassName("dextable")[0];
    const rows = Array.prototype.slice.call(table.getElementsByTagName("tbody")[0].children, 2);
    const mons = rows.map(parse_mon_data);
    console.log("Need to wait a bit to avoid getting refused by the server");
    await util.wait(10000);
    console.log("I think that's enough waiting; time to get alternate forms now");
    const allAltForms = [];
    for(const mon of mons) {
	const alternateForms = {};
	//gen 7
	if(0 < mon.num && mon.num < 810) {
	    const gen7_url = "https://www.serebii.net/pokedex-sm/" + util.pad(mon.num, 3) + ".shtml";
	    await scrape_alt_forms(gen7_url, alternateForms);
	}
	//gen 8
	if(0 < mon.num && mon.num < 906) {
	    const gen8_url = "https://www.serebii.net/pokedex-swsh/" + mon.name.toLowerCase().replace("_","");
	    await scrape_alt_forms(gen8_url, alternateForms);
	}
	//gen 9
	const gen9_url = "https://www.serebii.net/pokedex-sv/" + mon.name.toLowerCase().replace("_", "");
	await scrape_alt_forms(gen9_url, alternateForms);
	for(const altform in alternateForms) {
	    allAltForms.push(alternateForms[altform]);
	}
    }
    for(const altform of allAltForms) {
	mons.push(altform);
    }
    mons.sort(compareMonNums);
    const content = mons.reduce((acc, cur) => `${acc}\n${cur.toString()}`, "Name HP ATK DEF SATK SDEF SPE");
    fs.writeFileSync(process.cwd() + "/" + dexfile, content);
    return mons;
}

export async function get_mons() {
    const exists = fs.existsSync(dexfile);
    if(exists) {
	console.log("Dex has been scraped");
	const data = fs.readFileSync(dexfile, "utf8");
	const lines = data.split("\n");
	const mons = [];
	for(let i = 1; i < lines.length; i++) {
	    const stats = lines[i].split(" ");
	    const num = parseInt(stats[0]),
		  name = stats[1],
		  types = stats[2].split("/"),
		  baseStats = stats.slice(3).map(x => parseInt(x));
	    const mon = new MonData(num, name, types[0], types[1], ...baseStats);
	    mons.push(mon);
	}
	return mons;
    }
    else {
	console.log("Dex needs to be scraped");
	return await scrape_mons();
    }
}

export default {MonData, isType, isTypes, get_mons};

//for testing only
/*
get_mons().then(mons => {
    for(const mon of mons) {
	console.log(mon.toString());
    }
});*/
