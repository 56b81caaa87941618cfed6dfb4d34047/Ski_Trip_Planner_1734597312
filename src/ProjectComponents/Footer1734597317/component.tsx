
import React from 'react';
import { ethers } from 'ethers';

const contractABI = [
  "function mint(address to, uint256 amount) public",
  "function burn(uint256 amount) public",
  "function balanceOf(address account) public view returns (uint256)",
  "function totalSupply() public view returns (uint256)",
  "function MAX_SUPPLY() public view returns (uint256)",
  "function owner() public view returns (address)"
];

const contractAddress = "0xc18690BF65dB81Fd1bC7bBa211eA13cE1803692A";
const chainId = 17000;

export const MintingContractInteraction: React.FC = () => {
  const [account, setAccount] = React.useState<string | null>(null);
  const [balance, setBalance] = React.useState<string>("0");
  const [totalSupply, setTotalSupply] = React.useState<string>("0");
  const [maxSupply, setMaxSupply] = React.useState<string>("0");
  const [mintAmount, setMintAmount] = React.useState<string>("");
  const [burnAmount, setBurnAmount] = React.useState<string>("");
  const [isOwner, setIsOwner] = React.useState<boolean>(false);

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const address = await signer.getAddress();
        setAccount(address);
        await checkOwner(address, provider);
        await updateBalanceAndSupply(address, provider);
      } catch (error) {
        console.error("Failed to connect wallet:", error);
      }
    } else {
      console.error("Metamask is not installed");
    }
  };

  const checkOwner = async (address: string, provider: ethers.providers.Web3Provider) => {
    const contract = new ethers.Contract(contractAddress, contractABI, provider);
    try {
      const owner = await contract.owner();
      setIsOwner(owner.toLowerCase() === address.toLowerCase());
    } catch (error) {
      console.error("Failed to check owner:", error);
    }
  };

  const updateBalanceAndSupply = async (address: string, provider: ethers.providers.Web3Provider) => {
    const contract = new ethers.Contract(contractAddress, contractABI, provider);
    try {
      const balance = await contract.balanceOf(address);
      setBalance(ethers.utils.formatEther(balance));
      const totalSupply = await contract.totalSupply();
      setTotalSupply(ethers.utils.formatEther(totalSupply));
      const maxSupply = await contract.MAX_SUPPLY();
      setMaxSupply(ethers.utils.formatEther(maxSupply));
    } catch (error) {
      console.error("Failed to update balance and supply:", error);
    }
  };

  const mint = async () => {
    if (!account || !isOwner) return;
    await executeWithRetry(async () => {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const network = await provider.getNetwork();
      if (network.chainId !== chainId) {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: ethers.utils.hexValue(chainId) }],
        });
      }
      const signer = provider.getSigner();
      const contract = new ethers.Contract(contractAddress, contractABI, signer);
      const amount = ethers.utils.parseEther(mintAmount);
      const estimatedGas = await contract.estimateGas.mint(account, amount);
      const gasWithBuffer = estimatedGas.mul(120).div(100);
      const tx = await contract.mint(account, amount, { gasLimit: gasWithBuffer });
      await tx.wait();
      await updateBalanceAndSupply(account, provider);
      setMintAmount("");
    });
  };

  const burn = async () => {
    if (!account) return;
    await executeWithRetry(async () => {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const network = await provider.getNetwork();
      if (network.chainId !== chainId) {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: ethers.utils.hexValue(chainId) }],
        });
      }
      const signer = provider.getSigner();
      const contract = new ethers.Contract(contractAddress, contractABI, signer);
      const amount = ethers.utils.parseEther(burnAmount);
      const estimatedGas = await contract.estimateGas.burn(amount);
      const gasWithBuffer = estimatedGas.mul(120).div(100);
      const tx = await contract.burn(amount, { gasLimit: gasWithBuffer });
      await tx.wait();
      await updateBalanceAndSupply(account, provider);
      setBurnAmount("");
    });
  };

  const executeWithRetry = async (operation: () => Promise<void>, maxRetries = 3) => {
    for (let i = 0; i < maxRetries; i++) {
      try {
        await operation();
        return;
      } catch (err) {
        if (i === maxRetries - 1 || !(err instanceof Error) || !err.message.toLowerCase().includes('network')) throw err;
        await new Promise(r => setTimeout(r, 1000 * (i + 1)));
      }
    }
  };

  return (
    <div className="p-5">
      <h1 className="text-2xl font-bold mb-5">Minting Contract Interaction</h1>
      {!account ? (
        <button onClick={connectWallet} className="bg-blue-500 text-white p-2 rounded-lg">
          Connect Wallet
        </button>
      ) : (
        <div>
          <p className="mb-2">Connected: {account}</p>
          <p className="mb-2">Balance: {balance} MTK</p>
          <p className="mb-2">Total Supply: {totalSupply} MTK</p>
          <p className="mb-5">Max Supply: {maxSupply} MTK</p>
          {isOwner && (
            <div className="mb-5">
              <input
                type="text"
                value={mintAmount}
                onChange={(e) => setMintAmount(e.target.value)}
                placeholder="Amount to mint"
                className="border p-2 rounded-lg mr-2"
              />
              <button onClick={mint} className="bg-green-500 text-white p-2 rounded-lg">
                Mint
              </button>
            </div>
          )}
          <div>
            <input
              type="text"
              value={burnAmount}
              onChange={(e) => setBurnAmount(e.target.value)}
              placeholder="Amount to burn"
              className="border p-2 rounded-lg mr-2"
            />
            <button onClick={burn} className="bg-red-500 text-white p-2 rounded-lg">
              Burn
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export { MintingContractInteraction as component };
