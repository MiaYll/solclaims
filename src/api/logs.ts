import { CONFIG } from '@/config/index';

export interface LogItem {
  id: number;
  wallet: string;
  wallet_name: string;
  referral: string | null;
  accounts: number;
  lamports: number;
  confirmed: number;
  destination: number;
  tx: string;
  created_at: string;
  updated_at: string;
}

interface LogResponse {
  status: string;
  message: {
    current_page: number;
    data: LogItem[];
    last_page: number;
    total: number;
  };
}

export class LogsApi {
  private static BASE_URL = `${CONFIG.API_BASE_URL}/logs`;

  static async fetchLogs(page: number = 1): Promise<LogItem[]> {
    try {
      const response = await fetch(`${this.BASE_URL}?page=${page}`);
      if (!response.ok) throw new Error('Network response was not ok');
      
      const data: LogResponse = await response.json();
      return data.message.data;
    } catch (error) {
      console.error('Error fetching logs:', error);
      return [];
    }
  }
}

// 使用示例:
// const logs = await LogsApi.fetchLogs(1); 