import { createPublicClient, http } from 'viem';
import { mainnet } from 'viem/chains';


// 创建公共客户端
const publicClient = createPublicClient({
    chain: mainnet,
    transport: http('https://rpc.payload.de')
});

// NFT 合约地址
const contractAddress = '0x0483b0dfc6c78062b9e999a82ffb795925381415';

// ERC721 ABI 片段，包含 ownerOf 和 tokenURI 方法
const erc721ABI = [
    {
        "name": "ownerOf",
        "type": "function",
        "inputs": [
            {
                "name": "tokenId",
                "type": "uint256"
            }
        ],
        "outputs": [
            {
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view"
    },
    {
        "name": "tokenURI",
        "type": "function",
        "inputs": [
            {
                "name": "tokenId",
                "type": "uint256"
            }
        ],
        "outputs": [
            {
                "name": "",
                "type": "string"
            }
        ],
        "stateMutability": "view"
    }
];

// 要查询的 NFT 的 tokenId
const tokenId = 1;

// 读取指定 NFT 的持有人地址
async function getNFTOwner() {
    try {
        const owner = await publicClient.readContract({
            address: contractAddress,
            abi: erc721ABI,
            functionName: 'ownerOf',
            args: [tokenId]
        });
        console.log(`NFT (tokenId: ${tokenId}) 的持有人地址是: ${owner}`);
    } catch (error) {
        console.error('获取持有人地址时出错:', error);
    }
}

// 读取指定 NFT 的元数据 URI
async function getNFTMetadataURI() {
    try {
        const metadataURI = await publicClient.readContract({
            address: contractAddress,
            abi: erc721ABI,
            functionName: 'tokenURI',
            args: [tokenId]
        });
        console.log(`NFT (tokenId: ${tokenId}) 的元数据 URI 是: ${metadataURI}`);
    } catch (error) {
        console.error('获取元数据 URI 时出错:', error);
    }
}

// 执行查询
async function main() {
    await getNFTOwner();
    await getNFTMetadataURI();
}

main();