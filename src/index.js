const puppeteer = require('puppeteer');
const writeRowsToSheet = require('./writeRowsToSheet');

// Designed to be run in the console at https://webpoint.usarugby.org/wp/Contacts/ClubMembers.frm

function fetchState(rugbyClubState) {
    const stateSelectElement = document.querySelector('#CompanyState');
    console.log(stateSelectElement, rugbyClubState);
    stateSelectElement.value = rugbyClubState; /* Change this if club is in different state */
    console.log('success change state')
    stateSelectElement.onchange();
}

function fetchClub(rugbyClubId) {
    const clubSelectElement = document.querySelector('#mbr_OtherOrgID_');
    clubSelectElement.value = rugbyClubId; /* Change this to the usarugby id of your club */
    console.log('success change club')
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
    await page.goto('https://webpoint.usarugby.org/wp/Contacts/ClubMembers.frm', {
        timeout: 60000
    });
    await page.evaluate(fetchState, process.env.RUGBY_CLUB_STATE);
    await page.waitForSelector('#mbr_OtherOrgID_');
    await page.evaluate(fetchClub, process.env.RUGBY_CLUB_ID);
    await page.waitForSelector('.rowon');
    const rows = await page.evaluate(parseTableIntoRows);
    console.log('parsed rows');
    await writeRowsToSheet(rows);
    browser.close();
}

main();
