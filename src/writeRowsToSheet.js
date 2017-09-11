const path = require('path');

const google = require('googleapis');
const Q = require('q');

const sheets = google.sheets('v4');

function getAuthorizedJwtClient() {
    const key = require(path.join(process.env.HOME, 'key.json'));
    const jwtClient = new google.auth.JWT(
      key.client_email,
      null,
      key.private_key,
      ['https://www.googleapis.com/auth/spreadsheets'], // an array of auth scopes
      null
    );
    return Q.ninvoke(jwtClient, 'authorize').then(() => jwtClient);
}

function getSheetId(client, spreadsheetId, sheetName) {
    return Q.nfcall(sheets.spreadsheets.get, {
        auth: client,
        spreadsheetId,
    })
    .then(spreadsheets => spreadsheets[0].sheets.find(sheet => sheet.properties.title === sheetName))
    .then(sheet => sheet.properties.sheetId);
}

function clearSheet(client, spreadsheetId, sheetName) {
    return Q.nfcall(sheets.spreadsheets.values.clear, {
        auth: client,
        spreadsheetId,
        range: `${sheetName}!A:B`,
    });
}

function pasteRows(client, spreadsheetId, sheetId, rows) {
    if (rows.length === 0 || rows[0].length === 0) {
        throw new Error('Not enough rows returned from USA Rugby');
    }
    const data = rows.reduce((accum, row) => {
        return `${row[0]},${row[1]}\n${accum}`;
    }, '');
    return Q.nfcall(sheets.spreadsheets.batchUpdate, {
        auth: client,
        spreadsheetId,
        resource: {
            requests: [
                {
                    pasteData: {
                        coordinate: {
                            columnIndex: 0,
                            rowIndex: 0,
                            sheetId,
                        },
                        delimiter: ',',
                        type: 'PASTE_VALUES',
                        data,
                    },
                },
            ],
        },
    });
}

async function writeRowsToSheets(rows) {
    const spreadsheetId = '1YEFEE-EVMEKjcUW2HzTL2lq-SGHLIs4F9PTV2PWpGq4';
    const sheetName = 'CIPP';
    const client = await getAuthorizedJwtClient();
    const sheetId = await getSheetId(client, spreadsheetId, sheetName);
    await clearSheet(client, spreadsheetId, sheetName);
    await pasteRows(client, spreadsheetId, sheetId, rows);
}

module.exports = writeRowsToSheets;
