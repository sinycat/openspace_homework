import { createPublicClient, http, parseAbiItem, decodeEventLog } from 'viem'
import { mainnet } from 'viem/chains'
import dotenv from 'dotenv'
dotenv.config()

// 使用 process.env 来获取环境变量
const MAIN_NET_RPC_URL = process.env.MAIN_NET_RPC_URL;
// USDT 合约地址
const USDT_ADDRESS = '0xdac17f958d2ee523a2206206994597c13d831ec7'

// USDT Transfer 事件签名
const transferEvent = parseAbiItem(
  'event Transfer(address indexed from, address indexed to, uint256 value)'
)

// USDT Transfer 事件签名
const TRANSFER_EVENT_SIGNATURE = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'

async function startMonitoring() {
  // 创建以太坊主网客户端
  const client = createPublicClient({
    chain: mainnet,
    
    // 替换为你的 RPC URL
    transport: http(MAIN_NET_RPC_URL) 
  })

  console.log('开始监听以太坊主网 USDT 转账和区块信息...')

  // 监听新区块
  client.watchBlocks({
    onBlock: async (block) => {
      // 打印区块信息
      console.log(
        `区块高度: ${block.number} 区块hash: ${block.hash}`
      )

      try {
        // 获取区块中的交易
        const blockWithTransactions = await client.getBlock({
          blockNumber: block.number,
          includeTransactions: true
        })

        console.log(`区块 ${block.number} 包含 ${blockWithTransactions.transactions.length} 笔交易`)

        // 筛选包含 USDT 转账的交易
        for (const tx of blockWithTransactions.transactions) {
          if (tx.to?.toLowerCase() === USDT_ADDRESS.toLowerCase()) {
            console.log(`发现 USDT 合约交互交易: ${tx.hash}`)
            
            // 获取交易收据以获取事件日志
            const receipt = await client.getTransactionReceipt({
              hash: tx.hash
            })

            console.log(`交易 ${tx.hash} 包含 ${receipt.logs.length} 个日志`)

            // 解析 Transfer 事件
            for (const log of receipt.logs) {
              if (log.address.toLowerCase() === USDT_ADDRESS.toLowerCase()) {
                console.log(`发现 USDT 合约日志，主题签名: ${log.topics[0]}`)
                
                if (log.topics[0] === TRANSFER_EVENT_SIGNATURE) {
                  try {
                    const decodedLog = decodeEventLog({
                      abi: [transferEvent],
                      data: log.data,
                      topics: log.topics
                    })

                    // USDT 使用 6 位小数
                    const amount = Number(decodedLog.args.value) / 1e6

                    // 打印转账信息
                    console.log(
                      `在 ${block.number} 区块 hash ${tx.hash} 交易中` +
                      `从 ${decodedLog.args.from} ` +
                      `转账 ${amount} USDT 到 ${decodedLog.args.to}`
                    )
                  } catch (decodeError) {
                    console.error('解析日志失败:', decodeError)
                  }
                }
              }
            }
          }
        }
      } catch (error) {
        console.error('处理区块时出错:', error)
      }
    },
    onError: (error) => {
      console.error('监听出错:', error)
    }
  })
}

// 启动监听
startMonitoring().catch(console.error)