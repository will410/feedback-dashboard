import React, { useState, useMemo, useEffect } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line, Cell
} from 'recharts';
import {
    ArrowLeft, Filter, DollarSign, MessageSquare,
    Users, ChevronRight, Calendar, LayoutDashboard,
    ChevronLeft, AlertCircle, LogOut, Download, ExternalLink
} from 'lucide-react';

// --- Types ---
type FeedbackItem = {
    Date: string;
    "Supplier Name": string;
    Label: string;
    "Sub Label": string;
    "Micro Label": string;
    Price: number;
    Message: string;
    link?: string;
};

// --- Embedded Initial Data (Top 150 Recent Items) ---
const INITIAL_DATA: FeedbackItem[] = [
    { "Date": "2025-11-07", "Supplier Name": "Longman's Cheese", "Label": "Picking & Warehouse", "Sub Label": "Picking Slips", "Micro Label": "Customer code", "Price": 0.0, "Message": "They are really keen to have the customer codes added to the invoices, so when a customer rings them for a query they can ask for the code to locate the account and save any potential issues.", link: "" },
    { "Date": "2025-11-07", "Supplier Name": "First Choice", "Label": "Uncategorized", "Sub Label": "Uncategorized", "Micro Label": "Uncategorized", "Price": 0.0, "Message": "Supplier: First Choice\nType: Goods In Process\nPriority: Medium\nComment:", link: "" },
    { "Date": "2025-11-07", "Supplier Name": "Imran Brothers", "Label": "Pricing", "Sub Label": "Price History", "Micro Label": "Per_customer history", "Price": 0.0, "Message": "Would like to see 'sold price' history per product per customer on the order entry page - last sold price and date last purchased. Saw something similar to this on Sage and believes it would support their telesales team whilst taking and confirming orders.", link: "" },
    { "Date": "2025-11-06", "Supplier Name": "Parisi", "Label": "Logistics (Delivery & Runs)", "Sub Label": "Delivery Runs", "Micro Label": "Multiple runs per customer", "Price": 2590.0, "Message": "Parisi needs to have multiple log ins for each venue departments - for eg. Rockpool need to have a Parisi log in for Bar, Juice and F+V.", link: "" },
    { "Date": "2025-11-06", "Supplier Name": "Box Fresh", "Label": "Buying (Procurement)", "Sub Label": "Purchase Orders", "Micro Label": "Partial orders", "Price": 0.0, "Message": "Box Fresh essentially have two groups of products, 'Rebel Group Products' and 'Non Rebel Group Products'.", link: "" },
    { "Date": "2025-11-06", "Supplier Name": "Sher Wagyu", "Label": "Picking & Warehouse", "Sub Label": "Picking Slips", "Micro Label": "Customer code", "Price": 0.0, "Message": "Would like the Product Code visible when picking as per the screenshot below", link: "" }
];


// --- Helper Components ---

const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
    <div className={`bg-white rounded-xl border border-slate-200 shadow-sm ${className}`}>
        {children}
    </div>
);

const StatCard = ({ title, value, icon: Icon, subValue }: any) => (
    <Card className="p-6 flex items-start justify-between">
        <div>
            <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
            <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
            {subValue && <p className="text-xs text-slate-400 mt-1">{subValue}</p>}
        </div>
        <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600">
            <Icon size={20} />
        </div>
    </Card>
);

import { fetchSheetData, saveSheetData } from './sheets';

// --- Main Application ---

interface DashboardProps {
    onLogout?: () => void;
    accessToken?: string | null;
}

