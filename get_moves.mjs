import jsdom from "jsdom";
const JSDOM = jsdom.JSDOM;
import {types} from "./util.mjs";

export class MoveCount {
    constructor(typeIn, physIn, specIn, physCountIn, specCountIn) {
	this.type = typeIn;
	this.physical = physIn;
	this.special = specIn;
	this.physicalCount = physCountIn;
	this.specialCount = specCountIn;
    }
}

export async function get_move_data(type)
{
    var physicalSum = 0, physicalCount = 0, specialSum = 0, specialCount = 0;
    const url = `https://www.serebii.net/attackdex-swsh/${type}.shtml`;
    console.log("Fetching from " + url);
    const resp = await fetch(url);
    const html = await resp.text();
    const doc = new JSDOM(html);
    const tables = doc.window.document.getElementsByClassName("dextable");
    const table = tables[0];
    const rows = Array.prototype.slice.call(table.getElementsByTagName("tbody")[0].children, 1);
    for(const row of rows) {
	const cells = row.getElementsByTagName("td");
	const attackName = cells[0].getElementsByTagName("a")[0].innerHTML.replace(" ", "_");
	const category = cells[2].getElementsByTagName("img")[0].getAttribute("src").slice(17, -4);
	if(category !== "other") {
	    const power = cells[4].innerHTML.trim();
	    if(power !== "--") {
		const accuracy = cells[5].innerHTML.trim();
		const effectiveness = parseInt(power) * parseInt(accuracy) / 100.0;
		if(category === "physical") {
		    physicalSum += effectiveness;
		    physicalCount++;
		}
		else {
		    specialSum += effectiveness;
		    specialCount++;
		}
	    }
	}
    }
    return new MoveCount(type, physicalSum / physicalCount, specialSum / specialCount, physicalCount, specialCount);
}
