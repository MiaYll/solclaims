'use client';

import { Button } from "@/components/ui/button";
import Image from "next/image";

export default function Home() {
  const handleConnectWallet = () => {
    // 钱包连接逻辑将在这里实现
    console.log("Connecting wallet...");
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-black to-gray-900 text-white">
      {/* 导航栏 */}
      <nav className="flex items-center justify-between p-6">
        <div className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="ClaimYourSol Logo"
            width={40}
            height={40}
            className="rounded-full"
          />
          <span className="text-xl font-bold">ClaimYourSol</span>
        </div>
        <Button 
          onClick={handleConnectWallet}
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          aria-label="连接钱包"
        >
          连接钱包
        </Button>
      </nav>

      {/* 主要内容区域 */}
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="mb-6 text-5xl font-bold">
          在 Solana 上认领你的数字身份
        </h1>
        <p className="mb-8 text-xl text-gray-300">
          安全、快速地创建你的链上身份，连接到 Web3 世界
        </p>
        <div className="flex justify-center gap-4">
          <Button 
            onClick={handleConnectWallet}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 px-8 py-6 text-lg"
            aria-label="开始认领"
          >
            开始认领
          </Button>
          <Button 
            variant="outline"
            className="border-2 px-8 py-6 text-lg"
            aria-label="了解更多"
          >
            了解更多
          </Button>
        </div>
      </div>

      {/* 特性展示 */}
      <div className="container mx-auto grid grid-cols-1 gap-8 px-4 py-20 md:grid-cols-3">
        {[
          {
            title: "安全可靠",
            description: "使用最先进的加密技术保护你的数字资产"
          },
          {
            title: "快速便捷",
            description: "简单几步即可完成认领，无需复杂操作"
          },
          {
            title: "完全去中心化",
            description: "基于 Solana 区块链，确保数据永久性和透明度"
          }
        ].map((feature, index) => (
          <div 
            key={index}
            className="rounded-lg bg-gray-800 p-6 text-center"
          >
            <h3 className="mb-4 text-xl font-bold">{feature.title}</h3>
            <p className="text-gray-300">{feature.description}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