export default function Dashboard({ onLogout, accessToken }: DashboardProps) {
    const [data, setData] = useState<FeedbackItem[]>(INITIAL_DATA);
    const [filteredData, setFilteredData] = useState<FeedbackItem[]>(INITIAL_DATA);
    const [isDemoMode, setIsDemoMode] = useState(true);

    // Initial Load from Sheets
    useEffect(() => {
        const loadData = async () => {
            if (accessToken) {
                try {
                    const sheetData = await fetchSheetData(accessToken);
                    if (sheetData.length > 0) {
                        setData(sheetData);
                        setFilteredData(sheetData);
                        setIsDemoMode(false);
                    }
                } catch (err) {
                    console.error("Failed to load sheet data:", err);
                }
            }
        };
        loadData();
    }, [accessToken]);

    // Navigation State
    // activeTab controls the high-level view: 'themes' (default labels) or 'suppliers' (list of suppliers)
    const [activeTab, setActiveTab] = useState<'themes' | 'suppliers'>('themes');

    // Drill down levels for Themes
    const [viewLevel, setViewLevel] = useState<'root' | 'label' | 'sublabel'>('root');

    const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
    const [selectedSubLabel, setSelectedSubLabel] = useState<string | null>(null);
    const [selectedSupplier, setSelectedSupplier] = useState<string>('All');

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;

    // Load CSV Functionality
    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            const text = e.target?.result as string;
            if (!text) return;

            const lines = text.split('\n').filter(l => l.trim().length > 0);
            if (lines.length < 2) return;

            // 1. Detect Delimiter
            const headerLine = lines[0];
            const commaCount = (headerLine.match(/,/g) || []).length;
            const tabCount = (headerLine.match(/\t/g) || []).length;
            const delimiter = tabCount > commaCount ? '\t' : ',';

            // 2. Parse Headers
            const headers = headerLine.split(delimiter).map(h => h.trim().replace(/^"|"$/g, ''));

            // Helper to find column index
            const getColIdx = (possibleNames: string[]) => {
                const lowerNames = possibleNames.map(n => n.toLowerCase());
                return headers.findIndex(h => lowerNames.includes(h.toLowerCase()));
            };

            const idxDate = getColIdx(['Date', 'Date (UTC)']);
            const idxLink = getColIdx(['Message Link', 'Link', 'URL']);
            // Re-map other indices...
            const idxSupplier = getColIdx(['Supplier Name', 'Supplier Name (filled)', 'Report Company (matched)', 'Supplier']);
            const idxLabel = getColIdx(['Label', 'Theme', 'Category']);
            const idxSubLabel = getColIdx(['Sub Label', 'Sub-Theme']);
            const idxMicroLabel = getColIdx(['Micro Label', 'Micro-Theme']);
            const idxPrice = getColIdx(['Price', 'Subscription Amount (converted) AUD sum (matched)', 'Value']);
            const idxMessage = getColIdx(['Message', 'Feedback', 'Verbatim']);

            // 3. Detect Offset (Pandas Index Column Check)
            // Check the first data row. If idxDate points to a number (like '1') and idxDate+1 points to a date, we have an offset.
            let offset = 0;
            if (lines.length > 1) {
                const firstRow = lines[1].split(delimiter); // Simple split for check
                if (idxDate !== -1 && firstRow[idxDate]) {
                    const valAtPath = firstRow[idxDate].replace(/^"|"$/g, '');
                    // If header says Date, but value is clean integer (Index) AND next col looks like Date
                    const isInteger = /^\d+$/.test(valAtPath);
                    const nextVal = firstRow[idxDate + 1]?.replace(/^"|"$/g, '');
                    const nextIsDate = nextVal && (nextVal.includes('202') || nextVal.includes('/')); // Rough heuristics

                    if (isInteger && nextIsDate) {
                        console.log("Detected Index Column Offset. Shifting +1");
                        offset = 1;
                    }
                }
            }

            const parsedData: FeedbackItem[] = [];

            // Use the previous simple parser but with dynamic delimiter
            const parseLineParams = (str: string) => {
                const result = [];
                let cell = '';
                let inQuote = false;
                for (let i = 0; i < str.length; i++) {
                    const char = str[i];
                    if (char === '"') inQuote = !inQuote;
                    else if (char === delimiter && !inQuote) {
                        result.push(cell); cell = '';
                    } else cell += char;
                }
                result.push(cell);
                return result.map(c => c.replace(/^"|"$/g, '').trim());
            };

            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;

                const cols = parseLineParams(line);

                // Helper to safely get value at index WITH OFFSET
                const val = (idx: number) => {
                    if (idx === -1) return "";
                    const realIdx = idx + offset;
                    return (cols[realIdx]) ? cols[realIdx] : "";
                };

                // Date parsing fix
                let rawDate = val(idxDate);
                if (rawDate.includes('T')) rawDate = rawDate.split('T')[0];

                parsedData.push({
                    "Date": rawDate,
                    "Supplier Name": val(idxSupplier) || "Unknown",
                    "Label": val(idxLabel) || "Uncategorized",
                    "Sub Label": val(idxSubLabel) || "Uncategorized",
                    "Micro Label": val(idxMicroLabel) || "Uncategorized",
                    "Price": parseFloat(val(idxPrice) || "0") || 0,
                    "Message": val(idxMessage) || "",
                    link: val(idxLink) || ""
                });
            }

            if (parsedData.length > 0) {
                setData(parsedData);
                setFilteredData(parsedData);
                setIsDemoMode(false);

                // Sync to Google Sheets
                if (accessToken) {
                    try {
                        await saveSheetData(accessToken, parsedData);
                    } catch (err) {
                        console.error("Failed to save to sheet:", err);
                    }
                }

                // Reset View
                setActiveTab('themes');
                setViewLevel('root');
                setSelectedLabel(null);
                setSelectedSubLabel(null);
                setSelectedSupplier('All');
                setCurrentPage(1);
            }
        };
        reader.readAsText(file);
    };

    // --- Filter Logic ---
    useEffect(() => {
        let res = data;

        // Supplier Filter
        if (selectedSupplier !== 'All') {
            res = res.filter(item => item["Supplier Name"] === selectedSupplier);
        }

        // Drill Down Filters (only apply if we are in themes mode)
        if (activeTab === 'themes') {
            if (viewLevel === 'label' && selectedLabel) {
                res = res.filter(item => item.Label === selectedLabel);
            } else if (viewLevel === 'sublabel' && selectedLabel && selectedSubLabel) {
                res = res.filter(item =>
                    item.Label === selectedLabel &&
                    item["Sub Label"] === selectedSubLabel
                );
            }
        }

        setFilteredData(res);
        setCurrentPage(1);
    }, [data, selectedSupplier, viewLevel, selectedLabel, selectedSubLabel, activeTab]);

    // --- Aggregations ---

    const kpiStats = useMemo(() => {
        return {
            count: filteredData.length,
            revenue: filteredData.reduce((acc, curr) => acc + (curr.Price || 0), 0),
            suppliers: new Set(filteredData.map(d => d["Supplier Name"])).size
        };
    }, [filteredData]);

    const chartData = useMemo(() => {
        if (activeTab === 'suppliers') {
            // Top Suppliers by Count
            const counts: Record<string, number> = {};
            filteredData.forEach(d => {
                const name = d["Supplier Name"] || "Unknown";
                counts[name] = (counts[name] || 0) + 1;
            });
            return Object.entries(counts)
                .map(([name, count]) => ({ name, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 15); // Top 15 Suppliers
        }

        // Default: Themes Mode
        if (viewLevel === 'root') {
            const counts: Record<string, number> = {};
            filteredData.forEach(d => {
                counts[d.Label] = (counts[d.Label] || 0) + 1;
            });
            return Object.entries(counts)
                .map(([name, count]) => ({ name, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 10);
        }
        else if (viewLevel === 'label') {
            const counts: Record<string, number> = {};
            filteredData.forEach(d => {
                counts[d["Sub Label"]] = (counts[d["Sub Label"]] || 0) + 1;
            });
            return Object.entries(counts)
                .map(([name, count]) => ({ name, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 10);
        }
        return [];
    }, [filteredData, viewLevel, activeTab]);

    const timelineData = useMemo(() => {
        const counts: Record<string, number> = {};
        filteredData.forEach(d => {
            if (!d.Date) return;
            counts[d.Date] = (counts[d.Date] || 0) + 1;
        });
        return Object.entries(counts)
            .map(([date, count]) => ({ date, count }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [filteredData]);

    const uniqueSuppliers = useMemo(() => {
        return Array.from(new Set(data.map(d => d["Supplier Name"]))).sort();
    }, [data]);

    // --- Pagination ---
    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredData.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredData, currentPage]);

    const totalPages = Math.ceil(filteredData.length / itemsPerPage);

    // --- Handlers ---
    const handleBarClick = (entry: any) => {
        if (activeTab === 'suppliers') {
            // DRILL DOWN BY SUPPLIER:
            // Clicking a supplier bar sets the filter to that supplier and switches to Themes view
            setSelectedSupplier(entry.name);
            setActiveTab('themes');
            setViewLevel('root'); // Start at root themes for this supplier
        } else {
            // Normal Theme Drilldown
            if (viewLevel === 'root') {
                setSelectedLabel(entry.name);
                setViewLevel('label');
            } else if (viewLevel === 'label') {
                setSelectedSubLabel(entry.name);
                setViewLevel('sublabel');
            }
        }
    };

    const handleBack = () => {
        if (viewLevel === 'sublabel') {
            setSelectedSubLabel(null);
            setViewLevel('label');
        } else if (viewLevel === 'label') {
            setSelectedLabel(null);
            setViewLevel('root');
        }
    };

    const COLORS = ['#8b5cf6', '#d946ef', '#f43f5e', '#ec4899', '#8b5cf6', '#6366f1', '#a855f7', '#fb7185', '#e879f9', '#22c55e', '#06b6d4', '#14b8a6', '#f59e0b', '#ef4444', '#3b82f6'];

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 font-sans p-6">

            {/* Header */}
            <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
                        <LayoutDashboard className="text-indigo-600" />
                        Feedback Intelligence
                    </h1>
                    <p className="text-slate-500 mt-1">
                        Analyze customer feedback trends and revenue impact.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {onLogout && (
                        <button
                            onClick={onLogout}
                            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
                        >
                            <LogOut size={16} />
                            Logout
                        </button>
                    )}
                    <label className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 cursor-pointer transition-colors shadow-sm font-medium text-sm">
                        <Download size={16} />
                        Load Full CSV
                        <input type="file" className="hidden" accept=".csv" onChange={handleFileUpload} />
                    </label>
                </div>
            </header>

            {/* Demo Warning */}
            {isDemoMode && (
                <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2 text-amber-700">
                    <AlertCircle size={20} />
                    <p><strong>Demo Mode:</strong> Displaying sample data. Upload your <code>.csv</code> file to see real results and save to Sheets.</p>
                </div>
            )}

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatCard
                    title="Total Feedback Items"
                    value={kpiStats.count.toLocaleString()}
                    icon={MessageSquare}
                    subValue={activeTab === 'suppliers' ? 'Top Suppliers View' : (viewLevel !== 'root' ? 'Filtered View' : 'All Data')}
                />
                <StatCard
                    title="Linked Revenue Risk"
                    value={`$${kpiStats.revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })} `}
                    icon={DollarSign}
                    subValue="Annual Subscription Value"
                />
                <StatCard
                    title="Active Suppliers"
                    value={kpiStats.suppliers}
                    icon={Users}
                    subValue="Participating Companies"
                />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:col-span-12 gap-6">

                {/* Sidebar / Filters */}
                <div className="lg:col-span-3 space-y-4">
                    {/* Filters Card */}
                    <Card className="p-5">
                        <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                            <Filter size={18} /> Filters
                        </h3>

                        <div className="space-y-4">
                            {/* Supplier Filter */}
                            <div>
                                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
                                    Supplier
                                </label>
                                <div className="relative">
                                    <select
                                        className="w-full appearance-none bg-white border border-slate-200 text-slate-700 py-2.5 px-3 pr-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                                        value={selectedSupplier}
                                        onChange={(e) => setSelectedSupplier(e.target.value)}
                                    >
                                        <option value="All">All Suppliers ({uniqueSuppliers.length})</option>
                                        {uniqueSuppliers.map((s, i) => (
                                            <option key={`${s} -${i} `} value={s}>{s}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Current View Section */}
                            {activeTab === 'themes' && (
                                <div className="pt-4 border-t border-slate-100">
                                    <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
                                        Current View
                                    </label>
                                    <div className="flex flex-col gap-2">
                                        <button
                                            onClick={() => { setViewLevel('root'); setSelectedLabel(null); setSelectedSubLabel(null); }}
                                            className={`text - left px - 3 py - 2.5 rounded - lg text - sm transition ${viewLevel === 'root' ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-slate-600 hover:bg-slate-50'} `}
                                        >
                                            All Categories
                                        </button>

                                        {selectedLabel && (
                                            <button
                                                onClick={() => { setViewLevel('label'); setSelectedSubLabel(null); }}
                                                className={`text - left px - 3 py - 2.5 rounded - lg text - sm flex items - center gap - 2 transition ${viewLevel === 'label' ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-slate-600 hover:bg-slate-50'} `}
                                            >
                                                <ChevronRight size={14} />
                                                {selectedLabel}
                                            </button>
                                        )}

                                        {selectedSubLabel && (
                                            <div className="text-left px-3 py-2.5 rounded-lg text-sm flex items-center gap-2 bg-indigo-50 text-indigo-700 font-medium">
                                                <ChevronRight size={14} />
                                                {selectedSubLabel}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Analysis Tip Card */}
                    <Card className="p-5 !bg-slate-900 !border-slate-800">
                        <h3 className="font-semibold text-white mb-2">Analysis Tip</h3>
                        <p className="text-sm text-slate-300 leading-relaxed">
                            Drill down into categories to isolate specific issues. Use the Supplier filter to see feedback from a single key account.
                        </p>
                    </Card>
                </div>

                {/* Main Charts Area */}
                <div className="lg:col-span-9 space-y-6">

                    {/* Main Bar Chart */}
                    <Card className="p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                {/* Back Button for Themes */}
                                {activeTab === 'themes' && viewLevel !== 'root' && (
                                    <button
                                        onClick={handleBack}
                                        className="p-1.5 hover:bg-slate-100 rounded-full transition text-slate-500"
                                    >
                                        <ArrowLeft size={18} />
                                    </button>
                                )}

                                <div>
                                    <h2 className="text-lg font-bold text-slate-900">
                                        {activeTab === 'suppliers' && "Top Suppliers"}
                                        {activeTab === 'themes' && viewLevel === 'root' && "Top Themes"}
                                        {activeTab === 'themes' && viewLevel === 'label' && selectedLabel}
                                        {activeTab === 'themes' && viewLevel === 'sublabel' && selectedSubLabel}
                                    </h2>
                                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                                        {activeTab === 'suppliers' ? "By Volume" : "By Feedback Count"}
                                    </p>
                                </div>
                            </div>

                            {viewLevel !== 'sublabel' && (
                                <div className="flex items-center gap-2 text-xs text-indigo-600 bg-indigo-50 px-2.5 py-1.5 rounded-md font-medium">
                                    <LayoutDashboard size={14} />
                                    {activeTab === 'suppliers' ? "Select a supplier" : "Click bar to drill down"}
                                </div>
                            )}
                        </div>

                        {viewLevel !== 'sublabel' ? (
                            <div className="h-[400px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                                        <XAxis type="number" hide />
                                        <YAxis
                                            type="category"
                                            dataKey="name"
                                            width={180}
                                            tick={{ fill: '#475569', fontSize: 11 }}
                                            interval={0}
                                        />
                                        <Tooltip
                                            cursor={{ fill: '#f1f5f9' }}
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        />
                                        <Bar dataKey="count" radius={[0, 4, 4, 0]} onClick={handleBarClick} cursor="pointer">
                                            {chartData.map((_entry, index) => (
                                                <Cell key={`cell - ${index} `} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            // Detailed List View with Pagination
                            <div className="h-[400px] flex flex-col">
                                <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                                    {paginatedData.map((item, idx) => (
                                        <div key={idx} className="p-4 border border-slate-100 rounded-lg bg-slate-50 hover:bg-white hover:shadow-sm transition group">
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-4 mb-1">
                                                        <div className="flex items-center gap-2">
                                                            <h4 className="text-sm font-semibold text-slate-900 truncate">
                                                                {item["Supplier Name"]}
                                                            </h4>
                                                            <span className="text-xs text-slate-400">{item.Date}</span>
                                                            {item.link && (
                                                                <a
                                                                    href={item.link}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-indigo-600 hover:text-indigo-800 p-1 hover:bg-indigo-50 rounded-full transition-colors"
                                                                    title="Open in Slack"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                >
                                                                    <ExternalLink size={14} />
                                                                </a>
                                                            )}
                                                        </div>
                                                        {item.Price > 0 && (
                                                            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full whitespace-nowrap">
                                                                ${item.Price.toLocaleString()}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full font-medium">
                                                            {item.Label}
                                                        </span>
                                                        <span className="text-slate-300">•</span>
                                                        <span className="text-xs text-slate-500">{item["Sub Label"]}</span>
                                                    </div>
                                                    <p className="text-sm text-slate-600 line-clamp-2">
                                                        {item.Message}
                                                    </p>
                                                </div>
                                            </div>
                                    ))}
                                            {paginatedData.length === 0 && (
                                                <div className="text-center py-12 text-slate-400">
                                                    No feedback items found for this selection.
                                                </div>
                                            )}
                                        </div>

                                {/* Pagination Controls */ }
                                { totalPages > 1 && (
                                            <div className="pt-4 mt-2 border-t border-slate-100 flex items-center justify-between">
                                                <button
                                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                                    disabled={currentPage === 1}
                                                    className="p-2 text-slate-500 hover:bg-slate-100 rounded disabled:opacity-30 disabled:hover:bg-transparent"
                                                >
                                                    <ChevronLeft size={20} />
                                                </button>
                                                <span className="text-xs font-medium text-slate-500">
                                                    Page {currentPage} of {totalPages}
                                                </span>
                                                <button
                                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                                    disabled={currentPage === totalPages}
                                                    className="p-2 text-slate-500 hover:bg-slate-100 rounded disabled:opacity-30 disabled:hover:bg-transparent"
                                                >
                                                    <ChevronRight size={20} />
                                                </button>
                                            </div>
                                        )}
                                </div>
                        )}
                            </Card>

                    {/* Timeline Chart */}
                        <Card className="p-6">
                            <div className="flex items-center gap-2 mb-6">
                                <Calendar size={18} className="text-slate-400" />
                                <h2 className="text-lg font-bold text-slate-900">Volume Over Time</h2>
                            </div>
                            <div className="h-[250px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={timelineData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                        <XAxis
                                            dataKey="date"
                                            tick={{ fill: '#94a3b8', fontSize: 10 }}
                                            tickLine={false}
                                            axisLine={false}
                                            minTickGap={40}
                                        />
                                        <YAxis
                                            tick={{ fill: '#94a3b8', fontSize: 10 }}
                                            tickLine={false}
                                            axisLine={false}
                                        />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="count"
                                            stroke="#6366f1"
                                            strokeWidth={3}
                                            dot={false}
                                            activeDot={{ r: 6 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>
                </div>
            </div>
        </div>
    );
}
