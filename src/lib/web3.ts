import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import {
    Transaction,
} from '@solana/web3.js';
import { Connection, PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { createCloseAccountInstruction, createBurnInstruction } from '@solana/spl-token';
import { LAMPORTS_PER_SOL, SystemProgram } from '@solana/web3.js';
import { AccountLayout } from '@solana/spl-token';


// 定义代币信息接口
export interface TokenMetadata {
    name: string;
    symbol: string;
    uri: string; // 通常是 JSON 文件的 URI
    image: string; // 可以从 uri 中解析
    balance: number;
    decimals: number;
    address: string;
}

// 每个代币账户的租金固定值（0.002 SOL）
const TOKEN_ACCOUNT_RENT = 0.002 * LAMPORTS_PER_SOL;  // 2,000,000 lamports

export const useSolanaUtils = () => {
    const { connection } = useConnection();
    const wallet = useWallet();

    const getSolBalance = async (publicKey: PublicKey): Promise<number> => {
        if (!publicKey) return 0.0;
        
        const balance = await connection.getBalance(publicKey);
        return balance / 1e9; // 转换为 SOL
    };

    const getTokenList = async (publicKey: PublicKey): Promise<TokenMetadata[]> => {
        if (!publicKey) return [];

        try {
            // 获取所有代币账户
            const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
                publicKey,
                { programId: TOKEN_PROGRAM_ID }
            );

            console.log('获取到的账户:', tokenAccounts);

            const tokenList: TokenMetadata[] = [];

            // 处理每个代币账户
            for (const { pubkey, account } of tokenAccounts.value) {
                const parsedInfo = account.data.parsed.info;
                
                // 检查账户类型，跳过 mint 账户
                if (account.data.parsed.type !== 'account') {
                    console.log('跳过非代币账户:', pubkey.toString());
                    continue;
                }

                const tokenMint = new PublicKey(parsedInfo.mint);
                console.log('处理代币账户:', {
                    account: pubkey.toString(),
                    mint: tokenMint.toString(),
                    type: account.data.parsed.type
                });
                
                try {
                    // 获取代币元数据
                    const metadata = await getTokenMetadata(tokenMint, connection);
                    if (metadata) {
                        tokenList.push({
                            ...metadata,
                            balance: parsedInfo.tokenAmount.uiAmount,
                            decimals: parsedInfo.tokenAmount.decimals,
                            address: pubkey.toString()  // 使用代币账户地址
                        });
                    }
                } catch (error) {
                    console.error(`获取代币 ${tokenMint.toString()} 的元数据失败:`, error);
                }
            }

            return tokenList;
        } catch (error) {
            console.error('获取代币列表失败:', error);
            return [];
        }
    };

    const getTokenMetadata = async (tokenMint: PublicKey, connection: Connection): Promise<TokenMetadata | null> => {
        try {
            const [metadataPDA] = PublicKey.findProgramAddressSync(
                [
                    Buffer.from('metadata'),
                    new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s').toBuffer(),
                    tokenMint.toBuffer(),
                ],
                new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s')
            );

            const accountInfo = await connection.getAccountInfo(metadataPDA);
            if (!accountInfo) return null;

            const buffer = accountInfo.data;
            
            // 名称解析
            let nameEnd = 69;
            while (nameEnd < buffer.length && buffer[nameEnd] !== 0) {
                nameEnd++;
            }
            const name = buffer.slice(69, nameEnd).toString('utf-8').trim();

            // 从 name 结束后开始查找 symbol
            let symbolStart = nameEnd;
            while (symbolStart < buffer.length && 
                   (buffer[symbolStart] === 0 || buffer[symbolStart] < 32)) {
                symbolStart++;
            }
            
            let symbolEnd = symbolStart;
            while (symbolEnd < buffer.length && 
                   buffer[symbolEnd] >= 32 && 
                   buffer[symbolEnd] <= 126) {
                symbolEnd++;
            }
            const symbol = buffer.slice(symbolStart, symbolEnd).toString('utf-8').trim();
            
            // URI 处理
            const uriStart = buffer.indexOf('https://');
            let uri = '';
            if (uriStart !== -1) {
                let uriEnd = uriStart;
                while (uriEnd < buffer.length && 
                       buffer[uriEnd] >= 32 && 
                       buffer[uriEnd] <= 126) {
                    uriEnd++;
                }
                uri = buffer.slice(uriStart, uriEnd).toString('utf-8');
            }

            let image = '';
            try {
                if (uri) {
                    const response = await fetch(uri);
                    const json = await response.json();
                    image = json.image || '';
                }
            } catch (error) {
                console.warn('获取代币 JSON 元数据失败:', error);
            }

            return {
                name,
                symbol,
                uri,
                image,
                balance: 0,
                decimals: 0,
                address: tokenMint.toString()
            };

        } catch (error) {
            console.error('获取代币元数据失败:', error);
            return null;
        }
    };

    const closeTokenAccounts = async (
        tokenAccounts: PublicKey[],
        owner: PublicKey,
        beneficiary: PublicKey,
    ): Promise<string> => {
        try {
            const transaction = new Transaction();
            const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
            transaction.recentBlockhash = blockhash;
            transaction.feePayer = owner;

            // 获取所有代币账户信息
            const accountInfos = await connection.getMultipleAccountsInfo(tokenAccounts);
            
            for (let i = 0; i < tokenAccounts.length; i++) {
                const tokenAccount = tokenAccounts[i];
                const accountInfo = accountInfos[i];

                if (!accountInfo) continue;

                // 解析代币账户数据
                const accountState = AccountLayout.decode(Buffer.from(accountInfo.data));

                // 如果有余额，先销毁
                if (accountState.amount > 0) {
                    transaction.add(
                        createBurnInstruction(
                            tokenAccount,
                            new PublicKey(accountState.mint),
                            owner,
                            accountState.amount
                        )
                    );
                }

                // 关闭账户
                transaction.add(
                    createCloseAccountInstruction(
                        tokenAccount,
                        owner,
                        owner,
                        []
                    )
                );
            }

            if (transaction.instructions.length === 0) {
                throw new Error('没有需要处理的账户');
            }

            // 添加受益人转账
            const totalRent = TOKEN_ACCOUNT_RENT * tokenAccounts.length;
            const beneficiaryAmount = Math.floor(totalRent * 0.1);
            
            if (beneficiaryAmount > 0) {
                transaction.add(
                    SystemProgram.transfer({
                        fromPubkey: owner,
                        toPubkey: beneficiary,
                        lamports: beneficiaryAmount
                    })
                );
            }

            const signedTx = await wallet.signTransaction?.(transaction);
            if (!signedTx) throw new Error('交易签名失败');

            const signature = await connection.sendRawTransaction(
                signedTx.serialize(),
                {
                    skipPreflight: false,
                    preflightCommitment: 'confirmed',
                    maxRetries: 5
                }
            );

            await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight });
            return signature;

        } catch (error) {
            console.error('closeTokenAccounts 失败:', error);
            throw error;
        }
    };

    const createCloseAccountTransaction = async (tokenAccount: PublicKey): Promise<Transaction> => {

    };

    return {
        getSolBalance,
        getTokenMetadata,
        getTokenList,
        closeTokenAccounts,
        createCloseAccountTransaction,
    };
};