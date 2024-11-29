import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { useEffect, useState } from "react";
import { LogItem, LogsApi } from "@/api/logs";
import { motion, AnimatePresence } from "framer-motion";

function shortenString(input: string): string {
    if (input.length <= 9) return input;
    return `${input.slice(0, 5)}...${input.slice(-4)}`;
}


function lamportsToSol(lamports: number): number {
    return lamports / 1000000000; // 1 SOL = 1,000,000,000 lamports
}

function getSolscanUrl(tx: string): string {
    return `https://solscan.io/tx/${tx}`;
}

function getRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
        return `${diffInSeconds}s ago`;
    }
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
        return `${diffInMinutes}m ago`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
        return `${diffInHours}h ago`;
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) {
        return `${diffInDays}d ago`;
    }
    
    // 如果超过30天，返回具体日期
    return date.toLocaleDateString();
}

export default function ClaimList() {
    const [logs, setLogs] = useState<LogItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // 初始加载
        fetchData();

        // 设置3秒轮询
        const interval = setInterval(fetchData, 3000);

        return () => clearInterval(interval);
    }, []);

    async function fetchData() {
        try {
            const data = await LogsApi.fetchLogs(1);
            setLogs(prevLogs => {
                // 检查是否有新数据
                if (prevLogs.length === 0) return data;
                
                // 比较最新的 tx 是否相同
                if (prevLogs[0]?.tx !== data[0]?.tx) {
                    return data;
                }
                return prevLogs;
            });
            if (loading) setLoading(false);
        } catch (error) {
            console.error('Failed to fetch logs:', error);
        }
    }

    if (loading) return <div>Loading...</div>;

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead className="w-[100px] text-white">Wallet/TX</TableHead>
                    <TableHead className="text-center text-white">Accts</TableHead>
                    <TableHead className="text-center text-white">Claimed SOL</TableHead>
                    <TableHead className="text-right text-center text-white">Time</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                <AnimatePresence>
                    {logs.map((info) => (
                        <motion.tr
                            key={info.tx}
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                        >
                            <TableCell className="w-[350px] text-left">
                                <p className="font-bold">
                                    {shortenString(info.wallet)}
                                    <span className="ml-2 text-sm text-gray-400">
                                        ({info.wallet_name})
                                    </span>
                                </p>
                                <a 
                                    href={getSolscanUrl(info.tx)} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-green-500 hover:text-green-400 transition-colors cursor-pointer"
                                >
                                    {shortenString(info.tx)}
                                </a>
                            </TableCell>
                            <TableCell className="font-bold text-base">
                                {info.accounts}
                            </TableCell>
                            <TableCell className="font-bold text-base text-blue-400">
                                {lamportsToSol(info.lamports).toFixed(3)} SOL
                            </TableCell>
                            <TableCell className="text-base text-gray-200">
                                {getRelativeTime(info.created_at)}
                            </TableCell>
                        </motion.tr>
                    ))}
                </AnimatePresence>
            </TableBody>
        </Table>
    );
}