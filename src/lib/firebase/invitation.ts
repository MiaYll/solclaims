import { db } from '@/lib/firebase';
import { 
  collection, 
  addDoc, 
  query,
  where, 
  getDocs,
  updateDoc,
  doc,
  getDoc,
  setDoc,
  Timestamp 
} from 'firebase/firestore';
import { Invitation, InviteStats } from './types';

// 生成邀请码
export const generateInviteCode = (length: number = 8): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// 获取钱包地址的邀请码
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

// 修改创建邀请的方法，添加检查
export const createInvitation = async (inviterWallet: string): Promise<string> => {
  try {
    // 先检查是否已有邀请码
    const existingCode = await getInviteCode(inviterWallet);
    if (existingCode) {
      return existingCode;
    }

    // 创建新邀请码
    const inviteCode = generateInviteCode();
    await addDoc(collection(db, 'invitations'), {
      inviterWallet,
      inviteCode,
      createdAt: Timestamp.now(),
      status: 'pending'
    });
    return inviteCode;
  } catch (error) {
    console.error('创建邀请失败:', error);
    throw error;
  }
};

// 完成邀请
export const completeInvitation = async (inviteCode: string, inviteeWallet: string) => {
  try {
    // 查找邀请记录
    const invitationsRef = collection(db, 'invitations');
    const q = query(invitationsRef, where('inviteCode', '==', inviteCode));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      throw new Error('邀请码无效');
    }

    const invitation = querySnapshot.docs[0];
    const invitationData = invitation.data() as Invitation;

    // 检查邀请状态
    if (invitationData.status === 'completed') {
      throw new Error('邀请码已使用');
    }

    // 更新邀请记录
    await updateDoc(doc(db, 'invitations', invitation.id), {
      inviteeWallet,
      status: 'completed'
    });

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
    await updateDoc(statsRef, {
      totalInvites: statsDoc.data().totalInvites + 1,
      successfulInvites: statsDoc.data().successfulInvites + 1,
      lastInviteAt: Timestamp.now()
    });
  } else {
    await setDoc(statsRef, {
      walletAddress,
      totalInvites: 1,
      successfulInvites: 1,
      lastInviteAt: Timestamp.now()
    });
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

// 获取邀请列表
export const getInvitationsList = async (walletAddress: string): Promise<Invitation[]> => {
  try {
    const invitationsRef = collection(db, 'invitations');
    const q = query(invitationsRef, where('inviterWallet', '==', walletAddress));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => doc.data() as Invitation);
  } catch (error) {
    console.error('获取邀请列表失败:', error);
    throw error;
  }
}; 