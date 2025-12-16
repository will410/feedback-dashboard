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
    link?: string;
};

const HEADERS = ["Date", "Supplier Name", "Label", "Sub Label", "Micro Label", "Price", "Message", "Link"];

export const fetchSheetData = async (accessToken: string): Promise<FeedbackItem[]> => {
    if (!SHEET_ID) throw new Error("Missing Sheet ID");

    const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Sheet1!A:Z`,
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

    // Robust Header Mapping
    const headers = rows[0].map((h: string) => h.toLowerCase().trim());

    // Helper to find column index with flexible matching
    const getIdx = (keys: string[]) => {
        const idx = headers.findIndex((h: string) => keys.some(k => h.includes(k.toLowerCase())));
        return idx;
    };

    const idxDate = getIdx(["Date"]);
    const idxSupplier = getIdx(["Supplier", "Company"]);
    const idxLabel = getIdx(["Label", "Theme"]);
    const idxSub = getIdx(["Sub", "Sub-Theme"]);
    const idxMicro = getIdx(["Micro", "Micro-Theme"]);
    const idxPrice = getIdx(["Price", "Amount", "Value"]);
    const idxMsg = getIdx(["Message", "Feedback"]);
    const idxLink = getIdx(["Link", "URL", "Hyperlink"]);

    // Skip header row
    return rows.slice(1).map((row: string[]) => {
        const val = (i: number) => (i !== -1 && row[i]) ? row[i] : "";

        return {
            "Date": val(idxDate),
            "Supplier Name": val(idxSupplier),
            "Label": val(idxLabel) || "Uncategorized",
            "Sub Label": val(idxSub) || "Uncategorized",
            "Micro Label": val(idxMicro) || "Uncategorized",
            "Price": parseFloat(val(idxPrice).replace(/[^0-9.-]+/g, "")) || 0,
            "Message": val(idxMsg),
            "link": val(idxLink)
        };
    });
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
            item.Message,
            item.link || ""
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
