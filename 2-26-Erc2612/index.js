// index.js
import { createWalletClient, http, publicActions } from 'viem';
import { sepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import { TokenBankAbi, ERC2612Abi } from './abis.js';
import dotenv from 'dotenv';
dotenv.config();

// 合约地址
const ERC2612_ADDRESS = '0xd9D70214a9dB2D7d9D77Bfc59719809e1D3F1b20';
const TOKENBANK_ADDRESS = '0x2238b46980009d78fb66b55964Dea330e1585456';

// 使用 process.env 来获取环境变量
const PRIVATE_KEY = `0x${process.env.PRIVATE_KEY}`;
const RPC_URL = process.env.SEPOLIA_RPC_URL;

async function main() {
    const account = privateKeyToAccount(PRIVATE_KEY);
    const walletClient = createWalletClient({
        account,
        chain: sepolia,
        transport: http(RPC_URL)
    }).extend(publicActions);

    const amount = BigInt('1000000000000000000'); // 1 token (假设18位小数)
    const deadline = Math.floor(Date.now() / 1000) + 60 * 60; // 1小时后过期

    // 获取 nonce
    const nonce = await walletClient.readContract({
        address: ERC2612_ADDRESS,
        abi: ERC2612Abi,
        functionName: 'nonces',
        args: [account.address]
    });

    // 构造 permit 数据
    const permitData = {
        owner: account.address,
        spender: TOKENBANK_ADDRESS,
        value: amount,
        deadline: BigInt(deadline),
        nonce: nonce
    };

    // 生成签名
    const signature = await walletClient.signTypedData({
        account,
        domain: {
            name: 'MyERC2612', // 请确保与实际 token 名称一致
            version: '1',
            chainId: sepolia.id,
            verifyingContract: ERC2612_ADDRESS
        },
        types: {
            EIP712Domain: [
                { name: 'name', type: 'string' },
                { name: 'version', type: 'string' },
                { name: 'chainId', type: 'uint256' },
                { name: 'verifyingContract', type: 'address' }
            ],
            Permit: [
                { name: 'owner', type: 'address' },
                { name: 'spender', type: 'address' },
                { name: 'value', type: 'uint256' },
                { name: 'nonce', type: 'uint256' },
                { name: 'deadline', type: 'uint256' }
            ]
        },
        primaryType: 'Permit',
        message: permitData
    });

    const { v, r, s } = splitSignature(signature);
    console.log(v,r,s);

    // 调用 TokenBank 的 permitDeposit
    const tx = await walletClient.writeContract({
        address: TOKENBANK_ADDRESS,
        abi: TokenBankAbi,
        functionName: 'permitDeposit',
        args: [
            //   permitData, // 传递结构体
            [permitData.owner,      // 代币持有者
            permitData.spender,   // 接收方
            permitData.value,  
            permitData.nonce,   // 转账金额
            permitData.deadline+1n,],     
            v,
            r,
            s
        ]
    });

    console.log('Transaction hash:', tx);
    const receipt = await walletClient.waitForTransactionReceipt({ hash: tx });
    console.log('Transaction confirmed in block:', receipt.blockNumber);
}

function splitSignature(signature) {
    return {
        r: `0x${signature.substring(2, 66)}`,
        s: `0x${signature.substring(66, 130)}`,
        v: parseInt(signature.substring(130, 132), 16)
    };
}

try {
    await main();
} catch (error) {
    console.error(error);
}