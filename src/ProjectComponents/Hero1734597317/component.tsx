
import React from 'react';
import { ethers } from 'ethers';

const CONTRACT_ADDRESS = '0x9B0C37B18FCD3D0727e62fBe912Ff72541B1E0a6';
const CHAIN_ID = 17000;

const ABI = [
  "function performComplexCalculation() external",
  "function processLargeArray(uint256[] memory data) external pure returns (uint256)",
  "function getContractBalance() external view returns (uint256)"
];

const ComplexGasHeavyContractInteraction: React.FC = () => {
  const [provider, setProvider] = React.useState<ethers.providers.Web3Provider | null>(null);
  const [contract, setContract] = React.useState<ethers.Contract | null>(null);
  const [result, setResult] = React.useState<string>('');
  const [inputArray, setInputArray] = React.useState<string>('');

  React.useEffect(() => {
    const initProvider = async () => {
      if (window.ethereum) {
        const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
        setProvider(web3Provider);
        const signer = web3Provider.getSigner();
        const contractInstance = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
        setContract(contractInstance);
      }
    };
    initProvider();
  }, []);

  const connectWallet = async () => {
    if (provider) {
      try {
        await provider.send("eth_requestAccounts", []);
        const network = await provider.getNetwork();
        if (network.chainId !== CHAIN_ID) {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: ethers.utils.hexValue(CHAIN_ID) }],
          });
        }
      } catch (error) {
        console.error("Failed to connect wallet:", error);
        setResult("Failed to connect wallet. Please try again.");
      }
    }
  };

  const checkConnection = async () => {
    if (!provider) {
      setResult("Please install MetaMask!");
      return false;
    }
    const accounts = await provider.listAccounts();
    if (accounts.length === 0) {
      await connectWallet();
      return false;
    }
    return true;
  };

  const performComplexCalculation = async () => {
    if (!await checkConnection() || !contract) return;
    try {
      const estimatedGas = await contract.estimateGas.performComplexCalculation();
      const gasWithBuffer = estimatedGas.mul(120).div(100);
      const tx = await contract.performComplexCalculation({ gasLimit: gasWithBuffer });
      await tx.wait();
      setResult("Complex calculation performed successfully!");
    } catch (error) {
      console.error("Error performing complex calculation:", error);
      setResult("Error performing complex calculation. Please try again.");
    }
  };

  const processLargeArray = async () => {
    if (!await checkConnection() || !contract) return;
    try {
      const arrayData = inputArray.split(',').map(num => parseInt(num.trim()));
      const result = await contract.processLargeArray(arrayData);
      setResult(`Process Large Array Result: ${result.toString()}`);
    } catch (error) {
      console.error("Error processing large array:", error);
      setResult("Error processing large array. Please check your input and try again.");
    }
  };

  const getContractBalance = async () => {
    if (!await checkConnection() || !contract) return;
    try {
      const balance = await contract.getContractBalance();
      setResult(`Contract Balance: ${ethers.utils.formatEther(balance)} ETH`);
    } catch (error) {
      console.error("Error getting contract balance:", error);
      setResult("Error getting contract balance. Please try again.");
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen p-5">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md p-5">
        <h1 className="text-2xl font-bold mb-4">Complex Gas Heavy Contract Interaction</h1>
        
        <div className="mb-4">
          <p>Contract Address: {CONTRACT_ADDRESS}</p>
          <p>Chain ID: {CHAIN_ID}</p>
        </div>

        <div className="space-y-4">
          <button
            onClick={performComplexCalculation}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
          >
            Perform Complex Calculation
          </button>

          <div>
            <input
              type="text"
              value={inputArray}
              onChange={(e) => setInputArray(e.target.value)}
              placeholder="Enter numbers separated by commas"
              className="border rounded-lg px-4 py-2 w-full"
            />
            <button
              onClick={processLargeArray}
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 mt-2"
            >
              Process Large Array
            </button>
          </div>

          <button
            onClick={getContractBalance}
            className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600"
          >
            Get Contract Balance
          </button>
        </div>

        {result && (
          <div className="mt-4 p-4 bg-gray-100 rounded-lg">
            <h2 className="font-bold">Result:</h2>
            <p>{result}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export { ComplexGasHeavyContractInteraction as component };
