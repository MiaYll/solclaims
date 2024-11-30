"use client";

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { createInvitation, getInviteCode, getInviteStats } from '@/lib/firebase/invitation';
import { InviteStats } from '@/lib/firebase/types';
import Modal from './ui/Modal';
import { useTranslations } from 'next-intl';

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// 添加钱包图标组件
const WalletIcon = () => (
  <svg 
    className="w-16 h-16 text-gray-400" 
    xmlns="http://www.w3.org/2000/svg" 
    fill="none" 
    viewBox="0 0 24 24" 
    stroke="currentColor"
  >
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      strokeWidth={1.5} 
      d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3"
    />
  </svg>
);

export default function InviteModal({ isOpen, onClose }: InviteModalProps) {
  const { publicKey } = useWallet();
  const [inviteCode, setInviteCode] = useState<string>('');
  const [stats, setStats] = useState<InviteStats | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const t = useTranslations();

  useEffect(() => {
    if (publicKey && isOpen) {
      loadData();
    }
  }, [publicKey, isOpen]);

  const loadData = async () => {
    if (!publicKey) return;
    setLoading(true);
    try {
      const existingCode = await getInviteCode(publicKey.toString());
      if (existingCode) {
        setInviteCode(existingCode);
      } else {
        const newCode = await createInvitation(publicKey.toString());
        setInviteCode(newCode);
      }

      const freshStats = await getInviteStats(publicKey.toString());
      
      setStats(freshStats);
      
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const inviteLink = `${window.location.origin}?ref=${inviteCode}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('modal.invite.title')}
      className="bg-gray-900 text-gray-100"
    >
      {!publicKey ? (
        <div className="flex flex-col items-center justify-center py-8 space-y-4">
          <WalletIcon />
          <p className="text-gray-400 text-center">
            {t('modal.invite.connectWallet')}
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            {t('modal.invite.connectButton')}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center p-6 bg-gray-800 rounded-lg border border-gray-700">
                  <p className="text-2xl font-semibold text-purple-400 mb-2">
                    {stats?.totalInvites ?? 0}
                  </p>
                  <p className="text-sm text-gray-400">{t('modal.invite.stats.totalInvites')}</p>
                </div>
                <div className="text-center p-6 bg-gray-800 rounded-lg border border-gray-700">
                  <p className="text-2xl font-semibold text-purple-400 mb-2">
                    {typeof stats?.totalRewards === 'number' 
                      ? `${stats.totalRewards.toFixed(4)} SOL` 
                      : '0 SOL'}
                  </p>
                  <p className="text-sm text-gray-400">{t('modal.invite.stats.totalEarnings')}</p>
                </div>
              </div>


              {inviteCode && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inviteLink}
                    readOnly
                    className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-100"
                  />
                  <button
                    onClick={copyToClipboard}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                  >
                    {copied ? t('modal.invite.copyButton.copied') : t('modal.invite.copyButton.default')}
                  </button>
                </div>
              )}

              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4 text-purple-400">{t('modal.invite.records.title')}</h3>
                <div className="space-y-2">
                  <div className="flex justify-between p-3 bg-gray-800 rounded-lg border border-gray-700">
                    <span className="text-gray-400">{t('modal.invite.records.lastInvite')}</span>
                    <span className="text-gray-100">
                      {stats?.lastInviteAt 
                        ? new Date(stats.lastInviteAt.seconds * 1000).toLocaleDateString() 
                        : t('modal.invite.records.noRecords')}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </Modal>
  );
} 