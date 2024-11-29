export interface Invitation {
  inviterWallet: string;      // 邀请人钱包地址
  inviteeWallet: string;      // 被邀请人钱包地址
  inviteCode: string;         // 邀请码
  createdAt: Date;           // 创建时间
  status: 'pending' | 'completed'; // 邀请状态
}

export interface InviteStats {
  walletAddress: string;     // 钱包地址
  totalInvites: number;      // 总邀请数
  successfulInvites: number; // 成功邀请数
  lastInviteAt: {
    seconds: number;
    nanoseconds: number;
  };
} 