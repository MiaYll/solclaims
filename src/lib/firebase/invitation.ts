import { db } from '@/lib/firebase';
import { 
    collection, 
    addDoc, 
    query,
    where, 
    getDocs,
    doc,
    getDoc,
    setDoc,
    updateDoc,
    Timestamp,
} from 'firebase/firestore';
import { Invitation, InviteStats, RewardHistory, InviteRecord } from './types';

// 生成邀请码
export const generateInviteCode = (length: number = 8): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < length; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
};

// 获取钱包的邀请码
export const getInviteCode = async (walletAddress: string): Promise<string | null> => {
    try {
        const invitationsRef = collection(db, 'invitations');
        const q = query(invitationsRef, where('inviterWallet', '==', walletAddress));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
            return querySnapshot.docs[0].data().inviteCode;
        }
        return null;
    } catch (error) {
        console.error('获取邀请码失败:', error);
        throw error;
    }
};

// 创建邀请码
export const createInvitation = async (inviterWallet: string): Promise<string> => {
    try {
        // 检查是否已有邀请码
        const existingCode = await getInviteCode(inviterWallet);
        if (existingCode) {
            return existingCode;
        }

        // 创建新邀请码
        const inviteCode = generateInviteCode();
        const invitationRef = doc(db, 'invitations', inviteCode);
        await setDoc(invitationRef, {
            inviterWallet,
            inviteCode,
            invitees: [],
            createdAt: Timestamp.now()
        } as Invitation);

        return inviteCode;
    } catch (error) {
        console.error('创建邀请失败:', error);
        throw error;
    }
};

// 使用邀请码
export const completeInvitation = async (inviteCode: string, inviteeWallet: string) => {
    try {
        const invitationRef = doc(db, 'invitations', inviteCode);
        const invitationDoc = await getDoc(invitationRef);

        if (!invitationDoc.exists()) {
            throw new Error('邀请码无效');
        }

        const invitationData = invitationDoc.data() as Invitation;
        
        // 检查是否已经使用过这个邀请码
        if (invitationData.invitees.includes(inviteeWallet)) {
            throw new Error('已经使用过此邀请码');
        }

        // 更新邀请记录
        await setDoc(invitationRef, {
            ...invitationData,
            invitees: [...invitationData.invitees, inviteeWallet]
        });

        // 记录邀请历史
        await addDoc(collection(db, 'inviteRecords'), {
            inviterWallet: invitationData.inviterWallet,
            inviteeWallet,
            inviteCode,
            timestamp: Timestamp.now()
        } as InviteRecord);

        // 更新邀请统计
        await updateInviteStats(invitationData.inviterWallet);

    } catch (error) {
        console.error('完成邀请失败:', error);
        throw error;
    }
};

// 更新邀请统计
const updateInviteStats = async (walletAddress: string) => {
    const statsRef = doc(db, 'inviteStats', walletAddress);
    const statsDoc = await getDoc(statsRef);

    if (statsDoc.exists()) {
        const data = statsDoc.data() as InviteStats;
        await updateDoc(statsRef, {
            totalInvites: (data.totalInvites || 0) + 1,
            lastInviteAt: Timestamp.now()
        });
    } else {
        await setDoc(statsRef, {
            walletAddress,
            totalInvites: 1,
            totalRewards: 0,
            lastInviteAt: Timestamp.now()
        } as InviteStats);
    }
};

// 获取邀请人
export const getInviter = async (walletAddress: string): Promise<string | null> => {
    try {
        const invitationsRef = collection(db, 'invitations');
        const q = query(invitationsRef, where('invitees', 'array-contains', walletAddress));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            return querySnapshot.docs[0].data().inviterWallet;
        }
        return null;
    } catch (error) {
        console.error('获取邀请人失败:', error);
        return null;
    }
};

// 记录分红
export const recordReward = async (
    inviterWallet: string, 
    rewardAmount: number,
    txSignature: string
) => {
    try {
        // 记录分红历史
        await addDoc(collection(db, 'rewardHistory'), {
            walletAddress: inviterWallet,
            amount: rewardAmount,
            txSignature,
            timestamp: Timestamp.now()
        } as RewardHistory);

        // 更新累计分红统计
        const statsRef = doc(db, 'inviteStats', inviterWallet);
        const statsDoc = await getDoc(statsRef);

        if (statsDoc.exists()) {
            const data = statsDoc.data() as InviteStats;
            await updateDoc(statsRef, {
                totalRewards: (data.totalRewards || 0) + rewardAmount,
                lastRewardAt: Timestamp.now()
            });
        } else {
            await setDoc(statsRef, {
                walletAddress: inviterWallet,
                totalInvites: 0,
                totalRewards: rewardAmount,
                lastInviteAt: Timestamp.now(),
                lastRewardAt: Timestamp.now()
            } as InviteStats);
        }
    } catch (error) {
        console.error('记录分红失败:', error);
        throw error;
    }
};

// 获取邀请统计
export const getInviteStats = async (walletAddress: string): Promise<InviteStats | null> => {
    try {
        const statsRef = doc(db, 'inviteStats', walletAddress);
        const statsDoc = await getDoc(statsRef);
        
        if (statsDoc.exists()) {
            return statsDoc.data() as InviteStats;
        }
        return null;
    } catch (error) {
        console.error('获取邀请统计失败:', error);
        throw error;
    }
};

// 检查是否为新用户（从未使用过邀请系统）
export const checkIsNewUser = async (walletAddress: string): Promise<boolean> => {
    try {
        const invitationsRef = collection(db, 'invitations');
        const q = query(invitationsRef, where('invitees', 'array-contains', walletAddress));
        const querySnapshot = await getDocs(q);
        
        // 如果在 invitees 中找不到这个钱包地址，说明是新用户
        return querySnapshot.empty;
    } catch (error) {
        console.error('检查新用户状态失败:', error);
        throw error;
    }
}; 