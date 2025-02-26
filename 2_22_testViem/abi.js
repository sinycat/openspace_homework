import { encodeFunctionData } from 'viem'
// ERC20 transfer 函数的 ABI
const erc20TransferABI = [
  {
    "inputs": [
      { "name": "to", "type": "address" },
      { "name": "value", "type": "uint256" }
    ],
    "name": "transfer",
    "outputs": [{ "name": "", "type": "bool" }],
    "stateMutability": "nonpayable",
    "type": "function"
  }
]

// 生成 transfer 的 _data
async function generateTransferData() {
  const recipient = '0x583031D1113aD414F02576BD6afaBfb302140225' // 目标地址
  const amount = BigInt('100000000000000000000') // 100 个代币（假设 decimals = 18）

  // 编码 transfer 函数调用数据
  const data = encodeFunctionData({
    abi: erc20TransferABI,
    functionName: 'transfer',
    args: [recipient, amount]
  })

  console.log('Generated _data:', data)
  // return data
}


generateTransferData()