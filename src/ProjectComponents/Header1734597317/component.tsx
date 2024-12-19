
import React from 'react';
import * as ethers from 'ethers';

const CONTRACT_ADDRESS = '0xc18690BF65dB81Fd1bC7bBa211eA13cE1803692A';
const CHAIN_ID = 17000;

const ABI = [
  "function mint(address to, uint256 amount) public",
  "function burn(uint256 amount) public",
  "function balanceOf(address account) public view returns (uint256)",
  "function totalSupply() public view returns (uint256)",
  "function owner() public view returns (address)",
  "function MAX_SUPPLY() public view returns (uint256)"
];

const MintingContractInteraction: React.FC = () => {
  const [provider, setProvider] = React.useState<ethers.providers.Web3Provider | null>(null);
  const [signer, setSigner] = React.useState<ethers.Signer | null>(null);
  const [contract, setContract] = React.useState<ethers.Contract | null>(null);
  const [userAddress, setUserAddress] = React.useState<string>('');
  const [isOwner, setIsOwner] = React.useState<boolean>(false);
  const [tokenBalance, setTokenBalance] = React.useState<string>('');
  const [totalSupply, setTotalSupply] = React.useState<string>('');
  const [maxSupply, setMaxSupply] = React.useState<string>('');
  const [mintAmount, setMintAmount] = React.useState<string>('');
  const [burnAmount, setBurnAmount] = React.useState<string>('');
  const [result, setResult] = React.useState<string>('');
  const [isLoading, setIsLoading] = React.useState<boolean>(false);

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
        const address = await signer.getAddress();
        setUserAddress(address);
        await updateBalanceAndSupply(contract, address);
        await checkOwnership(contract, address);
        await updateMaxSupply(contract);
      } catch (error) {
        console.error('Failed to connect wallet:', error);
        setResult('Failed to connect wallet. Please try again.');
      }
    } else {
      setResult('Please install MetaMask or another Web3 wallet.');
    }
  };

  const updateBalanceAndSupply = async (contract: ethers.Contract, address: string) => {
    try {
      const balance = await contract.balanceOf(address);
      setTokenBalance(ethers.utils.formatUnits(balance, 18));
      const supply = await contract.totalSupply();
      setTotalSupply(ethers.utils.formatUnits(supply, 18));
    } catch (error) {
      console.error('Error updating balance and supply:', error);
      setResult('Error updating balance and supply. Please try again.');
    }
  };

  const checkOwnership = async (contract: ethers.Contract, address: string) => {
    try {
      const ownerAddress = await contract.owner();
      setIsOwner(ownerAddress.toLowerCase() === address.toLowerCase());
    } catch (error) {
      console.error('Error checking ownership:', error);
    }
  };

  const updateMaxSupply = async (contract: ethers.Contract) => {
    try {
      const maxSupplyBN = await contract.MAX_SUPPLY();
      setMaxSupply(ethers.utils.formatUnits(maxSupplyBN, 18));
    } catch (error) {
      console.error('Error updating max supply:', error);
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

  const mintTokens = async () => {
    if (!contract || !signer) {
      await connectWallet();
      if (!contract || !signer) return;
    }
    setIsLoading(true);
    try {
      const amount = ethers.utils.parseUnits(mintAmount, 18);
      const estimatedGas = await executeWithRetry(() => contract.estimateGas.mint(userAddress, amount));
      const gasWithBuffer = estimatedGas.mul(120).div(100);
      const tx = await executeWithRetry(() => contract.mint(userAddress, amount, { gasLimit: gasWithBuffer }));
      setResult('Minting transaction submitted. Waiting for confirmation...');
      await tx.wait();
      setResult(`Successfully minted ${mintAmount} tokens.`);
      await updateBalanceAndSupply(contract, userAddress);
    } catch (error: any) {
      console.error('Error minting tokens:', error);
      if (error.message.includes('Minting would exceed max supply')) {
        setResult('Error: Minting would exceed max supply. Please enter a smaller amount.');
      } else {
        setResult('Error minting tokens. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const burnTokens = async () => {
    if (!contract || !signer) {
      await connectWallet();
      if (!contract || !signer) return;
    }
    setIsLoading(true);
    try {
      const amount = ethers.utils.parseUnits(burnAmount, 18);
      const estimatedGas = await executeWithRetry(() => contract.estimateGas.burn(amount));
      const gasWithBuffer = estimatedGas.mul(120).div(100);
      const tx = await executeWithRetry(() => contract.burn(amount, { gasLimit: gasWithBuffer }));
      setResult('Burning transaction submitted. Waiting for confirmation...');
      await tx.wait();
      setResult(`Successfully burned ${burnAmount} tokens.`);
      await updateBalanceAndSupply(contract, userAddress);
    } catch (error: any) {
      console.error('Error burning tokens:', error);
      if (error.message.includes('burn amount exceeds balance')) {
        setResult('Error: Burn amount exceeds balance. Please enter a smaller amount.');
      } else {
        setResult('Error burning tokens. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const isValidNumber = (value: string) => {
    return !isNaN(Number(value)) && Number(value) > 0;
  };

  return (
    <div className="p-5">
      <h1 className="text-2xl font-bold mb-4">Minting Contract Interaction</h1>
      <div className="mb-4">
        <button onClick={connectWallet} className="bg-blue-500 text-white p-2 rounded-lg" disabled={isLoading}>
          Connect Wallet
        </button>
        {userAddress && <p className="mt-2">Connected Address: {userAddress}</p>}
      </div>
      <div className="mb-4">
        <p>Token Balance: {tokenBalance} MTK</p>
        <p>Total Supply: {totalSupply} MTK</p>
        <p>Max Supply: {maxSupply} MTK</p>
        <p>Remaining Mintable: {maxSupply && totalSupply ? (Number(maxSupply) - Number(totalSupply)).toFixed(18) : '0'} MTK</p>
      </div>
      {isOwner && (
        <div className="mb-4">
          <input
            type="text"
            value={mintAmount}
            onChange={(e) => setMintAmount(e.target.value)}
            placeholder="Amount to mint"
            className="border p-2 rounded-lg w-full"
          />
          <button 
            onClick={mintTokens} 
            className="bg-green-500 text-white p-2 rounded-lg mt-2"
            disabled={isLoading || !isValidNumber(mintAmount)}
          >
            Mint Tokens
          </button>
        </div>
      )}
      <div className="mb-4">
        <input
          type="text"
          value={burnAmount}
          onChange={(e) => setBurnAmount(e.target.value)}
          placeholder="Amount to burn"
          className="border p-2 rounded-lg w-full"
        />
        <button 
          onClick={burnTokens} 
          className="bg-red-500 text-white p-2 rounded-lg mt-2"
          disabled={isLoading || !isValidNumber(burnAmount)}
        >
          Burn Tokens
        </button>
      </div>
      <div className="mt-4 p-4 bg-gray-100 rounded-lg">
        <h2 className="font-bold">Result:</h2>
        <p>{result}</p>
      </div>
      {isLoading && <div className="mt-4 text-center">Processing transaction... Please wait.</div>}
    </div>
  );
};

export { MintingContractInteraction as component };
