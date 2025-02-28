import { createPublicClient, http, parseAbiItem } from 'viem';
import { mainnet } from 'viem/chains';
import dotenv from 'dotenv';
import fs from 'fs/promises'; // 使用 Node.js 的 fs/promises 模块进行异步文件操作

dotenv.config();

// 使用 process.env 来获取环境变量
const MAIN_NET_RPC_URL = process.env.MAIN_NET_RPC_URL;

async function getRecentUSDCTransfers() {
    // 创建公共客户端连接主网
    const client = createPublicClient({
        chain: mainnet,
        transport: http(MAIN_NET_RPC_URL)
    });

    // 获取当前最新区块号
    const latestBlock = await client.getBlockNumber();
    // 计算起始区块（最近100个区块）
    const fromBlock = BigInt(latestBlock) - BigInt(99);

    // USDC 合约地址
    const usdcAddress = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';

    // 定义 Transfer 事件的 ABI
    const transferEvent = parseAbiItem(
        'event Transfer(address indexed from, address indexed to, uint256 value)'
    );

    try {
        // 获取事件日志
        const logs = await client.getLogs({
            address: usdcAddress,
            event: transferEvent,
            fromBlock: fromBlock,
            toBlock: latestBlock
        });

        // 准备存储到文件的字符串
        let fileContent = '';

        // 处理并格式化每条转账记录
        for (const log of logs) {
            const from = log.args.from;
            const to = log.args.to;
            // USDC 有 6 位小数，将 value 转换为可读格式
            const amount = Number(log.args.value) / 1e6;
            const txHash = log.transactionHash;

            const record = `从 ${from} 转账给 ${to} ${amount} USDC ,交易ID：${txHash}\n`;
            console.log(record.trim()); // 输出到控制台
            fileContent += record; // 添加到文件内容
        }

        // 添加总计信息
        const summary = `\n总计找到 ${logs.length} 条转账记录\n`;
        console.log(summary.trim());
        fileContent += summary;

        // 将内容写入 transferRecord.txt 文件（如果文件不存在会自动创建）
        await fs.writeFile('transferRecord.txt', fileContent, { encoding: 'utf8' });
        console.log('转账记录已成功保存到 transferRecord.txt 文件');

    } catch (error) {
        console.error('查询或写入文件失败:', error);
    }
}

// 执行查询
getRecentUSDCTransfers();