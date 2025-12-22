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

export const fetchSheetData = async (accessToken: string, log?: (msg: string) => void): Promise<FeedbackItem[]> => {
    const logger = (msg: string) => log?.(msg);

    if (!SHEET_ID) {
        logger("Error: Missing VITE_GOOGLE_SHEET_ID");
        throw new Error("Missing Sheet ID");
    }

    logger(`Fetching data from Sheet ID: ${SHEET_ID.slice(0, 5)}...`);

    try {
        const response = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Sheet1!A:Z`,
            {
                headers: { Authorization: `Bearer ${accessToken}` },
            }
        );

        logger(`Response Status: ${response.status} ${response.statusText}`);

        if (!response.ok) {
            const errText = await response.text();
            logger(`Error Body: ${errText}`);
            throw new Error(`Sheets API Error: ${response.statusText}`);
        }

        const data = await response.json();
        const rows = data.values;

        if (!rows) {
            logger("No 'values' found in response.");
            return [];
        }

        logger(`Received ${rows.length} rows.`);

        if (rows.length < 2) {
            logger("Not enough rows to parse (need headers + data).");
            return [];
        }

        // Robust Header Mapping
        const headers = rows[0].map((h: string) => h.toLowerCase().trim());
        logger(`Headers detected: ${headers.join(", ")}`);

        // Helper to find column index with flexible matching
        const getIdx = (keys: string[]) => {
            const idx = headers.findIndex((h: string) => keys.some(k => h.includes(k.toLowerCase())));
            return idx;
        };

        const idxDate = getIdx(["date (utc)", "date", "feedback date"]);
        const idxSupplier = getIdx(["supplier name", "company"]);
        const idxLabel = getIdx(["label", "theme"]);
        const idxSub = getIdx(["sub label", "sub-label", "sub-theme"]);
        const idxMicro = getIdx(["micro label", "micro-label", "micro-theme"]);
        const idxPrice = getIdx(["subscription amount", "price", "amount", "value"]);
        const idxMsg = getIdx(["message", "feedback"]);
        const idxLink = getIdx(["message link", "link", "url", "hyperlink"]);

        logger(`Mapped Indices - Date:${idxDate}, Supplier:${idxSupplier}, Label:${idxLabel}`);

        // Skip header row
        const parsed = rows.slice(1).map((row: string[]) => {
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

        logger(`Successfully parsed ${parsed.length} items.`);
        return parsed;

    } catch (err: any) {
        logger(`Exception during fetch: ${err.message}`);
        throw err;
    }
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
