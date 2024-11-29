"use client";

import { useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useSearchParams, useRouter } from 'next/navigation';
import { completeInvitation } from '@/lib/firebase/invitation';

const INVITE_CODE_KEY = 'pending_invite_code';

export default function InviteHandler({
  children
}: {
  children: React.ReactNode;
}) {
  const { publicKey } = useWallet();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  useEffect(() => {
    const handleInvitation = async () => {
      if (!publicKey) return;
      
      // 先检查 URL 中的 ref 参数
      const refCode = searchParams.get('ref');
      if (refCode) {
        // 存储到 localStorage
        localStorage.setItem(INVITE_CODE_KEY, refCode);
        // 清理 URL，保持当前路径
        const currentPath = window.location.pathname;
        router.replace(currentPath, { scroll: false });
        return;
      }

      // 如果 URL 中没有，检查 localStorage
      const savedRefCode = localStorage.getItem(INVITE_CODE_KEY);
      if (!savedRefCode) return;

      try {
        await completeInvitation(savedRefCode, publicKey.toString());
        // 处理完成后清除存储的邀请码
        localStorage.removeItem(INVITE_CODE_KEY);
      } catch (error) {
        console.error('处理邀请失败:', error);
      }
    };

    handleInvitation();
  }, [publicKey, searchParams, router]);

  return children;
} 