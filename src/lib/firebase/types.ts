import { Timestamp } from 'firebase/firestore';

// 邀请记录
export interface Invitation {
    inviterWallet: string;     // 邀请人钱包地址
    inviteCode: string;        // 邀请码
    invitees: string[];        // 被邀请人钱包地址列表
    createdAt: Timestamp;      // 创建时间
}

// 邀请统计
export interface InviteStats {
    walletAddress: string;     // 钱包地址
    totalInvites: number;      // 总邀请数
    totalRewards: number;      // 累计分红（SOL）
    lastInviteAt: Timestamp;   // 最后邀请时间
    lastRewardAt?: Timestamp;  // 最后分红时间
}

// 分红记录
export interface RewardHistory {
    walletAddress: string;     // 钱包地址
    amount: number;            // 分红金额（SOL）
    txSignature: string;       // 交易签名
    timestamp: Timestamp;      // 记录时间
}

// 邀请记录查询结果
export interface InviteRecord {
    inviterWallet: string;     // 邀请人钱包
    inviteeWallet: string;     // 被邀请人钱包
    inviteCode: string;        // 使用的邀请码
    timestamp: Timestamp;      // 邀请时间
} 