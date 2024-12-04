'use client';

import ClaimList from "@/components/claimlist";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import '../page.css'
import TokenCard from "@/components/tokencard";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { TokenMetadata, useSolanaUtils } from "@/lib/web3";
import { useEffect, useState, useMemo } from "react";
import { PublicKey } from "@solana/web3.js";
import LoadingOverlay from "@/components/loading-overlay";
import { useTranslations } from 'next-intl';
import LanguageSwitcher from '@/components/language-switcher';
import { CONFIG } from "@/config";
import InviteModal from "@/components/InviteModal";
import { useSearchParams } from 'next/navigation';


export default function Home() {
  const wallet = useWallet();
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [balance, setbalance] = useState(-1)
  const [tokenList, setTokenList] = useState<TokenMetadata[]>([])
  const [loading, setLoading] = useState(true);
  const [loadingText, setLoadingText] = useState("Wait Connecting...");

  const [selectedTokens, setSelectedTokens] = useState<Set<string>>(new Set());

  const { getSolBalance, getTokenList, closeTokenAccounts } = useSolanaUtils();
  const searchParams = useSearchParams();
  const inviteCode = searchParams.get('ref');

  useEffect(() => {
    const update = async () => {
      if (!wallet.publicKey) return;
      setLoading(true);
      setLoadingText("Wait Connecting...")
      setbalance(await getSolBalance(wallet.publicKey))
      setTokenList(await getTokenList(wallet.publicKey))
      setLoading(false);
    }
    update()
  }, [wallet])

  const handleTokenSelect = (address: string, isSelected: boolean) => {
    setSelectedTokens(prev => {
      const newSet = new Set(prev);
      if (isSelected) {
        newSet.add(address);
      } else {
        newSet.delete(address);
      }
      return newSet;
    });
  };

  const selectedAmount = useMemo(() => {
    return selectedTokens.size * 0.002 * 0.85;
  }, [selectedTokens.size]);

  const handleCleanup = async () => {
    if (!wallet.publicKey || selectedTokens.size === 0) return;

    try {
      const tokenAddresses = Array.from(selectedTokens).map(address => new PublicKey(address));
      setLoading(true);
      setLoadingText("Wait Processing...")

      const signature = await closeTokenAccounts(
        tokenAddresses,
        wallet.publicKey,
        new PublicKey(CONFIG.BENEFICIARY_WALLET)
      );

      console.log('清理成功:', signature);

      // 清空选中状态
      setSelectedTokens(new Set());

      // 刷新数据
      const newTokenList = await getTokenList(wallet.publicKey);
      setTokenList(newTokenList);
      const newBalance = await getSolBalance(wallet.publicKey);
      setbalance(newBalance);
      setLoading(false);

    } catch (error) {
      setLoading(false);
      console.error('Cleanup failed:', error);
    }
  };

  const t = useTranslations();

  return (
    <main className="min-h-screen bg-gradient-to-b from-black to-gray-900 text-white">
      {/* 导航栏 */}
      <nav className="flex items-center justify-between p-3 backdrop-blur-md bg-black/30 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <a href="https://sol.claims">
            <div className="flex items-center gap-2">
              <Image
                src="https://claimyoursol.com/images/cys-banner-alt.png"
                alt="solclaims Logo"
                width={32}
                height={32}
                className="rounded-full"
              />
              <span className="text-lg font-bold">Sol Claims</span>
            </div>
          </a>
          <LanguageSwitcher />
        </div>
        <div className="flex flex-col items-end gap-2">
          <WalletMultiButton
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            aria-label="Connect"
          />
          {wallet.connected && balance > -1 && (
            <div className="text-sm font-medium text-gray-300">
              {t('nav.balance', { balance })}
            </div>
          )}
        </div>
      </nav>

      {/* 主要内容区域 */}
      <div className="container mx-auto px-4 py-20 text-center relative">
        {/* 背景装饰 */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10 animate-pulse"></div>
          <div className="absolute top-10 left-10 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl"></div>
        </div>

        <h1 className="mb-6 text-6xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
          {t('hero.title')}
        </h1>
        <p className="mb-12 text-xl text-gray-300 max-w-2xl mx-auto">
          {t('hero.subtitle')}
        </p>
      </div>

      {/* 展示代币 */}
      <div className="container mx-auto py-5 text-center rounded-lg bg-gray-800/50 backdrop-blur border border-gray-700 p-6 relative">
        <LoadingOverlay loading={loading} text={loadingText} />

        <p className="text-center text-xl font-bold text-red-200 mb-5">{t('tokens.title')}</p>
        {tokenList.length > 0 ? (
          <div className="grid grid-cols-5 gap-4 justify-items-center">
            {tokenList.map((token, index) => (
              <TokenCard
                key={index}
                address={token.address}
                image={token.image}
                symbol={token.symbol}
                amount={token.balance}
                onSelect={handleTokenSelect}
                isSelected={selectedTokens.has(token.address)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 space-y-4">
            <div className="text-4xl">🔍</div>
            <p className="text-xl font-medium text-gray-300">{t('tokens.emptyWallet')}</p>
            <p className="text-sm text-gray-400">{t('tokens.switchWallet')}</p>
          </div>
        )}
        {tokenList.length > 0 && (
          <div className="mt-8 flex flex-col items-center space-y-4">
            <p className="text-center text-xl font-bold bg-gradient-to-r from-green-300 to-teal-300 bg-clip-text text-transparent">
              {selectedTokens.size > 0
                ? `You will receive ${selectedAmount.toFixed(5)} SOL`
                : 'Select tokens to close'}
            </p>
            <Button
              className={`
                w-[140px] px-8 py-6 text-lg font-medium rounded-xl
                transition-all duration-300 transform hover:scale-105
                ${selectedTokens.size > 0
                  ? 'bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 shadow-lg hover:shadow-green-500/25'
                  : 'bg-gradient-to-r from-gray-500 to-gray-600 opacity-75'
                }
              `}
              aria-label="CLEANUP"
              onClick={handleCleanup}
              disabled={!wallet.connected || selectedTokens.size === 0}
            >
              {t('buttons.cleanup')}
            </Button>
          </div>
        )}
      </div>

      {/* 邀请系统 */}
      <div className="container mx-auto py-12">
        <div className="rounded-lg bg-gray-800/50 backdrop-blur border border-gray-700 p-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
              {t('invitation.title')}
            </h2>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto">
              {t('invitation.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div className="p-6 rounded-2xl bg-gray-900/50 backdrop-blur border border-gray-700 hover:border-purple-500/50 transition-all group">
              <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mb-6 mx-auto group-hover:bg-purple-500/30 transition-all">
                <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-purple-400 mb-3">{t('invitation.card1.title')}</h3>
              <p className="text-gray-400">{t('invitation.card1.description')}</p>
            </div>

            <div className="p-6 rounded-2xl bg-gray-900/50 backdrop-blur border border-gray-700 hover:border-blue-500/50 transition-all group">
              <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-6 mx-auto group-hover:bg-blue-500/30 transition-all">
                <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-blue-400 mb-3">{t('invitation.card2.title')}</h3>
              <p className="text-gray-400">{t('invitation.card2.description')}</p>
            </div>

            <div className="p-6 rounded-2xl bg-gray-900/50 backdrop-blur border border-gray-700 hover:border-green-500/50 transition-all group">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-6 mx-auto group-hover:bg-green-500/30 transition-all">
                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-green-400 mb-3">{t('invitation.card3.title')}</h3>
              <p className="text-gray-400">{t('invitation.card3.description')}</p>
            </div>
          </div>

          <div className="text-center">
            <Button
              onClick={() => setIsInviteModalOpen(true)}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 
                       px-8 py-4 text-lg font-medium rounded-xl shadow-lg 
                       hover:shadow-purple-500/25 transition-all duration-300 
                       transform hover:scale-105 inline-flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              {t('invitation.startButton')}
            </Button>
          </div>
        </div>
      </div>

      {/* 最新订单 */}
      <div className="container mx-auto py-20 text-center">
        <div className="rounded-lg bg-gray-800/50 backdrop-blur border border-gray-700 p-6 text-center">
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-pink-400 mb-6">
            {t('latestRecords.title')}
          </h2>
          <ClaimList />
        </div>
      </div>

      {/* 特性展示 */}
      <div className="container mx-auto mb-20">
        <div className="rounded-lg bg-gray-800/50 backdrop-blur border border-gray-700 p-8">
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-teal-400 mb-8 text-center">
            {t('howToUse.title')}
          </h2>
          <div className="space-y-8">
            <div className="p-6 rounded-xl bg-gray-900/50 border border-gray-700">
              <h3 className="font-bold text-green-400 text-xl mb-3">{t('howToUse.section1.title')}</h3>
              <p className="text-gray-300">
                {t('howToUse.section1.content')}
              </p>
            </div>
            <div className="p-6 rounded-xl bg-gray-900/50 border border-gray-700">
              <h3 className="font-bold text-green-400 text-xl mb-3">{t('howToUse.section2.title')}</h3>
              <p className="text-gray-300">
                {t('howToUse.section2.content')}
              </p>
            </div>
            <div className="p-6 rounded-xl bg-gray-900/50 border border-gray-700">
              <h3 className="font-bold text-green-400 text-xl mb-3">{t('howToUse.section3.title')}</h3>
              <p className="text-gray-300">
                {t('howToUse.section3.content')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 邀请弹窗 */}
      <InviteModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
      />
    </main>
  );
}
