
import React from 'react';
import { ethers } from 'ethers';

const CONTRACT_ADDRESS = '0xaEe0F2B70662125932034Df60193914E3A680F16';
const CHAIN_ID = 17000;

const ABI = [
  "function stake() public payable",
  "function unstake(uint256 amount) external",
  "function claimRewards() external",
  "function getStakedBalance(address account) external view returns (uint256)",
  "function getPendingRewards(address account) external view returns (uint256)"
];

const StakingContractInteraction: React.FC = () => {
  const [provider, setProvider] = React.useState<ethers.providers.Web3Provider | null>(null);
  const [contract, setContract] = React.useState<ethers.Contract | null>(null);
  const [result, setResult] = React.useState<string>('');
  const [stakeAmount, setStakeAmount] = React.useState<string>('');
  const [unstakeAmount, setUnstakeAmount] = React.useState<string>('');
  const [stakedBalance, setStakedBalance] = React.useState<string>('');
  const [pendingRewards, setPendingRewards] = React.useState<string>('');

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

  const stake = async () => {
    if (!await checkConnection() || !contract) return;
    try {
      const amount = ethers.utils.parseEther(stakeAmount);
      const signer = provider!.getSigner();
      const balance = await signer.getBalance();
      if (balance.lt(amount)) {
        setResult("Insufficient ETH balance for staking.");
        return;
      }
      const estimatedGas = await executeWithRetry(() => contract.estimateGas.stake({ value: amount }));
      const gasWithBuffer = estimatedGas.mul(120).div(100);
      const tx = await executeWithRetry(() => contract.stake({ value: amount, gasLimit: gasWithBuffer }));
      await tx.wait();
      setResult("Staking successful!");
      await updateBalances();
    } catch (error) {
      console.error("Error staking:", error);
      setResult("Error staking. Please check your input and try again.");
    }
  };

  const unstake = async () => {
    if (!await checkConnection() || !contract) return;
    try {
      const amount = ethers.utils.parseEther(unstakeAmount);
      const estimatedGas = await executeWithRetry(() => contract.estimateGas.unstake(amount));
      const gasWithBuffer = estimatedGas.mul(120).div(100);
      const tx = await executeWithRetry(() => contract.unstake(amount, { gasLimit: gasWithBuffer }));
      await tx.wait();
      setResult("Unstaking successful!");
      await updateBalances();
    } catch (error) {
      console.error("Error unstaking:", error);
      setResult("Error unstaking. Please check your input and try again.");
    }
  };

  const claimRewards = async () => {
    if (!await checkConnection() || !contract) return;
    try {
      const estimatedGas = await executeWithRetry(() => contract.estimateGas.claimRewards());
      const gasWithBuffer = estimatedGas.mul(120).div(100);
      const tx = await executeWithRetry(() => contract.claimRewards({ gasLimit: gasWithBuffer }));
      await tx.wait();
      setResult("Rewards claimed successfully!");
      await updateBalances();
    } catch (error) {
      console.error("Error claiming rewards:", error);
      setResult("Error claiming rewards. Please try again.");
    }
  };

  const updateBalances = async () => {
    if (!await checkConnection() || !contract || !provider) return;
    try {
      const signer = provider.getSigner();
      const address = await signer.getAddress();
      const stakedBalance = await executeWithRetry(() => contract.getStakedBalance(address));
      const pendingRewards = await executeWithRetry(() => contract.getPendingRewards(address));
      setStakedBalance(ethers.utils.formatEther(stakedBalance));
      setPendingRewards(ethers.utils.formatEther(pendingRewards));
    } catch (error) {
      console.error("Error updating balances:", error);
    }
  };

  React.useEffect(() => {
    if (contract && provider) {
      updateBalances();
    }
  }, [contract, provider]);

  return (
    <div className="bg-gray-100 min-h-screen p-5">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md p-5">
        <h1 className="text-2xl font-bold mb-4">ETH Staking Contract Interaction</h1>
        
        <div className="mb-4">
          <p>Contract Address: {CONTRACT_ADDRESS}</p>
          <p>Chain ID: {CHAIN_ID}</p>
        </div>

        <div className="mb-4">
          <p>Staked Balance: {stakedBalance} ETH</p>
          <p>Pending Rewards: {pendingRewards} tokens</p>
        </div>

        <div className="space-y-4">
          <div>
            <input
              type="text"
              value={stakeAmount}
              onChange={(e) => setStakeAmount(e.target.value)}
              placeholder="Enter amount of ETH to stake"
              className="border rounded-lg px-4 py-2 w-full"
            />
            <button
              onClick={stake}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 mt-2"
            >
              Stake ETH
            </button>
          </div>

          <div>
            <input
              type="text"
              value={unstakeAmount}
              onChange={(e) => setUnstakeAmount(e.target.value)}
              placeholder="Enter amount of ETH to unstake"
              className="border rounded-lg px-4 py-2 w-full"
            />
            <button
              onClick={unstake}
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 mt-2"
            >
              Unstake ETH
            </button>
          </div>

          <button
            onClick={claimRewards}
            className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600"
          >
            Claim Rewards
          </button>

          <button
            onClick={updateBalances}
            className="bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600"
          >
            Update Balances
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

export { StakingContractInteraction as component };
