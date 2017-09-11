const puppeteer = require('puppeteer');
const writeRowsToSheet = require('./writeRowsToSheet');

// Designed to be run in the console at https://webpoint.usarugby.org/wp/Contacts/ClubMembers.frm

function fetchWAState() {
    const stateSelectElement = document.querySelector('#CompanyState');
    stateSelectElement.value = 'WA'; /* Change this if club is in different state */
    stateSelectElement.onchange();
}

function fetchQuakeClub() {
    const clubSelectElement = document.querySelector('#mbr_OtherOrgID_');
    clubSelectElement.value = '56773'; /* Change this to the usarugby id of your club */
    clubSelectElement.onchange();
}

function parseTableIntoRows() {
    const allRows = [...document.querySelectorAll('.rowon'), ...document.querySelectorAll('.rowoff')];
    return allRows.map(row => {
        const [image, memberId, name, ...otherFields] = Array.from(row.querySelectorAll('td'));
        return [memberId.textContent, name.textContent];
    })
    .filter((row, index, rows) => rows.findIndex(([memberId]) => memberId === row[0]) === index); // finds first unique row per membership id
}

async function main() {
    const browser = await puppeteer.launch({headless: false});
    const page = await browser.newPage();
    await page.goto('https://webpoint.usarugby.org/wp/Contacts/ClubMembers.frm');
    await page.evaluate(fetchWAState);
    await page.waitForSelector('#mbr_OtherOrgID_');
    await page.evaluate(fetchQuakeClub);
    await page.waitForSelector('.rowon');
    const rows = await page.evaluate(parseTableIntoRows);
    await writeRowsToSheet(rows);
    browser.close();
}

main();
