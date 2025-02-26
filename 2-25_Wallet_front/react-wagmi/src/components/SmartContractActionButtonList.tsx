//
// if you are not going to read or write smart contract, you can delete this file
//

import { useAppKitNetwork, useAppKitAccount  } from '@reown/appkit/react'
import { useReadContract, useWriteContract } from 'wagmi'
import { useEffect, useState } from 'react'
const storageABI = [
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "account",
				"type": "address"
			}
		],
		"name": "balanceOf",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "retrieve",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "num",
				"type": "uint256"
			}
		],
		"name": "store",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	}
]

// const storageSC = "0xEe6D291CC60d7CeD6627fA4cd8506912245c8cA4" 
// 测试合约地址
const storageSC = "0x41c9cd4b90ed940c29269B2EA133A41D556fa8C7" 
// 测试账户地址
const account= "0x076432424F9E407fC64FE24F982fA07528FB46E5"

export const SmartContractActionButtonList = () => {
    const { isConnected } = useAppKitAccount() // AppKit hook to get the address and check if the user is connected
    const { chainId } = useAppKitNetwork()
    const { writeContract, isSuccess } = useWriteContract()
    const [balance, setBalance] = useState<string>('')

    const readContract = useReadContract({
      address: storageSC,
      abi: storageABI,
      functionName: 'balanceOf',
      args: [account],
      query: {
        enabled: false,
      }
    })

    useEffect(() => {
      if (isSuccess) {
        console.log("contract write success");
      }
    }, [isSuccess])

    const handleReadSmartContract = async () => {
      console.log("Reading account balance");
      const { data } = await readContract.refetch();
      const balanceValue = data ? data.toString() : '0';
      setBalance(balanceValue);
      console.log("Balance: ", balanceValue);
    }

    const handleWriteSmartContract = () => {
        console.log("Write Sepolia Smart Contract")
        writeContract({
          address: storageSC,
          abi: storageABI,
          functionName: 'store',
          args: [123n],
        })
    }


  return (
    isConnected && chainId === 11155111 && ( // Only show the buttons if the user is connected to Sepolia
    <div >
        <button onClick={handleReadSmartContract}>SepoliaBank存款余额</button>
        {balance && <p>账户余额: {balance}</p>}
        <button onClick={handleWriteSmartContract}>Write Sepolia Smart Contract</button>  
    </div>
    )
  )
}
