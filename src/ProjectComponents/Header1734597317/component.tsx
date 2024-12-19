
import React from 'react';
import * as ethers from 'ethers';

const CONTRACT_ADDRESS = '0x9B0C37B18FCD3D0727e62fBe912Ff72541B1E0a6';
const CHAIN_ID = 17000;

const ABI = [
  "function addMultipleUsers(tuple(uint256 id, string name, uint256 score)[] _users) external",
  "function performComplexCalculation() external",
  "function updateAllBalances(uint256 amount) external",
  "function simulateExternalCall(address[] memory _addresses) external",
  "function processLargeArray(uint256[] memory data) external pure returns (uint256)",
  "function getContractBalance() external view returns (uint256)"
];

const ComplexGasHeavyContractInteraction: React.FC = () => {
  const [provider, setProvider] = React.useState<ethers.providers.Web3Provider | null>(null);
  const [signer, setSigner] = React.useState<ethers.Signer | null>(null);
  const [contract, setContract] = React.useState<ethers.Contract | null>(null);
  const [contractBalance, setContractBalance] = React.useState<string>('');
  const [result, setResult] = React.useState<string>('');
  const [addresses, setAddresses] = React.useState<string>('');
  const [largeArray, setLargeArray] = React.useState<string>('');

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const { chainId } = await provider.getNetwork();
        if (chainId !== CHAIN_ID) {
          try {
            await window.ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: ethers.utils.hexValue(CHAIN_ID) }],
            });
          } catch (switchError) {
            console.error('Failed to switch network:', switchError);
            setResult('Please switch to the Holesky testnet (Chain ID: 17000) in your wallet.');
            return;
          }
        }
        const signer = provider.getSigner();
        const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
        setProvider(provider);
        setSigner(signer);
        setContract(contract);
        await updateContractBalance(contract);
      } catch (error) {
        console.error('Failed to connect wallet:', error);
        setResult('Failed to connect wallet. Please try again.');
      }
    } else {
      setResult('Please install MetaMask or another Web3 wallet.');
    }
  };

  const updateContractBalance = async (contract: ethers.Contract) => {
    try {
      const balance = await contract.getContractBalance();
      setContractBalance(ethers.utils.formatEther(balance));
    } catch (error) {
      console.error('Error getting contract balance:', error);
      setResult('Error getting contract balance. Please try again.');
    }
  };

  const executeWithRetry = async (operation: () => Promise<any>) => {
    const MAX_RETRIES = 3;
    for (let i = 0; i < MAX_RETRIES; i++) {
      try {
        return await operation();
      } catch (err: any) {
        if (!err.message.toLowerCase().includes('network') || i === MAX_RETRIES - 1) throw err;
        await new Promise(r => setTimeout(r, 1000 * (i + 1)));
      }
    }
  };

  const performComplexCalculation = async () => {
    if (!contract) {
      await connectWallet();
      if (!contract) return;
    }
    try {
      const estimatedGas = await executeWithRetry(() => contract.estimateGas.performComplexCalculation());
      const gasWithBuffer = estimatedGas.mul(120).div(100);
      const tx = await executeWithRetry(() => contract.performComplexCalculation({ gasLimit: gasWithBuffer }));
      await tx.wait();
      setResult('Complex calculation performed successfully.');
      await updateContractBalance(contract);
    } catch (error) {
      console.error('Error performing complex calculation:', error);
      setResult('Error performing complex calculation. Please try again.');
    }
  };

  const simulateExternalCall = async () => {
    if (!contract) {
      await connectWallet();
      if (!contract) return;
    }
    const addressArray = addresses.split(',').map(addr => addr.trim());
    try {
      const estimatedGas = await executeWithRetry(() => contract.estimateGas.simulateExternalCall(addressArray));
      const gasWithBuffer = estimatedGas.mul(120).div(100);
      const tx = await executeWithRetry(() => contract.simulateExternalCall(addressArray, { gasLimit: gasWithBuffer }));
      await tx.wait();
      setResult('External calls simulated successfully.');
      await updateContractBalance(contract);
    } catch (error) {
      console.error('Error simulating external calls:', error);
      setResult('Error simulating external calls. Please try again.');
    }
  };

  const processLargeArray = async () => {
    if (!contract) {
      await connectWallet();
      if (!contract) return;
    }
    const dataArray = largeArray.split(',').map(num => parseInt(num.trim()));
    try {
      const estimatedGas = await executeWithRetry(() => contract.estimateGas.processLargeArray(dataArray));
      const gasWithBuffer = estimatedGas.mul(120).div(100);
      const result = await executeWithRetry(() => contract.processLargeArray(dataArray, { gasLimit: gasWithBuffer }));
      setResult(`Large array processed. Result: ${result.toString()}`);
      await updateContractBalance(contract);
    } catch (error) {
      console.error('Error processing large array:', error);
      setResult('Error processing large array. Please try again.');
    }
  };

  return (
    <div className="p-5">
      <h1 className="text-2xl font-bold mb-4">Complex Gas Heavy Contract Interaction</h1>
      <div className="mb-4">
        <button onClick={connectWallet} className="bg-blue-500 text-white p-2 rounded-lg">
          Connect Wallet
        </button>
        <p className="mt-2">Contract Balance: {contractBalance} ETH</p>
      </div>
      <div className="mb-4">
        <button onClick={performComplexCalculation} className="bg-green-500 text-white p-2 rounded-lg">
          Perform Complex Calculation
        </button>
      </div>
      <div className="mb-4">
        <input
          type="text"
          value={addresses}
          onChange={(e) => setAddresses(e.target.value)}
          placeholder="Comma-separated addresses"
          className="border p-2 rounded-lg w-full"
        />
        <button onClick={simulateExternalCall} className="bg-yellow-500 text-white p-2 rounded-lg mt-2">
          Simulate External Call
        </button>
      </div>
      <div className="mb-4">
        <input
          type="text"
          value={largeArray}
          onChange={(e) => setLargeArray(e.target.value)}
          placeholder="Comma-separated numbers"
          className="border p-2 rounded-lg w-full"
        />
        <button onClick={processLargeArray} className="bg-purple-500 text-white p-2 rounded-lg mt-2">
          Process Large Array
        </button>
      </div>
      <div className="mt-4 p-4 bg-gray-100 rounded-lg">
        <h2 className="font-bold">Result:</h2>
        <p>{result}</p>
      </div>
    </div>
  );
};

export { ComplexGasHeavyContractInteraction as component };
