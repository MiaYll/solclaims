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

export default function InviteModal({ isOpen, onClose }: InviteModalProps) {
  const { publicKey } = useWallet();
  const [inviteCode, setInviteCode] = useState<string>('');
  const [stats, setStats] = useState<InviteStats | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const t = useTranslations();

  useEffect(() => {
    if (publicKey) {
      loadData();
    }
  }, [publicKey]);

  const loadData = async () => {
    if (!publicKey) return;
    setLoading(true);
    try {
      const [stats, existingCode] = await Promise.all([
        getInviteStats(publicKey.toString()),
        getInviteCode(publicKey.toString())
      ]);
      
      setStats(stats);
      
      if (existingCode) {
        setInviteCode(existingCode);
      } else {
        const newCode = await createInvitation(publicKey.toString());
        setInviteCode(newCode);
      }
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
      <div className="space-y-6">
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
          </div>
        ) : (
          <>
            {stats && (
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-gray-800 rounded-lg border border-gray-700">
                  <p className="text-lg font-semibold text-purple-400">{stats.totalInvites}</p>
                  <p className="text-sm text-gray-400">{t('modal.invite.stats.totalInvites')}</p>
                </div>
                <div className="text-center p-4 bg-gray-800 rounded-lg border border-gray-700">
                  <p className="text-lg font-semibold text-purple-400">{stats.successfulInvites}</p>
                  <p className="text-sm text-gray-400">{t('modal.invite.stats.successfulInvites')}</p>
                </div>
              </div>
            )}

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

            {stats && stats.totalInvites > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4 text-purple-400">{t('modal.invite.records.title')}</h3>
                <div className="space-y-2">
                  <div className="flex justify-between p-3 bg-gray-800 rounded-lg border border-gray-700">
                    <span className="text-gray-400">{t('modal.invite.records.lastInvite')}</span>
                    <span className="text-gray-100">
                      {stats.lastInviteAt ? new Date(stats.lastInviteAt.seconds * 1000).toLocaleDateString() : '暂无'}
                    </span>
                  </div>
                  <div className="flex justify-between p-3 bg-gray-800 rounded-lg border border-gray-700">
                    <span className="text-gray-400">{t('modal.invite.records.successRate')}</span>
                    <span className="text-gray-100">
                      {Math.round((stats.successfulInvites / stats.totalInvites) * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
} 