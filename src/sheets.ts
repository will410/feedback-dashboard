export const SHEET_ID = import.meta.env.VITE_GOOGLE_SHEET_ID;

// Types matching Dashboard.tsx
export type FeedbackItem = {
    Date: string;
    "Supplier Name": string;
    Label: string;
    "Sub Label": string;
    "Micro Label": string;
    Price: number;
    Message: string;
};

const HEADERS = ["Date", "Supplier Name", "Label", "Sub Label", "Micro Label", "Price", "Message"];

export const fetchSheetData = async (accessToken: string): Promise<FeedbackItem[]> => {
    if (!SHEET_ID) throw new Error("Missing Sheet ID");

    const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Sheet1!A:G`,
        {
            headers: { Authorization: `Bearer ${accessToken}` },
        }
    );

    if (!response.ok) {
        throw new Error(`Sheets API Error: ${response.statusText}`);
    }

    const data = await response.json();
    const rows = data.values;

    if (!rows || rows.length < 2) return []; // No data or just headers

    // Skip header row
    return rows.slice(1).map((row: string[]) => ({
        "Date": row[0] || "",
        "Supplier Name": row[1] || "",
        "Label": row[2] || "",
        "Sub Label": row[3] || "",
        "Micro Label": row[4] || "",
        "Price": parseFloat(row[5] || "0"),
        "Message": row[6] || ""
    }));
};

export const saveSheetData = async (accessToken: string, items: FeedbackItem[]) => {
    if (!SHEET_ID) throw new Error("Missing Sheet ID");

    // Convert to row arrays
    const rows = [
        HEADERS,
        ...items.map(item => [
            item.Date,
            item["Supplier Name"],
            item.Label,
            item["Sub Label"],
            item["Micro Label"],
            item.Price.toString(),
            item.Message
        ])
    ];

    const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Sheet1!A1?valueInputOption=USER_ENTERED`,
        {
            method: 'PUT',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ values: rows })
        }
    );

    if (!response.ok) {
        throw new Error(`Sheets API Save Error: ${response.statusText}`);
    }
};
