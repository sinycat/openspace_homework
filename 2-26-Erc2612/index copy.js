import { createPublicClient, createWalletClient, http, hexToSignature } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { sepolia } from 'viem/chains';
import { ERC2612Abi, TokenBankAbi } from './abis.js';
import dotenv from 'dotenv';
dotenv.config();

// 使用 process.env 来获取环境变量
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL;
const PRIVATE_KEY = `0x${process.env.PRIVATE_KEY}`;

// 合约 ABI
const erc2612Abi = ERC2612Abi;
const tokenBankAbi = TokenBankAbi;


async function main() {
  console.log('开始执行交易流程...');
  
  // 设置客户端
  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(SEPOLIA_RPC_URL)
  });
  console.log('Public Client 已创建');

  // 设置钱包
  const account = privateKeyToAccount(PRIVATE_KEY);
  const walletClient = createWalletClient({
    account,
    chain: sepolia,
    transport: http(SEPOLIA_RPC_URL)
  });
  console.log('钱包客户端已创建, 地址:', account.address);

  // 合约地址 - 确保地址格式正确
  const erc2612Address = '0xd9D70214a9dB2D7d9D77Bfc59719809e1D3F1b20';
  const tokenBankAddress = '0x42E9017Bee8E56D8D0b8f0BC718fBC88B825dd17';

  // 设置参数
  const amount = 100n * 10n ** 18n; // 100 tokens
  const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600); // 1小时后过期

  // 获取nonce
  const nonce = await publicClient.readContract({
    address: erc2612Address,
    abi: erc2612Abi,
    functionName: 'nonces',
    args: [account.address]
  });

  // 获取代币名称
  const name = await publicClient.readContract({
    address: erc2612Address,
    abi: erc2612Abi,
    functionName: 'name'
  });

  console.log('准备签名参数:');
  console.log('- 金额:', amount.toString());
  console.log('- 截止时间:', new Date(Number(deadline) * 1000).toLocaleString());
  console.log('- Nonce:', nonce.toString());
  console.log('- 代币名称:', name);

  // 准备签名数据
  console.log('开始生成签名...');
  const signature = await walletClient.signTypedData({
    domain: {
      name,
      version: '1',
      chainId: sepolia.id,
      verifyingContract: erc2612Address
    },
    types: {
      Permit: [
        { name: 'owner', type: 'address' },
        { name: 'spender', type: 'address' },
        { name: 'value', type: 'uint256' },
        { name: 'nonce', type: 'uint256' },
        { name: 'deadline', type: 'uint256' }
      ]
    },
    primaryType: 'Permit',
    message: {
      owner: account.address,
      spender: tokenBankAddress,
      value: amount,
      nonce,
      deadline
    }
  });

  // 解析签名 - 使用新的方式
  const signatureBytes = signature.slice(2);
  const r = `0x${signatureBytes.slice(0, 64)}`;
  const s = `0x${signatureBytes.slice(64, 128)}`;
  const v = parseInt(signatureBytes.slice(128, 130), 16);

  console.log('签名生成完成');
  console.log('签名已解析:');
  console.log('- v:', v);
  console.log('- r:', r);
  console.log('- s:', s);

  console.log('TokenBank 地址:', tokenBankAddress);
  console.log('准备调用 permitDeposit...');
  
  const hash = await walletClient.writeContract({
    address: '0x42E9017Bee8E56D8D0b8f0BC718fBC88B825dd17',
    abi: tokenBankAbi,
    functionName: 'permitDeposit',
    account,
    args: [100n * 10n ** 18n, v, r, s]
  });

  console.log('交易已提交');
  console.log('交易哈希:', hash);
  
  console.log('等待交易确认中...');
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  console.log('交易已确认');
  console.log('区块号:', receipt.blockNumber);
  console.log('Gas 使用量:', receipt.gasUsed.toString());
  console.log('交易状态:', receipt.status === 'success' ? '成功' : '失败');
}

main().catch((error) => {
  console.error('执行过程中发生错误:');
  console.error('错误信息:', error.message);
  if (error.cause) {
    console.error('错误原因:', error.cause);
  }
  process.exit(1);
});
