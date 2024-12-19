
import React from 'react';
import { ethers } from 'ethers';

const MintingTokenComponent: React.FC = () => {
  const [account, setAccount] = React.useState<string>('');
  const [balance, setBalance] = React.useState<string>('0');
  const [totalSupply, setTotalSupply] = React.useState<string>('0');
  const [mintAmount, setMintAmount] = React.useState<string>('');
  const [burnAmount, setBurnAmount] = React.useState<string>('');
  const [isOwner, setIsOwner] = React.useState<boolean>(false);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string>('');

  const contractAddress = '0xc18690BF65dB81Fd1bC7bBa211eA13cE1803692A';
  const chainId = 17000;
  const maxSupply = ethers.utils.parseEther('1000000');

  const abi = [
    "function mint(address to, uint256 amount) public",
    "function burn(uint256 amount) public",
    "function balanceOf(address account) public view returns (uint256)",
    "function totalSupply() public view returns (uint256)",
    "function owner() public view returns (address)",
  ];

  const connectWallet = async () => {
    try {
      setLoading(true);
      setError('');
      if (typeof window.ethereum !== 'undefined') {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        const network = await provider.getNetwork();
        if (network.chainId !== chainId) {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: `0x${chainId.toString(16)}` }],
          });
        }
        const signer = provider.getSigner();
        const address = await signer.getAddress();
        setAccount(address);
        const contract = new ethers.Contract(contractAddress, abi, signer);
        const balance = await contract.balanceOf(address);
        setBalance(ethers.utils.formatEther(balance));
        const totalSupply = await contract.totalSupply();
        setTotalSupply(ethers.utils.formatEther(totalSupply));
        const owner = await contract.owner();
        setIsOwner(owner.toLowerCase() === address.toLowerCase());
      } else {
        setError('Please install MetaMask!');
      }
    } catch (err) {
      setError('Failed to connect wallet: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const mintTokens = async () => {
    if (!account || !mintAmount) return;
    try {
      setLoading(true);
      setError('');
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(contractAddress, abi, signer);
      const amount = ethers.utils.parseEther(mintAmount);
      const estimatedGas = await contract.estimateGas.mint(account, amount);
      const gasWithBuffer = estimatedGas.mul(120).div(1000);
      const tx = await contract.mint(account, amount, { gasLimit: gasWithBuffer });
      await tx.wait();
      await updateBalanceAndSupply();
      setMintAmount('');
    } catch (err) {
      setError('Failed to mint tokens: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const burnTokens = async () => {
    if (!account || !burnAmount) return;
    try {
      setLoading(true);
      setError('');
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(contractAddress, abi, signer);
      const amount = ethers.utils.parseEther(burnAmount);
      const estimatedGas = await contract.estimateGas.burn(amount);
      const gasWithBuffer = estimatedGas.mul(120).div(100);
      const tx = await contract.burn(amount, { gasLimit: gasWithBuffer });
      await tx.wait();
      await updateBalanceAndSupply();
      setBurnAmount('');
    } catch (err) {
      setError('Failed to burn tokens: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const updateBalanceAndSupply = async () => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(contractAddress, abi, signer);
    const balance = await contract.balanceOf(account);
    setBalance(ethers.utils.formatEther(balance));
    const totalSupply = await contract.totalSupply();
    setTotalSupply(ethers.utils.formatEther(totalSupply));
  };

  React.useEffect(() => {
    connectWallet();
  }, []);

  return (
    <div className="p-5 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-4">Minting Token Interface</h1>
      
      {!account ? (
        <button onClick={connectWallet} className="bg-blue-500 text-white p-2 rounded-lg mb-4">
          Connect Wallet
        </button>
      ) : (
        <div className="mb-4">
          <p>Connected: {account}</p>
          <p>Balance: {balance} MTK</p>
        </div>
      )}

      {isOwner && (
        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-2">Mint Tokens (Owner Only)</h2>
          <input
            type="number"
            value={mintAmount}
            onChange={(e) => setMintAmount(e.target.value)}
            placeholder="Amount to mint"
            className="border p-2 mr-2"
          />
          <button onClick={mintTokens} className="bg-green-500 text-white p-2 rounded-lg">
            Mint
          </button>
        </div>
      )}

      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2">Burn Tokens</h2>
        <input
          type="number"
          value={burnAmount}
          onChange={(e) => setBurnAmount(e.target.value)}
          placeholder="Amount to burn"
          className="border p-2 mr-2"
        />
        <button onClick={burnTokens} className="bg-red-500 text-white p-2 rounded-lg">
          Burn
        </button>
      </div>

      <div className="mb-4">
        <p>Total Supply: {totalSupply} MTK</p>
        <p>Max Supply: {ethers.utils.formatEther(maxSupply)} MTK</p>
      </div>

      {loading && <p className="text-blue-500">Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}
    </div>
  );
};

export { MintingTokenComponent as component };
